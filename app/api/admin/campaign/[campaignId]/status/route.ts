import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCampaignPaidBudget } from "@/lib/campaign-budget";

const CAMPAIGN_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
] as const;

// Approving a campaign means the brand has manually paid the full amount,
// so approval also flips paymentStatus UNPAID -> PAID and marks the campaign's
// BRAND_FEE revenue row as received. Both updates are atomic.
//
// Note: campaign.budgetFunded is intentionally NOT set here — it represents
// the cash actually paid out to creators (sum of PAID earnings, computed at
// read time in lib/campaign-budget.ts). Approving a campaign funds nothing
// to creators, so funded stays 0 until real payouts happen.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const user = await getAuthUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { campaignId } = await params;
  const { status } = await req.json().catch(() => ({}));

  if (!CAMPAIGN_STATUSES.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const campaign = await prisma.$transaction(async (tx) => {
    if (status === "APPROVED") {
      const updated = await tx.campaign.update({
        where: { id: campaignId },
        data: {
          status,
          paymentStatus: "PAID",
        },
      });

      await tx.platformRevenue.updateMany({
        where: {
          campaignId,
          type: "BRAND_FEE",
          status: "ACCRUED",
        },
        data: { status: "PAID" },
      });

      return updated;
    }

    return tx.campaign.update({
      where: { id: campaignId },
      data: { status },
    });
  });

  return Response.json({
    ...campaign,
    budgetFunded: await getCampaignPaidBudget(campaignId),
  });
}
