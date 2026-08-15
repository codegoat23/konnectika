import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCampaignPaidBudget } from "@/lib/campaign-budget";

const LIMIT = 20;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();

  if (!user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id: campaignId } = await params;

if (user.role === "BRAND") {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      businessProfile: {
        userId: user.userId,
      },
    },
    include: {
      businessProfile: true,
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });

  if (!campaign) {
    return Response.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const skip = (page - 1) * LIMIT;

  const [applications, totalApplications] =
    await Promise.all([
      prisma.campaignApplication.findMany({
        where: {
          campaignId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: LIMIT,
        skip,
        include: {
          creator: {
            include: {
              socialAccounts: true,
            },
          },
          submission: true,
          earning: true,
        },
      }),

      prisma.campaignApplication.count({
        where: {
          campaignId,
        },
      }),
    ]);

  return Response.json({
    role: "BRAND",
    campaign: {
      ...campaign,
      budgetFunded: await getCampaignPaidBudget(campaign.id),
    },
    applications,
    page,
    totalApplications,
    totalPages: Math.ceil(
      totalApplications / LIMIT
    ),
  });
}

if (user.role === "CREATOR") {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },
    include: {
      businessProfile: true,
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });

  if (!campaign) {
    return Response.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  const application =
    await prisma.campaignApplication.findFirst({
      where: {
        campaignId,
        creator: {
          userId: user.userId,
        },
      },
      include: {
        submission: true,
      },
    });

  return Response.json({
    role: "CREATOR",
    campaign: {
      ...campaign,
      budgetFunded: await getCampaignPaidBudget(campaign.id),
    },
    application,
  });
}


if (user.role === "ADMIN") {
 const campaign = await prisma.campaign.findUnique({
  where: {
    id: campaignId,
  },
  include: {
    businessProfile: true,
    _count: {
      select: {
        applications: true,
      },
    },
  },
});

  if (!campaign) {
    return Response.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const skip = (page - 1) * LIMIT;

  const [applications, totalApplications] =
    await Promise.all([
      prisma.campaignApplication.findMany({
        where: {
          campaignId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: LIMIT,
        skip,
        include: {
          creator: {
            include: {
              socialAccounts: true,
            },
          },
          submission: true,
          earning: true,
        },
      }),

      prisma.campaignApplication.count({
        where: {
          campaignId,
        },
      }),
    ]);

  return Response.json({
    role: "ADMIN",
    campaign: {
      ...campaign,
      budgetFunded: await getCampaignPaidBudget(campaign.id),
    },
    applications,
    page,
    totalApplications,
    totalPages: Math.ceil(
      totalApplications / LIMIT
    ),
  });
}
}