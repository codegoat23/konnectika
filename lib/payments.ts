// lib/payments.ts
//
// The manual payment system's shared service. One reusable PaymentProof model
// drives BOTH money flows:
//
//   BRAND -> KONNEKTIKA campaign payment:
//     - Brands select a payment method when creating/funding a campaign.
//     - They see Konnectika's ADMIN-configured receiving account matching that
//       method (never hardcoded — stored in ReceivingAccount).
//     - "I've Made the Payment" creates a PaymentProof (PROOF_SUBMITTED) and
//       flips the campaign paymentStatus to PROOF_SUBMITTED.
//     - An ADMIN verifies (campaign -> PAID, BRAND_FEE revenue paid) or rejects
//       (campaign back to UNPAID, reason recorded).
//
//   KONNEKTIKA -> CREATOR payout:
//     - Creators save a PayoutAccount in their profile.
//     - When an ADMIN processes a payout they record the proof (markPayoutPaid
//       in lib/payout.ts); the payout only becomes PAID once that proof exists.
//
// All validation (ownership, amounts, roles) happens server-side here; the UI
// never supplies user ids or amounts that are trusted as-is.

import { prisma } from "@/lib/prisma";
import type { Prisma, ReceivingAccountType } from "@prisma/client";
import { isMobileMoneyMethod } from "@/lib/payment";
import { notify, NotifyAdmin } from "@/lib/notification";
import { getAuthUser } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Receiving accounts (admin-configured Konnectika bank / mobile-money numbers)
// ---------------------------------------------------------------------------

export const MOBILE_MONEY_PROVIDERS = [
  "Airtel Money",
  "M-PESA",
  "Tigo Pesa",
  "HaloPesa",
] as const;

export type ReceivingAccountWithType = {
  id: string;
  type: ReceivingAccountType;
  provider: string;
  accountName: string;
  phone: string | null;
  accountNumber: string | null;
  branchDetail: string | null;
  extraDetails: string | null;
  isActive: boolean;
};

/** The active receiving account(s) matching a campaign payment method.
 *  Mobile-money methods match the provider; anything else resolves to the
 *  branded bank transfer accounts. */
export async function getReceivingAccountsForMethod(
  method: string | null | undefined
): Promise<ReceivingAccountWithType[]> {
  const where: Prisma.ReceivingAccountWhereInput = { isActive: true };

  if (method && isMobileMoneyMethod(method)) {
    where.type = "MOBILE_MONEY";
    where.provider = method;
  } else {
    where.type = "BANK";
  }

  return prisma.receivingAccount.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });
}

export async function getReceivingAccounts(): Promise<
  ReceivingAccountWithType[]
> {
  return prisma.receivingAccount.findMany({
    orderBy: [{ type: "asc" }, { createdAt: "desc" }],
  });
}

export type UpsertReceivingAccountInput = {
  type: "MOBILE_MONEY" | "BANK";
  provider: string;
  accountName: string;
  phone?: string | null;
  accountNumber?: string | null;
  branchDetail?: string | null;
  extraDetails?: string | null;
  isActive?: boolean;
};

export type ReceivingAccountResult =
  | { ok: true; account: ReceivingAccountWithType }
  | { ok: false; error: string };

/** Admin creates/updates a Konnectika receiving account. Returns an error when
 *  the required fields for the selected type are missing. */
export async function upsertReceivingAccount(
  id: string | null,
  input: UpsertReceivingAccountInput
): Promise<ReceivingAccountResult> {
  const provider = input.provider?.trim();
  const accountName = input.accountName?.trim();

  if (!provider) {
    return { ok: false, error: "Provider / network is required." };
  }
  if (!accountName) {
    return { ok: false, error: "Account name is required." };
  }
  if (input.type === "MOBILE_MONEY" && !input.phone?.trim()) {
    return { ok: false, error: "The mobile money receiving phone is required." };
  }
  if (input.type === "BANK" && !input.accountNumber?.trim()) {
    return { ok: false, error: "The bank account number is required." };
  }

  const data = {
    type: input.type,
    provider,
    accountName,
    phone: input.phone?.trim() || null,
    accountNumber: input.accountNumber?.trim() || null,
    branchDetail: input.branchDetail?.trim() || null,
    extraDetails: input.extraDetails?.trim() || null,
    isActive: input.isActive ?? true,
  };

  const account = id
    ? await prisma.receivingAccount.update({ where: { id }, data })
    : await prisma.receivingAccount.create({ data });

  return { ok: true, account };
}

export async function setReceivingAccountActive(
  id: string,
  isActive: boolean
): Promise<ReceivingAccountResult> {
  const existing = await prisma.receivingAccount.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "Receiving account not found." };
  }
  const account = await prisma.receivingAccount.update({
    where: { id },
    data: { isActive },
  });
  return { ok: true, account };
}

// ---------------------------------------------------------------------------
// Payment proofs
// ---------------------------------------------------------------------------

const paymentProofRecordInclude = {
  campaign: {
    select: {
      id: true,
      name: true,
      totalCharge: true,
      paymentStatus: true,
      paymentMethod: true,
      businessProfile: { select: { userId: true, companyName: true } },
    },
  },
  payout: {
    select: {
      id: true,
      amount: true,
      creator: { select: { displayName: true, username: true } },
    },
  },
  submittedBy: { select: { email: true } },
} satisfies Prisma.PaymentProofInclude;

export type PaymentProofRecord = Prisma.PaymentProofGetPayload<{
  include: typeof paymentProofRecordInclude;
}>;

/** Proofs submitted against a campaign (used by brand view + admin review). */
export async function getCampaignPaymentProofs(campaignId: string) {
  return prisma.paymentProof.findMany({
    where: { campaignId },
    include: {
      submittedBy: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** A BRAND's OWN proofs for a campaign. Filters through the campaign's
 *  business profile so a brand can never read another brand's submissions. */
export async function getBrandCampaignPaymentProofs(
  campaignId: string,
  brandUserId: string
) {
  return prisma.paymentProof.findMany({
    where: {
      campaignId,
      campaign: { businessProfile: { userId: brandUserId } },
    },
    include: {
      submittedBy: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** The most recent proof submitted for a campaign, if any. */
export async function getLatestCampaignPaymentProof(
  campaignId: string
): Promise<PaymentProofRecord | null> {
  return prisma.paymentProof.findFirst({
    where: { campaignId },
    include: paymentProofRecordInclude,
    orderBy: { createdAt: "desc" },
  });
}

export type CreateCampaignPaymentProofInput = {
  campaignId: string;
  brandUserId: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  proofUrl?: string | null;
  note?: string | null;
};

export type CreateCampaignPaymentProofResult =
  | { ok: true; proof: PaymentProofRecord }
  | { ok: false; error: string; code?: string };

/** A BRAND records that they made a manual payment for their campaign.
 *
 *  Server-side guards:
 *   - the campaign must belong to the submitting brand
 *   - the amount must exactly match the campaign's totalCharge
 *   - the campaign must still be UNPAID (or have a rejected proof awaiting a
 *     resubmission) — a paid / already-awaiting campaign can't be re-submitted
 *
 *  Creates the PaymentProof and flips paymentStatus -> PROOF_SUBMITTED, then
 *  alerts admins so the proof gets verified. */
export async function createCampaignPaymentProof(
  input: CreateCampaignPaymentProofInput
): Promise<CreateCampaignPaymentProofResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: input.campaignId },
    select: {
      id: true,
      name: true,
      totalCharge: true,
      paymentStatus: true,
      paymentMethod: true,
      businessProfile: { select: { userId: true } },
    },
  });

  if (!campaign) {
    return { ok: false, error: "Campaign not found.", code: "NOT_FOUND" };
  }
  if (campaign.businessProfile.userId !== input.brandUserId) {
    return {
      ok: false,
      error: "You can only submit payment proof for your own campaign.",
      code: "FORBIDDEN",
    };
  }

  const latest = await prisma.paymentProof.findFirst({
    where: { campaignId: input.campaignId },
    select: { status: true },
    orderBy: { createdAt: "desc" },
  });

  if (campaign.paymentStatus === "PAID") {
    return { ok: false, error: "This campaign is already paid.", code: "ALREADY_PAID" };
  }
  if (
    campaign.paymentStatus === "PROOF_SUBMITTED" &&
    latest?.status !== "REJECTED"
  ) {
    return {
      ok: false,
      error: "You already submitted a payment proof that is awaiting admin verification.",
      code: "PROOF_ALREADY_SUBMITTED",
    };
  }

  if (input.amount !== campaign.totalCharge) {
    return {
      ok: false,
      error: `The payment amount must be exactly TZS ${campaign.totalCharge.toLocaleString()}.`,
      code: "AMOUNT_MISMATCH",
    };
  }

  const method =
    typeof input.paymentMethod === "string" && input.paymentMethod.trim()
      ? input.paymentMethod.trim()
      : campaign.paymentMethod || "Other";
  const transactionReference = input.transactionReference?.trim();
  if (!transactionReference) {
    return {
      ok: false,
      error: "A transaction / reference number is required.",
      code: "INVALID_INPUT",
    };
  }

  const proof = await prisma.$transaction(async (tx) => {
    const created = await tx.paymentProof.create({
      data: {
        campaignId: input.campaignId,
        submittedById: input.brandUserId,
        amount: input.amount,
        paymentMethod: method,
        transactionReference,
        proofUrl: input.proofUrl?.trim() || null,
        note: input.note?.trim() || null,
      },
      include: paymentProofRecordInclude,
    });

    await tx.campaign.update({
      where: { id: input.campaignId },
      data: { paymentStatus: "PROOF_SUBMITTED" },
    });

    return created;
  });

  await NotifyAdmin({
    title: "Payment Proof Submitted",
    message: `A brand submitted payment proof (TZS ${proof.amount.toLocaleString()}) for "${campaign.name}". Review it in the campaign or Payments dashboard.`,
    type: "INFO",
  });

  return { ok: true, proof };
}

export type ReviewCampaignPaymentInput = {
  proofId: string;
  adminUserId: string;
  action: "VERIFY" | "REJECT";
  rejectionReason?: string | null;
};

export type ReviewCampaignPaymentResult =
  | { ok: true; proof: PaymentProofRecord }
  | { ok: false; error: string; code?: string };

/** An ADMIN verifies or rejects a brand's payment proof.
 *
 *  VERIFY: proof -> VERIFIED, campaign paymentStatus -> PAID, and the
 *  campaign's BRAND_FEE platform-revenue row is marked received — the exact
 *  bookkeeping the existing admin campaign-approval path performs.
 *
 *  REJECT: proof -> REJECTED (with reason), campaign paymentStatus back to
 *  UNPAID so the brand can correct and re-submit. */
export async function reviewCampaignPaymentProof(
  input: ReviewCampaignPaymentInput
): Promise<ReviewCampaignPaymentResult> {
  const proof = await prisma.paymentProof.findUnique({
    where: { id: input.proofId },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          businessProfile: {
            select: { userId: true, companyName: true },
          },
        },
      },
    },
  });

  if (!proof || !proof.campaignId || !proof.campaign) {
    return { ok: false, error: "Payment proof not found.", code: "NOT_FOUND" };
  }
  if (proof.status !== "PROOF_SUBMITTED") {
    return {
      ok: false,
      error: `Only a submitted proof can be reviewed (current status: ${proof.status}).`,
      code: "INVALID_STATE",
    };
  }

  const campaignId = proof.campaignId;
  const { name: campaignName, businessProfile } = proof.campaign;
  const brandUserId = businessProfile.userId;
  const now = new Date();

  if (input.action === "REJECT") {
    const reason = input.rejectionReason?.trim();
    if (!reason) {
      return {
        ok: false,
        error: "A rejection reason is required.",
        code: "INVALID_INPUT",
      };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const reviewed = await tx.paymentProof.update({
        where: { id: input.proofId },
        data: {
          status: "REJECTED",
          reviewedById: input.adminUserId,
          reviewedAt: now,
          rejectionReason: reason,
        },
        include: paymentProofRecordInclude,
      });

      await tx.campaign.update({
        where: { id: campaignId },
        data: { paymentStatus: "UNPAID" },
      });

      return reviewed;
    });

    await notify({
      userId: brandUserId,
      title: "Payment Proof Rejected",
      message: `Your payment proof for "${campaignName}" was rejected. ${reason}`,
      type: "ERROR",
    });

    return { ok: true, proof: updated };
  }

  // VERIFY
  const updated = await prisma.$transaction(async (tx) => {
    const reviewed = await tx.paymentProof.update({
      where: { id: input.proofId },
      data: {
        status: "VERIFIED",
        reviewedById: input.adminUserId,
        reviewedAt: now,
      },
      include: paymentProofRecordInclude,
    });

    // Reuse the existing campaign-funding bookkeeping: payment becomes PAID
    // and the BRAND_FEE revenue row is marked as received.
    await tx.campaign.update({
      where: { id: campaignId },
      data: { paymentStatus: "PAID" },
    });

    await tx.platformRevenue.updateMany({
      where: { campaignId, type: "BRAND_FEE", status: "ACCRUED" },
      data: { status: "PAID" },
    });

    return reviewed;
  });

  await notify({
    userId: brandUserId,
    title: "Payment Verified",
    message: `Your payment for "${campaignName}" has been verified.`,
    type: "SUCCESS",
  });

  return { ok: true, proof: updated };
}

// ---------------------------------------------------------------------------
// Payout account (creator's saved destination)
// ---------------------------------------------------------------------------

export type PayoutAccountRecord = {
  id: string;
  method: string;
  phone: string | null;
  accountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
};

export async function getPayoutAccount(
  creatorId: string
): Promise<PayoutAccountRecord | null> {
  return prisma.payoutAccount.findUnique({
    where: { creatorId },
    select: {
      id: true,
      method: true,
      phone: true,
      accountName: true,
      bankName: true,
      accountNumber: true,
    },
  });
}

export type UpsertPayoutAccountInput = {
  method: string;
  phone?: string | null;
  accountName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
};

export type PayoutAccountResult =
  | { ok: true; account: PayoutAccountRecord }
  | { ok: false; error: string };

/** A CREATOR saves/updates their payout destination. The creatorId is always
 *  derived from the session, never from the client. */
export async function upsertPayoutAccount(
  creatorId: string,
  input: UpsertPayoutAccountInput
): Promise<PayoutAccountResult> {
  const method = input.method?.trim();
  if (!method) {
    return { ok: false, error: "Payment method is required." };
  }

  if (isMobileMoneyMethod(method)) {
    if (!input.phone?.trim()) {
      return { ok: false, error: "Your mobile money phone number is required." };
    }
  } else {
    if (!input.bankName?.trim() && !input.accountNumber?.trim()) {
      return { ok: false, error: "Bank name and account number are required." };
    }
  }

  const data = {
    method,
    phone: input.phone?.trim() || null,
    accountName: input.accountName?.trim() || null,
    bankName: input.bankName?.trim() || null,
    accountNumber: input.accountNumber?.trim() || null,
  };

  const existing = await prisma.payoutAccount.findUnique({
    where: { creatorId },
  });

  const saved = existing
    ? await prisma.payoutAccount.update({
        where: { id: existing.id },
        data,
        select: {
          id: true,
          method: true,
          phone: true,
          accountName: true,
          bankName: true,
          accountNumber: true,
        },
      })
    : await prisma.payoutAccount.create({
        data: { creatorId, ...data },
        select: {
          id: true,
          method: true,
          phone: true,
          accountName: true,
          bankName: true,
          accountNumber: true,
        },
      });

  return { ok: true, account: saved };
}

// ---------------------------------------------------------------------------
// Admin proof queue
// ---------------------------------------------------------------------------

/** All submitted (awaiting verification) campaign payment proofs, used by the
 *  admin Payments dashboard. */
export async function getPendingCampaignPaymentProofs() {
  return prisma.paymentProof.findMany({
    where: { campaignId: { not: null }, status: "PROOF_SUBMITTED" },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          totalCharge: true,
          paymentStatus: true,
          businessProfile: { select: { companyName: true } },
        },
      },
      submittedBy: { select: { email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

// Re-export auth guard used by the admin payments page.
export { getAuthUser };