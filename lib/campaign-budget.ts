// lib/campaign-budget.ts
//
// The REAL "budget funded" figure for a campaign = the GROSS amount funded
// for creators (creator earnings + platform fee). Because creator money only
// ever becomes PAID through the payout flow (lib/payout.ts), the single
// source of truth is the Earning table:
//
//   budgetFunded(campaign) = SUM(earning.amount)
//                            WHERE campaignId = X AND status = 'PAID'
//
// `earning.amount` is the gross per-creator payment (= paymentRate), which
// equals `creatorAmount + platformFee`. Using the gross amount ensures
// budgetFunded represents the total campaign spend committed to creators,
// consistent with budgetTotal (which is also a gross figure).
//
// Computed at read time (never trusted from the stored column) so discover
// cards, campaign details and every dashboard always show live progress, no
// matter which admin/creator/brand view is loaded.

import { prisma } from "@/lib/prisma";

/** Sum of gross creator payments that have actually been paid out for one
 *  campaign. Each earning.amount = creatorAmount + platformFee (the full
 *  paymentRate the campaign committed to this creator). */
export async function getCampaignPaidBudget(campaignId: string): Promise<number> {
  const rows = await prisma.earning.groupBy({
    by: ["campaignId"],
    where: { campaignId, status: "PAID" },
    _sum: { amount: true },
  });
  return rows[0]?._sum.amount ?? 0;
}

/** Map of campaignId -> gross paid-out total for many campaigns at once
 *  (used by list views / discover so one query covers every card). */
export async function getCampaignsPaidBudget(
  campaignIds: string[]
): Promise<Map<string, number>> {
  if (campaignIds.length === 0) return new Map();

  const rows = await prisma.earning.groupBy({
    by: ["campaignId"],
    where: { campaignId: { in: campaignIds }, status: "PAID" },
    _sum: { amount: true },
  });

  return new Map(rows.map((r) => [r.campaignId, r._sum.amount ?? 0]));
}
