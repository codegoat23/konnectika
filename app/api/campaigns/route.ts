import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notify, NotifyAdmin, Notifycreators } from "@/lib/notification";


export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "APPROVED",
    },
    include: {
      businessProfile: true,
      _count: { select: { applications: true } }
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json(campaigns);
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "BRAND") {
      return Response.json(
        { error: "Only brands can create campaigns." },
        { status: 403 }
      );
    }

    const business = await prisma.businessProfile.findUnique({
      where: {
        userId: user.userId,
      },
    });

    if (!business) {
      return Response.json(
        { error: "Business profile not found." },
        { status: 404 }
      );
    }

    const body = await req.json();

    const paymentRate = Number(body.paymentRate);
    const budgetTotal = Number(body.budgetTotal);
    const applicationsClose = new Date(body.applicationsClose);

    if (!body.name?.trim()) {
      return Response.json(
        { error: "Campaign name is required" },
        { status: 400 }
      );
    }

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

    if (!body.applicationsClose || isNaN(applicationsClose.getTime())) {
      return Response.json(
        { error: "A valid applications close date is required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,

        campaignType: body.campaignType,
        badge: body.badge ?? "new",

        thumbnailColor:
          body.thumbnailColor ?? "#18181b",

        thumbnailPic:
          body.thumbnailPic ?? "",

        thumbnailInitials:
          body.thumbnailInitials ??
          body.name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),

        paymentRate,

        budgetFunded: 0,
        budgetTotal,

        daysLeft: Number(body.daysLeft) || 0,

        contentFormat: body.contentFormat,
        duration: body.duration,

        applicationsClose,

        isOpenToAll:
          body.isOpenToAll ?? true,

        isFeatured:
          body.isFeatured ?? false,

        tags: body.tags ?? [],

        requirements:
          body.requirements ?? [],

        creatorsJoined: 0,

        brand:
          body.brand ??
          business.companyName,

        platforms:
          body.platforms ?? [],

        businessProfileId: business.id,
      },

      include: {
        businessProfile: true,
      },
    });


    //create notifications for all creators about the new campaign

    await Notifycreators({
      title: "New Campaign Available 🚀",
      message: `A new campaign "${campaign.name}" is waiting for applications.`,
      type: "INFO",

    })


//Create notification for admin about the new campaign created
   await NotifyAdmin({
    title: "New Campaign Created",
      message: `A new campaign "${campaign.name}" is waiting for approval.`,
      type: "INFO",
   })


    return Response.json(campaign, {
      status: 201,
    });
   
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Failed to create campaign.",
      },
      {
        status: 500,
      }
    );
  }
}