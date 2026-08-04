export type BadgeType = "active" | "hot" | "new" | "featured";
export type Platform = "instagram" | "tiktok" | "facebook" | "youtube" | "x";
export type CampaignType = "UGC" | "Sponsored" | "Affiliate" | "Ambassador";

export interface Campaign {
  id: number;
  name: string;
  brand: string;
  category: string;
  campaignType: CampaignType;
  description: string;
  badge: BadgeType;
  thumbnailColor: string;
  thumbnailPic: string;
  platforms: Platform[];
  paymentRate: number;
  budgetFunded: number;
  budgetTotal: number;
  daysLeft: number;
  tags: string[];
  requirements: string[];
  creatorsJoined: number;
  applicationsClose: string;
  contentFormat: string;
  duration: string;
  isOpenToAll: boolean;
  isFeatured?: boolean;
  thumbnailInitials: string;
}

export interface Creator {
  id: number;
  name: string;
  handle: string;
  avatarColor: string;
  avatarInitials: string;
  followers: string;
  niche: string;
  campaignsCompleted: number;
  rating: number;
  platforms: Platform[];
  isVerified: boolean;
}

export interface StatsOverview {
  activeCampaigns: number;
  brands: number;
  totalBudget: string;
  creatorsJoined: string;
}

export interface FilterState {
  search: string;
  category: string;
  socialMedia: Platform | "";
  budgetMin: number;
  budgetMax: number;
  paymentRate: string;
  campaignType: CampaignType | "";
  badge: BadgeType | "";
  sortBy: string;
}
