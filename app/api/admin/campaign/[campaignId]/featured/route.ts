import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const user = await getAuthUser();

  if (user?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { campaignId } = await params;
  const body = await req.json().catch(() => ({}));

  if (typeof body.featured !== "boolean") {
    return Response.json(
      { error: "featured must be a boolean" },
      { status: 400 }
    );
  }

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      isFeatured: body.featured,
    },
  });

  return Response.json({ isFeatured: campaign.isFeatured });
}
