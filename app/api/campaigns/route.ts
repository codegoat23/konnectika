import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { NotifyAdmin, Notifycreators } from "@/lib/notification";
import { computeBrandFee, getPlatformPricing } from "@/lib/pricing";
import { recordBrandFee } from "@/lib/platform-revenue";
import { getCampaignsPaidBudget } from "@/lib/campaign-budget";
import {
  isMobileMoneyMethod,
  normalizePhoneNumber,
  validatePaymentPhone,
} from "@/lib/payment";


export async function GET() {
  // Public discovery list. Explicit `select` whitelist — never expose payment
  // details (paymentMethod/paymentPhone/paymentStatus/platformFee/totalCharge)
  // or admin-only fields to unauthenticated visitors.
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "APPROVED",
    },
    select: {
      id: true,
      name: true,
      category: true,
      campaignType: true,
      description: true,
      badge: true,
      thumbnailColor: true,
      thumbnailPic: true,
      platforms: true,
      paymentRate: true,
      budgetFunded: true,
      budgetTotal: true,
      daysLeft: true,
      tags: true,
      requirements: true,
      applicationsClose: true,
      contentFormat: true,
      duration: true,
      isOpenToAll: true,
      isFeatured: true,
      businessProfile: {
        select: { companyName: true, logo: true },
      },
      _count: { select: { applications: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Override the stored budgetFunded column with the real gross paid-out total
  // so the discover progress bars always reflect gross amount funded for creators.
  const paid = await getCampaignsPaidBudget(campaigns.map((c) => c.id));
  const campaignsWithRealBudget = campaigns.map((c) => ({
    ...c,
    budgetFunded: paid.get(c.id) ?? 0,
  }));

  return Response.json(campaignsWithRealBudget);
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

    // Brand payment details: mobile-money methods must include the phone the
    // brand will pay from / be matched on when the admin confirms the charge.
    const paymentMethod = body.paymentMethod?.trim() ?? null;
    const paymentPhone = body.paymentPhone?.trim() ?? null;

    if (
      isMobileMoneyMethod(paymentMethod) &&
      !normalizePhoneNumber(paymentPhone)
    ) {
      return Response.json(
        {
          error:
            validatePaymentPhone(paymentMethod, paymentPhone) ??
            "A valid phone number is required for mobile money payments.",
        },
        { status: 400 }
      );
    }

    // 💰 Brand platform fee: charged on top of the campaign budget. It
    // belongs to the platform and never reduces creator payouts. The rate
    // is snapshotted onto the revenue row, and the row upserts on
    // (campaignId, BRAND_FEE) so a retried request cannot duplicate it.
    // Computed ONCE here and reused for both the campaign snapshot and the
    // revenue row so frontend preview and stored amounts always agree.
    // Honour the admin-configured rate (PlatformSetting first, then env), not
    // just the env default, so a changed fee applies to newly created campaigns.
    const pricing = await getPlatformPricing();
    const brandFee = computeBrandFee(budgetTotal, pricing.brandFeePercent);

    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
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

          // Payment is manual: the campaign is created UNPAID and only
          // marked PAID when an admin approves (i.e. confirms funds).
          paymentStatus: "UNPAID",
          platformFeeRate: brandFee.feeRate,
          platformFee: brandFee.feeAmount,
          totalCharge: brandFee.totalCharge,

          paymentMethod,
          paymentPhone: normalizePhoneNumber(paymentPhone),

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

      await recordBrandFee(tx, {
        campaignId: created.id,
        businessId: business.id,
        grossAmount: brandFee.budget,
        feeRate: brandFee.feeRate,
        feeAmount: brandFee.feeAmount,
      });

      return created;
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
