import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      businessProfile: true,
    },
  });

  if (!campaign) {
    return Response.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  return Response.json(campaign);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "BRAND" && user.role !== "ADMIN") {
      return Response.json(
        { error: "Only brands or admins can edit campaigns." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existing = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        businessProfile: { select: { userId: true } },
      },
    });

    if (!existing) {
      return Response.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Brands may only edit campaigns they own.
    if (
      user.role === "BRAND" &&
      user.userId !== existing.businessProfile.userId
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const paymentRate = Number(body.paymentRate);
    const budgetTotal = Number(body.budgetTotal);

    if (!Number.isFinite(paymentRate) || paymentRate <= 0) {
      return Response.json(
        { error: "A valid payment rate is required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(budgetTotal) || budgetTotal <= 0) {
      return Response.json(
        { error: "A valid total budget is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        campaignType: body.campaignType,
        badge: body.badge,

        paymentRate,
        budgetTotal,

        contentFormat: body.contentFormat,
        duration: body.duration,

        applicationsClose: new Date(body.applicationsClose),
        daysLeft: Number(body.daysLeft) || 0,

        thumbnailPic: body.thumbnailPic,
        thumbnailColor: body.thumbnailColor,

        tags: body.tags,
        requirements: body.requirements,
        platforms: body.platforms,
      },
    });

    return Response.json(updated);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to update campaign" },
      { status: 500 }
    );
  }
}