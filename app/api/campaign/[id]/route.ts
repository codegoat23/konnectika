import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { computeBrandFee } from "@/lib/pricing";
import { getCampaignPaidBudget } from "@/lib/campaign-budget";
import type { Prisma } from "@prisma/client";
import {
  isMobileMoneyMethod,
  normalizePhoneNumber,
  validatePaymentPhone,
} from "@/lib/payment";

// Public campaign fields safe for any authenticated visitor (the apply page
// renders these). Fee internals, the brand's payment phone and the brand's
// full profile (contact details) are intentionally excluded.
const PUBLIC_CAMPAIGN_FIELDS = {
  id: true,
  name: true,
  description: true,
  category: true,
  campaignType: true,
  badge: true,
  paymentRate: true,
  budgetTotal: true,
  budgetFunded: true,
  creatorsJoined: true,
  paymentMethod: true,
  daysLeft: true,
  contentFormat: true,
  duration: true,
  applicationsClose: true,
  isOpenToAll: true,
  isFeatured: true,
  tags: true,
  requirements: true,
  status: true,
  thumbnailColor: true,
  thumbnailPic: true,
  thumbnailInitials: true,
  platforms: true,
  businessProfile: { select: { id: true, companyName: true } },
  createdAt: true,
} satisfies Prisma.CampaignSelect;

const FULL_CAMPAIGN_INCLUDE = {
  businessProfile: true,
} satisfies Prisma.CampaignInclude;

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
    include: { businessProfile: { select: { id: true, userId: true } } },
  });

  if (!campaign) {
    return Response.json(
      { error: "Campaign not found" },
      { status: 404 }
    );
  }

  // Role-aware response:
  //   - ADMIN always gets the full record
  //   - the owning BRAND gets the full record (edit form / dashboard)
  //   - everyone else (creators, other brands) gets only the public fields
  //     needed to view and apply for the campaign.
  if (
    user.role === "ADMIN" ||
    (user.role === "BRAND" && campaign.businessProfile.userId === user.userId)
  ) {
    const full = await prisma.campaign.findUnique({
      where: { id },
      include: FULL_CAMPAIGN_INCLUDE,
    });
    // Real budget: cash actually paid out to creators (not the stored column).
    return Response.json({
      ...full,
      budgetFunded: await getCampaignPaidBudget(id),
    });
  }

  const publicCampaign = await prisma.campaign.findUnique({
    where: { id },
    select: PUBLIC_CAMPAIGN_FIELDS,
  });

  return Response.json({
    ...publicCampaign,
    budgetFunded: await getCampaignPaidBudget(id),
  });
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

    // Keep the payment snapshot in sync with the (possibly edited) budget.
    // The historical BRAND_FEE PlatformRevenue row is intentionally left
    // untouched — it is an immutable audit record of what was charged at
    // creation time.
    const brandFee = computeBrandFee(budgetTotal);

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

        platformFeeRate: brandFee.feeRate,
        platformFee: brandFee.feeAmount,
        totalCharge: brandFee.totalCharge,

        paymentMethod,
        paymentPhone: normalizePhoneNumber(paymentPhone),

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