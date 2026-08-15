// lib/payment-flow.ts
//
// The marketplace earning lifecycle. All money-moving state transitions in
// Konnectika live here (or in lib/payout.ts for the scheduled-payout flow),
// so API routes stay thin and the rules are testable in isolation.
//
// Lifecycle (per creator → campaign):
//   1. Brand approves the creator's APPLICATION  -> Earning created (PENDING)
//   2. Creator submits content; brand approves   -> Earning APPROVED
//   3. An ADMIN approves the earning per campaign -> Earning AVAILABLE
//      (manual settlement — there is no time-based auto-settlement)
//   4. A scheduled Payout freezes AVAILABLE earnings and, when the admin
//      marks it PAID, they become PAID. That is the ONLY settlement channel.
//
// Guard rails enforced here:
//   - One earning per approved application (unique applicationId)
//   - State machine: PENDING -> APPROVED/REJECTED -> AVAILABLE -> PAID
//     (APPROVED -> AVAILABLE is ADMIN-only; creators/brands can't settle)
//   - Campaign budget: approved creators may not exceed budgetTotal / paymentRate
//   - Brands approve submissions (which flips an earning to APPROVED); they can
//     never pay anything. Only the admin payout flow settles money.

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { calculateCreatorEarning } from "@/lib/pricing";
import { recordCreatorFee } from "@/lib/platform-revenue";

/** Thrown by payment-flow operations for rule violations (budget, state...).
 *  API routes catch it and return a 4xx with `message`. */
export class BusinessRuleError extends Error {}

// ---------------------------------------------------------------------------
// Budget / capacity
// ---------------------------------------------------------------------------

/** Maximum creators a campaign budget can pay for (floor of budget / rate). */
export function campaignMaxCreators(campaign: {
  budgetTotal: number;
  paymentRate: number;
}): number {
  if (campaign.paymentRate <= 0) return 0;
  return Math.floor(campaign.budgetTotal / campaign.paymentRate);
}

export interface BudgetCheck {
  ok: boolean;
  maxCreators: number;
  committed: number;
  error?: string;
}

/**
 * Check whether a campaign can still approve another creator. Committed
 * budget = number of non-rejected earnings for the campaign (each approved
 * application creates exactly one earning). Rejected earnings/applications
 * never consume budget.
 */
export async function assertCampaignBudget(
  tx: Prisma.TransactionClient,
  campaign: { id: string; budgetTotal: number; paymentRate: number }
): Promise<BudgetCheck> {
  const maxCreators = campaignMaxCreators(campaign);
  const committed = await tx.earning.count({
    where: { campaignId: campaign.id, status: { not: "REJECTED" } },
  });

  if (maxCreators > 0 && committed >= maxCreators) {
    return {
      ok: false,
      maxCreators,
      committed,
      error: `Campaign has reached its creator limit (${maxCreators} creators / TZS ${campaign.budgetTotal.toLocaleString()}). No more creators can be approved.`,
    };
  }

  return { ok: true, maxCreators, committed };
}

// ---------------------------------------------------------------------------
// Earning creation (application approval)
// ---------------------------------------------------------------------------

/**
 * Create the PENDING earning for an approved application. Idempotent: if an
 * earning already exists for this application (retried request), it is
 * returned unchanged — the unique applicationId constraint is the final
 * backstop.
 */
export async function createEarningForApprovedApplication(
  tx: Prisma.TransactionClient,
  input: {
    applicationId: string;
    campaignId: string;
    creatorId: string;
    paymentRate: number;
  },
  now = new Date()
) {
  const existing = await tx.earning.findUnique({
    where: { applicationId: input.applicationId },
  });
  if (existing) return existing;

  const split = calculateCreatorEarning(input.paymentRate);

  return tx.earning.create({
    data: {
      applicationId: input.applicationId,
      campaignId: input.campaignId,
      creatorId: input.creatorId,
      ...split,
      status: "PENDING",
      requestedAt: now,
    },
  });
}

// ---------------------------------------------------------------------------
// Content approval / rejection
// ---------------------------------------------------------------------------

export interface ContentApprovalResult {
  earning: { id: string; status: string; amount: number; creatorAmount: number };
  /** True when this call actually approved the content for the first time
   *  (a PENDING earning flipped to APPROVED). Callers use this to notify
   *  admins exactly once per approval. False on idempotent re-approval of
   *  already-approved content. */
  contentApproved: boolean;
}

/**
 * Brand approves content: the earning flips PENDING -> APPROVED (approvedAt),
 * and the platform's CREATOR_FEE is recorded (upsert, idempotent). The money
 * itself is settled later by an admin approving the earning (making it
 * AVAILABLE) and then through the scheduled payout flow — no direct Payment
 * is opened here and no settlement timer starts.
 *
 * Idempotent: approving already-approved or settled content re-runs cleanly
 * (no duplicate fee rows, no state changes). An AVAILABLE/frozen earning is
 * never flipped back to APPROVED.
 */
export async function approveContentForEarning(
  tx: Prisma.TransactionClient,
  input: {
    submissionId: string;
    applicationId: string;
    creatorId: string;
    campaignId: string;
    paymentRate: number;
  },
  now = new Date()
): Promise<ContentApprovalResult> {
  let earning = await tx.earning.findUnique({
    where: { applicationId: input.applicationId },
  });

  if (!earning) {
    // Defensive: an earning should exist (created at application approval),
    // but if it doesn't (legacy/partial data) create it before approving.
    earning = await createEarningForApprovedApplication(
      tx,
      {
        applicationId: input.applicationId,
        campaignId: input.campaignId,
        creatorId: input.creatorId,
        paymentRate: input.paymentRate,
      },
      now
    );
  }

  if (earning.status === "PAID") {
    throw new Error(`Earning is already paid (${earning.status}); cannot approve content.`);
  }
  if (earning.status === "REJECTED") {
    throw new Error(`Earning was rejected (${earning.status}); cannot approve content.`);
  }

  const contentApproved = earning.status === "PENDING";

  // Already-approved or settled content is a clean no-op. In particular, an
  // earning that has become AVAILABLE — or is frozen into an active payout —
  // must NEVER be flipped back to APPROVED: that would un-settle money and
  // break the payout math (markPayoutPaid only pays AVAILABLE earnings).
  if (!contentApproved) {
    return {
      earning: {
        id: earning.id,
        status: earning.status,
        amount: earning.amount,
        creatorAmount: earning.creatorAmount,
      },
      contentApproved: false,
    };
  }

  const updated = await tx.earning.update({
    where: { id: earning.id },
    data: {
      submissionId: input.submissionId,
      status: "APPROVED",
      approvedAt: now,
    },
  });

  // Platform cut of this earning (permanent, immutable, idempotent upsert).
  await recordCreatorFee(tx, {
    earningId: updated.id,
    creatorId: updated.creatorId,
    campaignId: updated.campaignId,
    grossAmount: updated.amount,
    feeRate: updated.platformFeeRate,
    feeAmount: updated.platformFee,
  });

  return {
    earning: {
      id: updated.id,
      status: updated.status,
      amount: updated.amount,
      creatorAmount: updated.creatorAmount,
    },
    contentApproved,
  };
}

/**
 * Brand rejects content: a PENDING earning (content not yet approved) flips to
 * REJECTED so it can never be paid. Already-APPROVED/PAID earnings are left
 * untouched (they were already approved).
 */
export async function rejectContentForEarning(
  tx: Prisma.TransactionClient,
  applicationId: string
) {
  const earning = await tx.earning.findUnique({
    where: { applicationId },
    select: { id: true, status: true },
  });

  if (!earning) return null;
  if (earning.status !== "PENDING" && earning.status !== "REJECTED") return earning;

  return tx.earning.update({
    where: { id: earning.id },
    data: { status: "REJECTED" },
  });
}

// ---------------------------------------------------------------------------
// Manual settlement (admin approval)
// ---------------------------------------------------------------------------

/**
 * Admin makes a creator's APPROVED earning AVAILABLE for payout. This is the
 * ONLY way earnings become AVAILABLE — there is no time-based settlement.
 * Approving is scoped per campaign (earnings belong to one campaign).
 *
 * Guarded: only APPROVED -> AVAILABLE. Retrying an already-AVAILABLE (or
 * PAID/REJECTED/PENDING) earning throws a BusinessRuleError with the current
 * status so the caller can surface it.
 */
export async function approveEarningAvailable(
  tx: Prisma.TransactionClient,
  earningId: string,
  now = new Date()
) {
  const updated = await tx.earning.updateMany({
    where: { id: earningId, status: "APPROVED" },
    data: { status: "AVAILABLE", availableAt: now },
  });

  if (updated.count === 0) {
    const earning = await tx.earning.findUnique({ where: { id: earningId } });
    if (!earning) {
      throw new BusinessRuleError("Earning not found.");
    }
    throw new BusinessRuleError(
      `Only an APPROVED earning can be made available (current status: ${earning.status}).`
    );
  }

  return tx.earning.findUniqueOrThrow({ where: { id: earningId } });
}
