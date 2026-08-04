import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Wallet business logic. API routes only handle the request/response; all
// settlement, aggregation and withdrawal mutations live here.
// ---------------------------------------------------------------------------

export const PLATFORM_FEE_PERCENT = 10;
export const SETTLEMENT_PERIOD_DAYS = 7;

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function computeFeeSplit(gross: number) {
  const platformFee = Math.round((gross * PLATFORM_FEE_PERCENT) / 100);
  return {
    amount: gross,
    platformFeeRate: PLATFORM_FEE_PERCENT,
    platformFee,
    creatorAmount: gross - platformFee,
  };
}

// Flip PENDING earnings whose settlement period has passed into AVAILABLE.
// Scoped to a creator when provided, otherwise settles everyone.
export async function settleDueEarnings(creatorId?: string) {
  const now = new Date();
  return prisma.earning.updateMany({
    where: {
      status: "PENDING",
      availableAt: { lte: now },
      ...(creatorId ? { creatorId } : {}),
    },
    data: { status: "AVAILABLE" },
  });
}

const earningWithCampaign = {
  submission: {
    include: {
      campaign: { select: { id: true, name: true } },
    },
  },
  withdrawal: { select: { id: true, status: true } },
} satisfies Prisma.EarningInclude;

export type CreatorWalletEarning = Prisma.EarningGetPayload<{
  include: typeof earningWithCampaign;
}>;

const withdrawalWithEarnings = {
  earnings: {
    include: {
      submission: {
        include: {
          campaign: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.WithdrawalInclude;

export type CreatorWalletWithdrawal = Prisma.WithdrawalGetPayload<{
  include: typeof withdrawalWithEarnings;
}>;

export interface CreatorWallet {
  available: number;
  pending: number;
  lifetime: number;
  withdrawn: number;
  earnings: CreatorWalletEarning[];
  withdrawals: CreatorWalletWithdrawal[];
}

export async function getCreatorWallet(creatorId: string): Promise<CreatorWallet> {
  await settleDueEarnings(creatorId);

  const [earnings, withdrawals] = await Promise.all([
    prisma.earning.findMany({
      where: { creatorId },
      include: earningWithCampaign,
      orderBy: { createdAt: "desc" },
    }),
    prisma.withdrawal.findMany({
      where: { creatorId },
      include: withdrawalWithEarnings,
      orderBy: { requestedAt: "desc" },
    }),
  ]);

  const sum = (list: CreatorWalletEarning[]) =>
    list.reduce((s, e) => s + e.creatorAmount, 0);

  const available = sum(
    earnings.filter((e) => e.status === "AVAILABLE" && !e.withdrawalId)
  );
  const pending = sum(earnings.filter((e) => e.status === "PENDING"));
  const withdrawn = sum(earnings.filter((e) => e.status === "WITHDRAWN"));
  const lifetime = sum(earnings);

  return { available, pending, lifetime, withdrawn, earnings, withdrawals };
}

// ---------------------------------------------------------------------------
// Withdrawals
// ---------------------------------------------------------------------------

const NOT_FOUND = "NOT_FOUND";
const INVALID_STATE = "INVALID_STATE";

export interface RequestWithdrawalResult {
  withdrawal?: CreatorWalletWithdrawal;
  error?: string;
  code?: string;
}

// Creator requests a withdrawal of their FULL available balance. The linked
// earnings are frozen (withdrawalId set) so they stop counting as available
// and the admin can see exactly which campaigns the payout covers.
export async function requestWithdrawal(
  creatorId: string,
  paymentMethod?: string
): Promise<RequestWithdrawalResult> {
  const creator = await prisma.creatorProfile.findUnique({
    where: { id: creatorId },
    select: { userId: true },
  });

  if (!creator) {
    return { error: "Creator profile not found.", code: NOT_FOUND };
  }

  await settleDueEarnings(creatorId);

  const availableEarnings = await prisma.earning.findMany({
    where: { creatorId, status: "AVAILABLE", withdrawalId: null },
    orderBy: { availableAt: "asc" },
  });

  const available = availableEarnings.reduce((s, e) => s + e.creatorAmount, 0);
  if (available <= 0) {
    return { error: "No available balance to withdraw.", code: INVALID_STATE };
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    const created = await tx.withdrawal.create({
      data: {
        creatorId,
        amount: available,
        paymentMethod: paymentMethod?.trim() || null,
      },
    });

    await tx.earning.updateMany({
      where: { id: { in: availableEarnings.map((e) => e.id) } },
      data: { withdrawalId: created.id },
    });

    return created;
  });

  await prisma.notification.create({
    data: {
      userId: creator.userId,
      title: "Withdrawal Requested",
      message: `Your withdrawal of TZS ${available.toLocaleString()} has been submitted for review.`,
      type: "SUCCESS",
    },
  });

  const full = await prisma.withdrawal.findUnique({
    where: { id: withdrawal.id },
    include: withdrawalWithEarnings,
  });

  return { withdrawal: full ?? undefined };
}

export interface AdminUpdateWithdrawalResult {
  withdrawal?: CreatorWalletWithdrawal;
  error?: string;
  code?: string;
}

// Admin advances a withdrawal: PENDING -> PROCESSING, PROCESSING -> PAID,
// or any non-final state -> REJECTED. On PAID, the linked earnings become
// WITHDRAWN (removing them from the available balance). On REJECTED, the
// earnings are unlinked and become available again.
export async function adminUpdateWithdrawal({
  withdrawalId,
  status,
  adminUserId,
  paymentReference,
}: {
  withdrawalId: string;
  status: "PROCESSING" | "PAID" | "REJECTED";
  adminUserId: string;
  paymentReference?: string;
}): Promise<AdminUpdateWithdrawalResult> {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { creator: { select: { userId: true } } },
  });

  if (!withdrawal) {
    return { error: "Withdrawal not found.", code: NOT_FOUND };
  }

  if (withdrawal.status === "PAID" || withdrawal.status === "REJECTED") {
    return { error: "This withdrawal is already finalized.", code: INVALID_STATE };
  }

  if (status === "PROCESSING" && withdrawal.status !== "PENDING") {
    return { error: "Only pending withdrawals can be processed.", code: INVALID_STATE };
  }

  if (status === "PAID" && withdrawal.status !== "PROCESSING") {
    return { error: "Withdrawal must be PROCESSING before marking it PAID.", code: INVALID_STATE };
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const w = await tx.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status,
        paymentReference:
          status === "PAID" && paymentReference?.trim()
            ? paymentReference.trim()
            : undefined,
        reviewedBy: adminUserId,
        reviewedAt: now,
        paidAt: status === "PAID" ? now : undefined,
        rejectedAt: status === "REJECTED" ? now : undefined,
      },
    });

    if (status === "PAID") {
      await tx.earning.updateMany({
        where: { withdrawalId },
        data: { status: "WITHDRAWN", withdrawnAt: now, paidAt: now },
      });
    }

    if (status === "REJECTED") {
      await tx.earning.updateMany({
        where: { withdrawalId },
        data: { withdrawalId: null },
      });
    }

    return w;
  });

  await prisma.notification.create({
    data: {
      userId: withdrawal.creator.userId,
      title:
        status === "PAID"
          ? "Withdrawal Paid"
          : status === "REJECTED"
          ? "Withdrawal Rejected"
          : "Withdrawal Processing",
      message:
        status === "PAID"
          ? `Your withdrawal of TZS ${withdrawal.amount.toLocaleString()} has been paid.`
          : status === "REJECTED"
          ? `Your withdrawal of TZS ${withdrawal.amount.toLocaleString()} was rejected and returned to your available balance.`
          : `Your withdrawal of TZS ${withdrawal.amount.toLocaleString()} is being processed.`,
      type: status === "REJECTED" ? "WARNING" : "SUCCESS",
    },
  });

  const full = await prisma.withdrawal.findUnique({
    where: { id: updated.id },
    include: withdrawalWithEarnings,
  });

  return { withdrawal: full ?? undefined };
}

// ---------------------------------------------------------------------------
// Admin ledger
// ---------------------------------------------------------------------------

const adminWithdrawalInclude = {
  creator: {
    select: { id: true, username: true, displayName: true },
  },
  earnings: {
    include: {
      submission: {
        include: {
          campaign: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.WithdrawalInclude;

export type AdminWithdrawal = Prisma.WithdrawalGetPayload<{
  include: typeof adminWithdrawalInclude;
}>;

export async function getAdminWithdrawals(): Promise<AdminWithdrawal[]> {
  await settleDueEarnings();

  return prisma.withdrawal.findMany({
    include: adminWithdrawalInclude,
    orderBy: { requestedAt: "desc" },
  });
}
