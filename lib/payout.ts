// lib/payout.ts
//
// The scheduled creator payout system. All payout state transitions and the
// threshold/eligibility math live here so API routes stay thin and the rules
// are testable in isolation.
//
// Model:
//   Admin approves a creator earning (payment-flow) -> earning AVAILABLE ->
//   the creator's available balance accumulates. When it crosses the platform's
//   minimum payout threshold (default 50,000 TZS) a Payout row is created — either on
//   the monthly payout day (default 25th) by runScheduledPayouts(), or by the
//   creator requesting one once eligible. The admin then reviews (approve /
//   reject) and manually marks it PAID. Amounts below the threshold simply
//   roll over because only earnings that were AVAILABLE at creation time are
//   frozen into a payout.
//
// Guard rails enforced here (server-side, never in the UI):
//   - A creator can only get a payout when available >= minimumPayoutAmount
//   - At most ONE active (PENDING/APPROVED) payout per creator at a time
//   - The payout amount is exactly the creator's available balance at creation
//     -> it can never exceed the available balance (no over-payment)
//   - Marking PAID is ADMIN-only (brand/creator get 403)
//   - PAID uses a conditional `WHERE status = APPROVED` update + the frozen
//     earnings, so two concurrent admins cannot double-pay a payout
//
// The scheduled payout is the ONLY settlement channel — there is no separate
// withdrawal or direct-payment flow.

import { prisma } from "@/lib/prisma";
import type { Prisma, Payout } from "@prisma/client";
import { NotifyAdmin } from "@/lib/notification";

// ---------------------------------------------------------------------------
// Platform settings (minimum threshold + payout day)
// ---------------------------------------------------------------------------

export const DEFAULT_MINIMUM_PAYOUT = 50000; // TZS
export const DEFAULT_PAYOUT_DAY = 25; // day of month

export const PAYOUT_SETTING_MINIMUM = "payout.minimumAmount";
export const PAYOUT_SETTING_DAY = "payout.day";

export interface PayoutSettings {
  minimumPayoutAmount: number;
  payoutDay: number;
}

function envInt(raw: string | undefined): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Load the payout settings, falling back to env vars then the defaults. */
export async function getPlatformPayoutSettings(): Promise<PayoutSettings> {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: [PAYOUT_SETTING_MINIMUM, PAYOUT_SETTING_DAY] } },
  });

  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const minimumRaw = byKey.get(PAYOUT_SETTING_MINIMUM);
  const dayRaw = byKey.get(PAYOUT_SETTING_DAY);

  const minimum =
    minimumRaw !== undefined
      ? (envInt(minimumRaw) ?? DEFAULT_MINIMUM_PAYOUT)
      : (envInt(process.env.PAYOUT_MINIMUM_AMOUNT) ??
        DEFAULT_MINIMUM_PAYOUT);

  const payoutDay =
    dayRaw !== undefined
      ? (envInt(dayRaw) ?? DEFAULT_PAYOUT_DAY)
      : (envInt(process.env.PAYOUT_DAY) ??
        DEFAULT_PAYOUT_DAY);

  return {
    minimumPayoutAmount: Math.max(1, minimum),
    payoutDay: clampDayOfMonth(payoutDay),
  };
}

export interface UpdatePayoutSettingsInput {
  minimumPayoutAmount?: number;
  payoutDay?: number;
}

export type UpdatePayoutSettingsResult =
  | { ok: true; settings: PayoutSettings }
  | { ok: false; error: string; code?: string };

/** Persist admin-changed payout settings (upsert key/value rows). */
export async function updatePlatformPayoutSettings(
  input: UpdatePayoutSettingsInput
): Promise<UpdatePayoutSettingsResult> {
  const current = await getPlatformPayoutSettings();

  const minimum =
    input.minimumPayoutAmount !== undefined
      ? Math.round(input.minimumPayoutAmount)
      : current.minimumPayoutAmount;
  const payoutDay =
    input.payoutDay !== undefined
      ? Math.round(input.payoutDay)
      : current.payoutDay;

  if (!Number.isFinite(minimum) || minimum < 1) {
    return {
      ok: false,
      error: "Minimum payout amount must be a positive amount.",
      code: "INVALID_SETTINGS",
    };
  }
  if (!Number.isFinite(payoutDay) || payoutDay < 1 || payoutDay > 31) {
    return {
      ok: false,
      error: "Payout day must be between 1 and 31.",
      code: "INVALID_SETTINGS",
    };
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.platformSetting.upsert({
      where: { key: PAYOUT_SETTING_MINIMUM },
      create: { key: PAYOUT_SETTING_MINIMUM, value: String(minimum), updatedAt: now },
      update: { value: String(minimum), updatedAt: now },
    }),
    prisma.platformSetting.upsert({
      where: { key: PAYOUT_SETTING_DAY },
      create: { key: PAYOUT_SETTING_DAY, value: String(payoutDay), updatedAt: now },
      update: { value: String(payoutDay), updatedAt: now },
    }),
  ]);

  return { ok: true, settings: { minimumPayoutAmount: minimum, payoutDay } };
}

// ---------------------------------------------------------------------------
// Date helpers (payout day)
// ---------------------------------------------------------------------------

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function clampDayOfMonth(day: number): number {
  return Math.max(1, Math.min(31, Math.round(day)));
}

/** The 25th (or configured day) of the current month, or next month if it has
 *  already passed. Day is clamped to the month's length (e.g. 31 -> 30). */
export function getNextPayoutDate(now: Date, payoutDay: number): Date {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = clampDayOfMonth(payoutDay);
  const clamped = Math.min(day, daysInMonth(year, month));

  const startOfToday = new Date(year, month, now.getDate());
  const candidate = new Date(year, month, clamped);

  if (candidate.getTime() < startOfToday.getTime()) {
    const nextMonth = month + 1;
    const nextYear = nextMonth === 12 ? year + 1 : year;
    const m = nextMonth % 12;
    return new Date(nextYear, m, Math.min(day, daysInMonth(nextYear, m)));
  }
  return candidate;
}

/** True when `now` falls on the configured monthly payout day. */
export function isPayoutDay(now: Date, payoutDay: number): boolean {
  const day = clampDayOfMonth(payoutDay);
  return now.getDate() === Math.min(day, daysInMonth(now.getFullYear(), now.getMonth()));
}

// ---------------------------------------------------------------------------
// Available balance
// ---------------------------------------------------------------------------

/** Sum of a creator's available net earnings that are not frozen into an
 *  active payout. This is the balance that can roll into a new payout. */
export async function getAvailableBalance(creatorId: string): Promise<number> {
  const rows = await prisma.earning.findMany({
    where: { creatorId, status: "AVAILABLE", payoutId: null },
    select: { creatorAmount: true },
  });
  return rows.reduce((s, e) => s + e.creatorAmount, 0);
}

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

export interface PayoutEligibility {
  availableBalance: number;
  minimumPayoutAmount: number;
  payoutDay: number;
  nextPayoutDate: Date;
  eligible: boolean;
  remainingToEligible: number; // 0 when eligible
  hasActivePayout: boolean;
}

/** Eligibility snapshot for a creator (used by the creator dashboard and by
 *  payout creation). Only earnings an admin has approved (status AVAILABLE)
 *  count toward the balance. */
export async function getPayoutEligibility(
  creatorId: string,
  now = new Date()
): Promise<PayoutEligibility> {
  const [settings, availableBalance, activeCount] = await Promise.all([
    getPlatformPayoutSettings(),
    getAvailableBalance(creatorId),
    prisma.payout.count({
      where: { creatorId, status: { in: ["PENDING", "APPROVED"] } },
    }),
  ]);

  return {
    availableBalance,
    minimumPayoutAmount: settings.minimumPayoutAmount,
    payoutDay: settings.payoutDay,
    nextPayoutDate: getNextPayoutDate(now, settings.payoutDay),
    eligible: availableBalance >= settings.minimumPayoutAmount,
    remainingToEligible: Math.max(
      0,
      settings.minimumPayoutAmount - availableBalance
    ),
    hasActivePayout: activeCount > 0,
  };
}

// ---------------------------------------------------------------------------
// Payout creation
// ---------------------------------------------------------------------------

const NOT_FOUND = "NOT_FOUND";
const INVALID_STATE = "INVALID_STATE";

export interface CreatePayoutResult {
  payout?: Payout;
  error?: string;
  code?: string;
}

/**
 * Create a PENDING payout for a creator's full available balance.
 *
 * Rules (all enforced server-side):
 *   - available balance must be >= minimumPayoutAmount, otherwise the creator
 *     cannot request a payout yet (their earnings roll over)
 *   - the creator must not already have an active (PENDING/APPROVED) payout
 *   - the payout amount is the exact available balance at creation, so it can
 *     never exceed the balance (no over-payment / no negative balances)
 *
 * The linked earnings are frozen (payoutId) inside the same transaction as
 * the Payout row, with a conditional update as the race backstop: if two
 * requests race, only one wins and the other returns INVALID_STATE.
 */
export async function createPayout(
  creatorId: string,
  now = new Date(),
  destination?: { paymentMethod?: string | null; paymentPhone?: string | null }
): Promise<CreatePayoutResult> {
  const eligibility = await getPayoutEligibility(creatorId, now);

  if (!eligibility.eligible) {
    return {
      error: `Your available balance (TZS ${eligibility.availableBalance.toLocaleString()}) is below the minimum payout threshold of TZS ${eligibility.minimumPayoutAmount.toLocaleString()}.`,
      code: INVALID_STATE,
    };
  }
  if (eligibility.hasActivePayout) {
    return {
      error: "You already have a pending payout being reviewed by an admin.",
      code: INVALID_STATE,
    };
  }

  const earnings = await prisma.earning.findMany({
    where: {
      creatorId,
      status: "AVAILABLE",
      payoutId: null,
    },
    select: { id: true, creatorAmount: true },
    orderBy: { availableAt: "asc" },
  });

  const available = earnings.reduce((s, e) => s + e.creatorAmount, 0);
  if (available < eligibility.minimumPayoutAmount) {
    return {
      error: "Your available balance dropped below the minimum payout threshold.",
      code: INVALID_STATE,
    };
  }

  let payout: Payout;
  try {
    payout = await prisma.$transaction(async (tx) => {
      const created = await tx.payout.create({
        data: {
          creatorId,
          amount: available,
          status: "PENDING",
          requestedAt: now,
          paymentMethod: destination?.paymentMethod?.trim() || null,
          paymentPhone: destination?.paymentPhone?.trim() || null,
        },
      });

      // Conditional update = race guard: if a concurrent request already
      // froze these earnings into another payout, we update 0 rows and abort.
      const frozen = await tx.earning.updateMany({
        where: { id: { in: earnings.map((e) => e.id) }, payoutId: null },
        data: { payoutId: created.id },
      });
      if (frozen.count !== earnings.length) {
        throw new Error("PAYOUT_EARNINGS_ALREADY_FROZEN");
      }

      return created;
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "PAYOUT_EARNINGS_ALREADY_FROZEN") {
      return {
        error: "Another payout for these earnings was already created.",
        code: INVALID_STATE,
      };
    }
    throw err;
  }

  // Flag the payout request to admins so it gets reviewed.
  await NotifyAdmin({
    title: "New Payout Request",
    message: `A creator has requested a payout of TZS ${available.toLocaleString()}. Review it in the payouts dashboard.`,
    type: "INFO",
  });

  return { payout };
}

/**
 * Scheduled monthly generation: on the configured payout day, create a PENDING
 * payout for every eligible creator who does not already have an active one.
 * In V1 there is no cron infrastructure — this is invoked by the admin
 * "Generate Payouts" action and on the admin payouts page load, so opening the
 * page on the payout day materializes the month's batches. Safe to call any
 * time; it is a no-op outside the payout day.
 */
export async function runScheduledPayouts(
  now = new Date()
): Promise<{ generated: number }> {
  const settings = await getPlatformPayoutSettings();
  if (!isPayoutDay(now, settings.payoutDay)) {
    return { generated: 0 };
  }

  const creators = await prisma.creatorProfile.findMany({
    select: { id: true },
  });

  let generated = 0;
  for (const creator of creators) {
    const result = await createPayout(creator.id, now);
    if (result.payout) generated += 1;
  }

  return { generated };
}

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

const payoutWithCreator = {
  creator: {
    select: {
      id: true,
      userId: true,
      username: true,
      displayName: true,
      payoutAccount: {
        select: {
          id: true,
          method: true,
          phone: true,
          accountName: true,
          bankName: true,
          accountNumber: true,
        },
      },
    },
  },
} satisfies Prisma.PayoutInclude;

export type PayoutWithCreator = Prisma.PayoutGetPayload<{
  include: typeof payoutWithCreator;
}>;

export interface AdminPayoutResult {
  payout?: PayoutWithCreator;
  error?: string;
  code?: string;
}

/** Admin approves a PENDING payout (PENDING -> APPROVED). Earnings stay
 *  frozen; the payout is now queued to be paid. Race-safe: a conditional
 *  `WHERE status = PENDING` update means two concurrent admins cannot both
 *  approve (or both act on) the same payout. */
export async function approvePayout(
  payoutId: string,
  adminUserId: string
): Promise<AdminPayoutResult> {
  const existing = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!existing) {
    return { error: "Payout not found.", code: NOT_FOUND };
  }

  const now = new Date();
  const result = await prisma.payout.updateMany({
    where: { id: payoutId, status: "PENDING" },
    data: { status: "APPROVED", approvedAt: now, reviewedBy: adminUserId, reviewedAt: now },
  });
  if (result.count === 0) {
    return {
      error: `Only a pending payout can be approved (current status: ${existing.status}).`,
      code: INVALID_STATE,
    };
  }

  const updated = await prisma.payout.findUniqueOrThrow({
    where: { id: payoutId },
    include: payoutWithCreator,
  });

  await prisma.notification.create({
    data: {
      userId: updated.creator.userId,
      title: "Payout Approved",
      message: `Your payout of TZS ${updated.amount.toLocaleString()} has been approved and will be paid out shortly.`,
      type: "SUCCESS",
    },
  });

  return { payout: updated };
}

/** Admin rejects a payout (PENDING/APPROVED -> REJECTED). The frozen earnings
 *  are unfrozen and roll over to the next payout cycle. */
export async function rejectPayout(
  payoutId: string,
  adminUserId: string,
  reason?: string
): Promise<AdminPayoutResult> {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: { creator: { select: { userId: true } } },
  });
  if (!payout) {
    return { error: "Payout not found.", code: NOT_FOUND };
  }
  if (payout.status === "PAID" || payout.status === "REJECTED") {
    return {
      error: `This payout is already finalized (${payout.status}).`,
      code: INVALID_STATE,
    };
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.payout.update({
      where: { id: payoutId },
      data: {
        status: "REJECTED",
        rejectionReason: reason?.trim() || null,
        rejectedAt: now,
        reviewedBy: adminUserId,
        reviewedAt: now,
      },
      include: payoutWithCreator,
    });

    // Unfreeze the earnings so they roll over to the next payout period.
    await tx.earning.updateMany({
      where: { payoutId },
      data: { payoutId: null },
    });

    return p;
  });

  await prisma.notification.create({
    data: {
      userId: payout.creator.userId,
      title: "Payout Rejected",
      message: `Your payout of TZS ${payout.amount.toLocaleString()} was rejected and returned to your available balance.`,
      type: "WARNING",
    },
  });

  return { payout: updated };
}

export interface MarkPayoutPaidInput {
  payoutId: string;
  adminUserId: string;
  role: "ADMIN";
  paymentReference?: string;
  paymentMethod?: string;
  proofUrl?: string;
  note?: string;
}

export type MarkPayoutPaidResult =
  | { ok: true; payout: PayoutWithCreator }
  | { ok: false; error: string; code?: string };

/**
 * Admin marks an APPROVED payout as PAID. THE money action for the payout
 * system and ADMIN-only (enforced here and again at the API route).
 *
 * Effects inside one transaction:
 *   - payout APPROVED -> PAID (conditional `WHERE status = APPROVED` race guard)
 *   - linked earnings -> PAID (+ paidAt)
 *   - the platform's accrued CREATOR_FEE rows -> PAID alongside
 */
export async function markPayoutPaid(
  input: MarkPayoutPaidInput
): Promise<MarkPayoutPaidResult> {
  if (input.role !== "ADMIN") {
    return {
      ok: false,
      error: "Forbidden: only an admin can mark a payout as paid.",
      code: "FORBIDDEN",
    };
  }

  const payout = await prisma.payout.findUnique({
    where: { id: input.payoutId },
    include: {
      creator: { select: { userId: true } },
    },
  });
  if (!payout) {
    return { ok: false, error: "Payout not found.", code: "NOT_FOUND" };
  }
  if (payout.status === "PAID") {
    return { ok: false, error: "This payout was already paid.", code: "ALREADY_PAID" };
  }
  if (payout.status !== "APPROVED") {
    return {
      ok: false,
      error: `Only an approved payout can be marked paid (current status: ${payout.status}).`,
      code: "INVALID_STATE",
    };
  }

  const now = new Date();

  const processed = await prisma.$transaction(async (tx) => {
    const result = await tx.payout.updateMany({
      where: { id: input.payoutId, status: "APPROVED" },
      data: {
        status: "PAID",
        paymentReference: input.paymentReference?.trim() || payout.paymentReference,
        paidAt: now,
        reviewedBy: input.adminUserId,
        reviewedAt: now,
      },
    });
    if (result.count === 0) {
      throw new Error("PAYOUT_ALREADY_PROCESSED");
    }

    const paidEarningIds = await tx.earning.findMany({
      where: { payoutId: input.payoutId },
      select: { id: true },
    });
    const ids = paidEarningIds.map((e) => e.id);

    await tx.earning.updateMany({
      where: { payoutId: input.payoutId, status: "AVAILABLE" },
      data: { status: "PAID", paidAt: now },
    });

    // Collect the platform's creator fees alongside the payout.
    await tx.platformRevenue.updateMany({
      where: { earningId: { in: ids }, type: "CREATOR_FEE", status: "ACCRUED" },
      data: {
        status: "PAID",
        ...(input.paymentReference?.trim()
          ? { paymentReference: input.paymentReference.trim() }
          : {}),
      },
    });

    // Record the payment proof — the payout only becomes PAID once this exists.
    await tx.paymentProof.create({
      data: {
        payoutId: input.payoutId,
        submittedById: input.adminUserId,
        amount: payout.amount,
        paymentMethod:
          input.paymentMethod?.trim() || payout.paymentMethod || "Other",
        transactionReference:
          input.paymentReference?.trim() ||
          payout.paymentReference ||
          "Manual payment",
        proofUrl: input.proofUrl?.trim() || null,
        note: input.note?.trim() || null,
        status: "VERIFIED",
        reviewedById: input.adminUserId,
        reviewedAt: now,
      },
    });

    return tx.payout.findUniqueOrThrow({
      where: { id: input.payoutId },
      include: payoutWithCreator,
    });
  }).catch((err: unknown) => {
    if (err instanceof Error && err.message === "PAYOUT_ALREADY_PROCESSED") {
      return "ALREADY_PROCESSED" as const;
    }
    throw err;
  });

  if (processed === "ALREADY_PROCESSED") {
    return { ok: false, error: "This payout was already paid.", code: "ALREADY_PAID" };
  }

  await prisma.notification.create({
    data: {
      userId: payout.creator.userId,
      title: "Payout Paid",
      message: `Your payout of TZS ${payout.amount.toLocaleString()} has been paid.`,
      type: "SUCCESS",
    },
  });

  return { ok: true, payout: processed };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const payoutListInclude = {
  creator: {
    select: {
      id: true,
      username: true,
      displayName: true,
      payoutAccount: {
        select: {
          id: true,
          method: true,
          phone: true,
          accountName: true,
          bankName: true,
          accountNumber: true,
        },
      },
    },
  },
  earnings: {
    select: {
      id: true,
      creatorAmount: true,
      status: true,
      campaign: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.PayoutInclude;

export type PayoutRecord = Prisma.PayoutGetPayload<{
  include: typeof payoutListInclude;
}>;

/** Admin ledger: run the schedule (materialize the month's batches on the
 *  payout day) then list every payout with the creator's current available
 *  balance (i.e. what has NOT been frozen into this payout — what rolls over). */
export async function getAdminPayouts(): Promise<
  Array<PayoutRecord & { currentBalance: number }>
> {
  await runScheduledPayouts();

  const payouts = await prisma.payout.findMany({
    include: payoutListInclude,
    orderBy: { requestedAt: "desc" },
  });

  const balanceByCreator = await prisma.earning.groupBy({
    by: ["creatorId"],
    where: { status: "AVAILABLE", payoutId: null },
    _sum: { creatorAmount: true },
  });
  const balanceMap = new Map(
    balanceByCreator.map((b) => [b.creatorId, b._sum.creatorAmount ?? 0])
  );

  return payouts.map((p) => ({
    ...p,
    currentBalance: balanceMap.get(p.creatorId) ?? 0,
  }));
}

/** A creator's own payout history (used on the creator dashboard). */
export async function getCreatorPayouts(
  creatorId: string
): Promise<PayoutRecord[]> {
  return prisma.payout.findMany({
    where: { creatorId },
    include: payoutListInclude,
    orderBy: { requestedAt: "desc" },
  });
}

/** Everything the creator dashboard needs to render the payout section:
 *  settings, eligibility and the creator's payout history. */
export async function getCreatorPayoutSummary(creatorId: string) {
  const [settings, eligibility, payouts] = await Promise.all([
    getPlatformPayoutSettings(),
    getPayoutEligibility(creatorId),
    getCreatorPayouts(creatorId),
  ]);

  return { settings, eligibility, payouts };
}
