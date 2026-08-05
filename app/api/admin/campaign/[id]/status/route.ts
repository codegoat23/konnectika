import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CAMPAIGN_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
] as const;

// Approving a campaign means the brand has manually paid the full amount,
// so approval also flips paymentStatus UNPAID -> PAID and marks the
// campaign's BRAND_FEE revenue row as received. Both updates are atomic.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();

  if (user?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));

  if (!CAMPAIGN_STATUSES.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const campaign = await prisma.$transaction(async (tx) => {
    const updated = await tx.campaign.update({
      where: { id },
      data: {
        status,
        // Approval = payment received (manual payment workflow).
        ...(status === "APPROVED" ? { paymentStatus: "PAID" } : {}),
      },
    });

    if (status === "APPROVED") {
      await tx.platformRevenue.updateMany({
        where: {
          campaignId: id,
          type: "BRAND_FEE",
          status: "ACCRUED",
        },
        data: { status: "PAID" },
      });
    }

    return updated;
  });

  return Response.json(campaign);
}
