import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Wallet business logic. API routes only handle the request/response; all
// aggregation logic lives here.
//
// Creator money moves through exactly ONE channel: the scheduled payout
// (lib/payout.ts). Earnings become AVAILABLE only when an ADMIN approves them
// per campaign (lib/payment-flow.ts approveEarningAvailable) and are then
// frozen into a Payout which the admin pays out. There is no separate
// withdrawal / direct-payment flow, and no time-based auto-settlement.
//
// Fee percentages/math live in lib/pricing.ts (single source of truth).
// ---------------------------------------------------------------------------

export { computeCreatorFeeSplit } from "@/lib/pricing";

const earningWithCampaign = {
  campaign: { select: { id: true, name: true } },
  submission: { select: { id: true, status: true } },
  payout: {
    select: { id: true, status: true, paymentReference: true },
  },
} satisfies Prisma.EarningInclude;

export type CreatorWalletEarning = Prisma.EarningGetPayload<{
  include: typeof earningWithCampaign;
}>;

export interface CreatorWallet {
  available: number;
  pending: number;
  approved: number;
  /** Money frozen into an active (PENDING/APPROVED) payout — in review with
   *  an admin. No longer available, not yet paid. */
  processing: number;
  paid: number;
  lifetime: number;
  earnings: CreatorWalletEarning[];
}

export async function getCreatorWallet(creatorId: string): Promise<CreatorWallet> {
  const earnings = await prisma.earning.findMany({
    where: { creatorId },
    include: earningWithCampaign,
    orderBy: { createdAt: "desc" },
  });

  const sum = (list: CreatorWalletEarning[]) =>
    list.reduce((s, e) => s + e.creatorAmount, 0);

  const available = sum(
    earnings.filter((e) => e.status === "AVAILABLE" && !e.payoutId)
  );
  const pending = sum(earnings.filter((e) => e.status === "PENDING"));
  const approved = sum(earnings.filter((e) => e.status === "APPROVED"));
  const processing = sum(
    earnings.filter((e) => e.status === "AVAILABLE" && e.payoutId)
  );
  const paid = sum(earnings.filter((e) => e.status === "PAID"));
  const lifetime = sum(earnings.filter((e) => e.status !== "REJECTED"));

  return {
    available,
    pending,
    approved,
    processing,
    paid,
    lifetime,
    earnings,
  };
}
