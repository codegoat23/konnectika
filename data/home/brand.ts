import type { HomePlatform } from "./index";
import type { Benefit, Step, Testimonial } from "./creator";

export interface BrandCreator {
  id: string;
  name: string;
  handle: string;
  category: string;
  followers: string;
  engagement: string;
  platforms: HomePlatform[];
  trustScore: number;
  initials: string;
  color: string;
}

export const brandWorkflow: Step[] = [
  {
    step: "1",
    icon: "BiSolidMegaphone",
    title: "Create campaign",
    description: "Define your goals, budget, and creative brief.",
  },
  {
    step: "2",
    icon: "UserCheck",
    title: "Approve creators",
    description: "We review applications and pick the right voices.",
  },
  {
    step: "3",
    icon: "ClipboardList",
    title: "Receive content",
    description: "We collect authentic submissions in one place.",
  },
  {
    step: "4",
    icon: "TrendingUp",
    title: "Grow your brand",
    description: "Publish, measure, and scale what works.",
  },
];

export const brandBenefits: Benefit[] = [
  {
    icon: "Search",
    title: "Discover emerging creators",
    description: "Tap into fresh, authentic voices across Africa.",
  },
  {
    icon: "Zap",
    title: "Run campaigns easily",
    description: "Launch with clear budgets and smart briefs in minutes.",
  },
  {
    icon: "MessagesSquare",
    title: "Manage collaborations",
    description: "Review, request changes, and approve in one dashboard.",
  },
  {
    icon: "BarChart3",
    title: "Track results",
    description: "Measure reach, engagement, and impact on every post.",
  },
];

export const brandCreators: BrandCreator[] = [
  {
    id: "neema",
    name: "Neema Mushi",
    handle: "@neema.makes",
    category: "Beauty & Lifestyle",
    followers: "128K",
    engagement: "6.4%",
    platforms: ["instagram", "tiktok"],
    trustScore: 98,
    initials: "NM",
    color: "#e1306c",
  },
  {
    id: "david",
    name: "David Otieno",
    handle: "@davidtechtalk",
    category: "Technology",
    followers: "84K",
    engagement: "5.1%",
    platforms: ["youtube", "x"],
    trustScore: 95,
    initials: "DO",
    color: "#2563eb",
  },
  {
    id: "latifa",
    name: "Latifa Juma",
    handle: "@latifa.eats",
    category: "Food & Travel",
    followers: "210K",
    engagement: "7.2%",
    platforms: ["instagram"],
    trustScore: 97,
    initials: "LJ",
    color: "#16a34a",
  },
  {
    id: "kevin",
    name: "Kevin Ngare",
    handle: "@kevinplays",
    category: "Gaming",
    followers: "156K",
    engagement: "8.9%",
    platforms: ["tiktok", "youtube"],
    trustScore: 93,
    initials: "KN",
    color: "#7c3aed",
  },
  {
    id: "amina",
    name: "Amina Said",
    handle: "@amina.fits",
    category: "Fitness & Wellness",
    followers: "96K",
    engagement: "5.8%",
    platforms: ["instagram", "tiktok"],
    trustScore: 96,
    initials: "AS",
    color: "#ea580c",
  },
  {
    id: "chidi",
    name: "Chidi Eze",
    handle: "@chidi.creates",
    category: "Music & Culture",
    followers: "302K",
    engagement: "9.3%",
    platforms: ["tiktok", "instagram"],
    trustScore: 99,
    initials: "CE",
    color: "#0891b2",
  },
];

export const brandTestimonials: Testimonial[] = [
  {
    id: "selcom",
    quote:
      "Konnectika gave us access to creators our agency never found. The campaign content outperformed our paid ads three-to-one.",
    name: "Selcom",
    role: "Fintech · Campaign lead",
    result: "3x ROI on content",
    initials: "SC",
    color: "#0a66c2",
  },
  {
    id: "kukupoa",
    quote:
      "Launching campaigns used to take weeks of coordination. Now we brief, approve, and publish from a single dashboard.",
    name: "KukuPoa",
    role: "Food brand · Marketing team",
    result: "Launch time cut in half",
    initials: "KP",
    color: "#d97706",
  },
  {
    id: "yas",
    quote:
      "The creators we found became brand advocates. Their content reaches communities we could never reach ourselves.",
    name: "YAS",
    role: "Culture platform · Partnerships",
    result: "40+ creator partners",
    initials: "YA",
    color: "#ea580c",
  },
];

export const brandHeroStats = [
  { value: "10K+", label: "creators" },
  { value: "5", label: "markets" },
  { value: "TZS 50M+", label: "paid out" },
];
