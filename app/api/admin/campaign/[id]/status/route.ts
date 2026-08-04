import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CAMPAIGN_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
] as const;

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

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      status,
    },
  });

  return Response.json(campaign);
}