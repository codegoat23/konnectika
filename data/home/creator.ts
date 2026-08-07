import type { HomePlatform } from "./index";

export interface HomeCampaign {
  id: string;
  brand: string;
  title: string;
  category: string;
  reward: number;
  platform: HomePlatform;
  image: string;
  color: string;
  badge: string;
  applicants: number;
}

export interface Step {
  step: string;
  icon: string;
  title: string;
  description: string;
}

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  result: string;
  initials: string;
  color: string;
}

export const creatorSteps: Step[] = [
  {
    step: "1",
    icon: "Compass",
    title: "Discover campaigns",
    description: "Find campaigns matching your skills and audience.",
  },
  {
    step: "2",
    icon: "Camera",
    title: "Create content",
    description: "Submit authentic content for brands.",
  },
  {
    step: "3",
    icon: "Wallet",
    title: "Get rewarded",
    description: "Earn money from successful collaborations.",
  },
];

export const creatorBenefits: Benefit[] = [
  {
    icon: "Handshake",
    title: "Find brand collaborations",
    description: "Get matched with brands that fit your niche and audience.",
  },
  {
    icon: "Briefcase",
    title: "Build your creator portfolio",
    description: "Show off real brand work that grows your credibility.",
  },
  {
    icon: "Wallet",
    title: "Access paid opportunities",
    description: "Clear budgets and transparent rewards on every campaign.",
  },
  {
    icon: "TrendingUp",
    title: "Grow your audience",
    description: "Reach new people through campaigns made to be shared.",
  },
];

export const creatorCampaigns: HomeCampaign[] = [
  {
    id: "crdb-digital",
    brand: "CRDB Bank",
    title: "Digital Banking UGC",
    category: "Technology",
    reward: 600000,
    platform: "tiktok",
    image: "/thumbnails/crdb.jpg",
    color: "#2563eb",
    badge: "Featured",
    applicants: 48,
  },
  {
    id: "vodacom-mzigo",
    brand: "Vodacom",
    title: "Mzigo wa Internet",
    category: "Technology",
    reward: 500000,
    platform: "youtube",
    image: "/thumbnails/vodacom.webp",
    color: "#dc2626",
    badge: "New",
    applicants: 27,
  },
  {
    id: "serengeti-taste",
    brand: "Serengeti Breweries",
    title: "Taste of Tanzania",
    category: "Food & Drink",
    reward: 450000,
    platform: "instagram",
    image: "/thumbnails/serengeti.jpeg",
    color: "#16a34a",
    badge: "Hot",
    applicants: 32,
  },
  {
    id: "kukupoa-champions",
    brand: "KukuPoa",
    title: "Kuku Champions",
    category: "Food & Drink",
    reward: 350000,
    platform: "instagram",
    image: "/thumbnails/kukupoa.png",
    color: "#d97706",
    badge: "Active",
    applicants: 19,
  },
  {
    id: "yas-collective",
    brand: "YAS",
    title: "Youth Arts Collective",
    category: "Fashion",
    reward: 400000,
    platform: "x",
    image: "/thumbnails/yas.jpg",
    color: "#ea580c",
    badge: "New",
    applicants: 41,
  },
  {
    id: "marioo-album",
    brand: "Marioo",
    title: "Album Launch Campaign",
    category: "Music",
    reward: 550000,
    platform: "tiktok",
    image: "/thumbnails/marioo.jpg",
    color: "#7c3aed",
    badge: "Hot",
    applicants: 56,
  },
];

export const creatorTestimonials: Testimonial[] = [
  {
    id: "amara",
    quote:
      "Konnectika helped me find brands that actually value my creativity. I went from posting for fun to landing paid collaborations every month.",
    name: "Amara Okafor",
    role: "Beauty & Lifestyle · Lagos",
    result: "TZS 850K+ earned",
    initials: "AO",
    color: "#e1306c",
  },
  {
    id: "brian",
    quote:
      "I turned my content skills into income opportunities. The briefs are clear, payments arrive on time, and the brands are real.",
    name: "Brian Mwangi",
    role: "Tech reviewer · Nairobi",
    result: "TZS 1.2M earned",
    initials: "BM",
    color: "#2563eb",
  },
  {
    id: "zainab",
    quote:
      "Every campaign feels tailored to what I create. I've built a portfolio of brand work I'm genuinely proud of.",
    name: "Zainab Hassan",
    role: "Food & Travel · Dar es Salaam",
    result: "50+ brand collabs",
    initials: "ZH",
    color: "#16a34a",
  },
];

export const creatorHeroStats = [
  { value: "1,000+", label: "creators" },
  { value: "100+", label: "campaigns" },
  { value: "4.9", label: "creator rating" },
];
