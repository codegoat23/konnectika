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

  // Status transition validation
  const allowedTransitions = new Map<string, string[]>([
    ["PENDING_REVIEW", ["APPROVED", "REJECTED"]],
    ["APPROVED", ["COMPLETED"]],
    ["REJECTED", []],
    ["COMPLETED", []],
  ]);

  const current = campaign.status;
  const next = status;
  if (!allowedTransitions.get(current)?.includes(next)) {
    return Response.json(
      { error: `Invalid transition from ${current} to ${next}` },
      { status: 400 }
    );
  }

  const updatedCampaign = await prisma.$transaction(async (tx) => {
    if (status === "APPROVED") {
      const updated = await tx.campaign.update({
        where: { id: campaignId },
        data: {
          status,
        },
      });
      return updated;
    }

    return tx.campaign.update({
      where: { id: campaignId },
      data: { status },
    });
  });

  if (status === "APPROVED" || status === "REJECTED") {
    await notify({
      userId: campaign.businessProfile.userId,
      title:
        status === "APPROVED"
          ? "Campaign Approved"
          : "Campaign Rejected",
      message:
        status === "APPROVED"
          ? `Your campaign "${campaign.name}" was approved. Creators can now apply.`
          : `Your campaign "${campaign.name}" was rejected by the admin team.`,
      type: status === "APPROVED" ? "SUCCESS" : "ERROR",
    });
  }

  return Response.json({
    ...updatedCampaign,
    budgetFunded: await getCampaignPaidBudget(campaignId),
  });
}
