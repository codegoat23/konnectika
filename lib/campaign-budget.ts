// lib/campaign-budget.ts
//
// The REAL "budget funded" figure for a campaign = the cash actually paid to
// creators. Because creator money only ever becomes PAID through the payout
// flow (lib/payout.ts), the single source of truth is the Earning table:
//
//   budgetFunded(campaign) = SUM(earning.creatorAmount)
//                            WHERE campaignId = X AND status = 'PAID'
//
// Computed at read time (never trusted from the stored column) so discover
// cards, campaign details and every dashboard always show live progress, no
// matter which admin/creator/brand view is loaded.

import { prisma } from "@/lib/prisma";

/** Sum of creator net earnings that have actually been paid out for one
 *  campaign. */
export async function getCampaignPaidBudget(campaignId: string): Promise<number> {
  const rows = await prisma.earning.groupBy({
    by: ["campaignId"],
    where: { campaignId, status: "PAID" },
    _sum: { creatorAmount: true },
  });
  return rows[0]?._sum.creatorAmount ?? 0;
}

/** Map of campaignId -> paid-out creator net total for many campaigns at once
 *  (used by list views / discover so one query covers every card). */
export async function getCampaignsPaidBudget(
  campaignIds: string[]
): Promise<Map<string, number>> {
  if (campaignIds.length === 0) return new Map();

  const rows = await prisma.earning.groupBy({
    by: ["campaignId"],
    where: { campaignId: { in: campaignIds }, status: "PAID" },
    _sum: { creatorAmount: true },
  });

  return new Map(rows.map((r) => [r.campaignId, r._sum.creatorAmount ?? 0]));
}
