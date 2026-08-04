import { prisma } from "@/lib/prisma";

/**
 * Three campaign-list views, one per role, all surfaced at /dashboard/campaign.
 *
 * CREATOR -> every campaign they've APPLIED to, with their application status
 * BRAND   -> campaigns they CREATED
 * ADMIN   -> ALL campaigns, across every brand
 */

const CAMPAIGN_CARD_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  campaignType: true,
  badge: true,
  thumbnailColor: true,
  thumbnailPic: true,
  thumbnailInitials: true,
  paymentRate: true,
  budgetTotal: true,
  budgetFunded: true,
  daysLeft: true,
  contentFormat: true,
  duration: true,
  brand: true,
  platforms: true,
  tags: true,
  // needed for CampaignModal
  requirements: true,
  isOpenToAll: true,
  applicationsClose: true,
  creatorsJoined: true,
} as const;

// ---------------------------------------------------------------------------
// CREATOR — campaigns applied to (all statuses)
// ---------------------------------------------------------------------------

export async function getJoinedCampaigns(userId: string) {
  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!creatorProfile) return [];

  const applications = await prisma.campaignApplication.findMany({
    where: {
      creatorId: creatorProfile.id,
      // no status filter — show PENDING, APPROVED, and REJECTED
    },
    select: {
      status: true,
      createdAt: true, // when they applied
      updatedAt: true, // roughly when status last changed
      campaign: {
        select: {
          ...CAMPAIGN_CARD_SELECT,
          businessProfile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return applications.map((a) => ({
    ...a.campaign,
    status: a.status,
    appliedAt: a.createdAt,
    statusUpdatedAt: a.updatedAt,
  }));
}

export type JoinedCampaign = Awaited<
  ReturnType<typeof getJoinedCampaigns>
>[number];

// --------------------------------------------------------------------
// CREATOR -- campaigns which are approved
// --------------------------------------------------------------------
export async function getApprovedCampaigns(userId: string) {
  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!creatorProfile) return [];

  const approved_applications = await prisma.campaignApplication.findMany({
    where: {
      creatorId: creatorProfile.id,
    // show APPROVED
    status:"APPROVED",
    },
    select: {
      
      createdAt: true, // when they applied
      updatedAt: true, // roughly when status last changed
      campaign: {
        select: {
          ...CAMPAIGN_CARD_SELECT,
          businessProfile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return approved_applications.map((a) => ({
    ...a.campaign,
    appliedAt: a.createdAt,
    statusUpdatedAt: a.updatedAt,
  }));
}

// ---------------------------------------------------------------------------
// BRAND — campaigns created
// ---------------------------------------------------------------------------

export async function getCreatedCampaigns(userId: string) {
  const businessProfile = await prisma.businessProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!businessProfile) return [];

  return prisma.campaign.findMany({
    where: { businessProfileId: businessProfile.id },
    select: {
      ...CAMPAIGN_CARD_SELECT,
      createdAt: true,
      applicationsClose: true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type CreatedCampaign = Awaited<
  ReturnType<typeof getCreatedCampaigns>
>[number];

export type ApprovedCampaigns = Awaited<
  ReturnType<typeof getApprovedCampaigns>
>[number];

// ---------------------------------------------------------------------------
// ADMIN — all campaigns, all brands
// ---------------------------------------------------------------------------

export async function getAllCampaigns() {
  return prisma.campaign.findMany({
    select: {
      ...CAMPAIGN_CARD_SELECT,
      createdAt: true,
      businessProfile: { select: { companyName: true, logo: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export type AllCampaign = Awaited<ReturnType<typeof getAllCampaigns>>[number];
