import { cache } from "react";
import { formatDistanceToNow } from "date-fns";

import { prisma } from "@/lib/prisma";
import { getCampaignPaidBudget } from "@/lib/campaign-budget";
import type { Platform } from "@/types";

/**
 * Public shape for the campaign detail page (`/discover/[campaignId]`).
 *
 * Only fields that are safe to expose publicly are included. Derived fields
 * (lastUpdated, isClosed, brandVerified, resources) are computed from real
 * stored data — nothing is fabricated.
 */
export interface CampaignDetail {
  id: string;
  title: string;
  brand: string;
  brandLogoUrl: string | null;
  brandVerified: boolean;
  category: string;
  thumbnailColor: string;
  thumbnailPic: string;
  thumbnailInitials: string;
  /** TZS per approved post — the campaign's configured creator rate. */
  paymentRate: number;
  budgetFunded: number;
  budgetTotal: number;
  /** Number of applications received (public count, no private details). */
  applicants: number;
  platforms: Platform[];
  /** True when applicationsClose has passed (or the campaign is otherwise done). */
  isClosed: boolean;
  /** Whole days until applicationsClose (0 when closed). */
  daysLeft: number;
  isFeatured: boolean;
  /** Relative time, e.g. "3 days ago". */
  lastUpdated: string;
  description: string;
  requirements: string[];
  /** One entry per supported platform, all using the real campaign rate. */
  earnings: CampaignEarning[];
  /** Public brand links (website + social accounts). May be empty. */
  resources: CampaignResource[];
}

export interface CampaignEarning {
  platform: Platform;
  rate: number;
}

export interface CampaignResource {
  label: string;
  type: "Link";
  url: string;
}

const SOCIAL_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  TWITTER: "X",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
};

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * Fetch a single public campaign and map it to the safe `CampaignDetail`
 * shape used by `/discover/[campaignId]`.
 *
 * Only `APPROVED` campaigns are exposed publicly (mirrors the discover
 * list). `null` is returned for missing ids and non-approved campaigns.
 *
 * Private data is never included: applications, creator identities, payment
 * processing details (platformFee/totalCharge), and admin fields stay out of
 * the public shape.
 */
export const getCampaignDetail = cache(
  async (id: string): Promise<CampaignDetail | null> => {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        businessProfile: {
          include: { socialAccounts: true },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!campaign || campaign.status !== "APPROVED") return null;

    const business = campaign.businessProfile;
    const platforms = campaign.platforms as Platform[];
    const brand = business?.companyName ?? campaign.brand ?? "Unknown";
    // Real budget progress: gross amount funded for creators so far.
    const budgetFunded = await getCampaignPaidBudget(campaign.id);

    const resources: CampaignResource[] = [];
    if (business?.website) {
      resources.push({
        label: `${brand} · Website`,
        type: "Link",
        url: normalizeUrl(business.website),
      });
    }
    for (const account of business?.socialAccounts ?? []) {
      if (!account.url) continue;
      const label = SOCIAL_LABELS[account.platform] ?? account.platform;
      resources.push({
        label: `${brand} · ${label}`,
        type: "Link",
        url: normalizeUrl(account.url),
      });
    }

    return {
      id: campaign.id,
      title: campaign.name,
      brand,
      brandLogoUrl: business?.logo ?? null,
      brandVerified: (business?.socialAccounts ?? []).some(
        (account) => account.verified
      ),
      category: campaign.category,
      thumbnailColor: campaign.thumbnailColor,
      thumbnailPic: campaign.thumbnailPic,
      thumbnailInitials: campaign.thumbnailInitials,
      paymentRate: campaign.paymentRate,
      budgetFunded,
      budgetTotal: campaign.budgetTotal,
      applicants: campaign._count.applications,
      platforms,
      isClosed: campaign.applicationsClose < new Date(),
      daysLeft: Math.max(
        0,
        Math.ceil(
          (campaign.applicationsClose.getTime() - Date.now()) / 86_400_000
        )
      ),
      isFeatured: campaign.isFeatured,
      lastUpdated: formatDistanceToNow(campaign.updatedAt, { addSuffix: true }),
      description: campaign.description,
      requirements: campaign.requirements,
      earnings: platforms.map((platform) => ({
        platform,
        rate: campaign.paymentRate,
      })),
      resources,
    };
  }
);
