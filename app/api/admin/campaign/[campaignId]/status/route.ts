import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCampaignPaidBudget } from "@/lib/campaign-budget";
import { notify } from "@/lib/notification";

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
// the gross amount funded for creators (sum of PAID earnings, computed at
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

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      name: true,
      status: true,
      businessProfile: { select: { userId: true } },
    },
  });

  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  const updatedCampaign = await prisma.$transaction(async (tx) => {
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

  // Notify the campaign's brand about the admin review decision. Approving a
  // campaign also confirms their payment (paymentStatus UNPAID -> PAID).
  if (status === "APPROVED" || status === "REJECTED") {
    await notify({
      userId: campaign.businessProfile.userId,
      title:
        status === "APPROVED"
          ? "Campaign Approved"
          : "Campaign Rejected",
      message:
        status === "APPROVED"
          ? `Your campaign "${campaign.name}" was approved and your payment was confirmed. Creators can now apply.`
          : `Your campaign "${campaign.name}" was rejected by the admin team.`,
      type: status === "APPROVED" ? "SUCCESS" : "ERROR",
    });
  }

  return Response.json({
    ...updatedCampaign,
    budgetFunded: await getCampaignPaidBudget(campaignId),
  });
}
