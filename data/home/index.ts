export type HomePlatform = "instagram" | "tiktok" | "facebook" | "youtube" | "x";

export interface NavLink {
  label: string;
  href: string;
}

export const creatorNavLinks: NavLink[] = [
  { label: "Discover Campaigns", href: "/discover" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Featured", href: "#featured-campaigns" },
  { label: "Testimonials", href: "#testimonials" },
];

export const brandNavLinks: NavLink[] = [
  { label: "Why Konnectika", href: "#why-konnectika" },
  { label: "Workflow", href: "#workflow" },
  { label: "Marketplace", href: "#marketplace" },
  { label: "Testimonials", href: "#testimonials" },
];

export const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Discover Campaigns", href: "/discover" },
      { label: "For Creators", href: "#how-it-works" },
      { label: "For Brands", href: "#why-konnectika" },
      { label: "How It Works", href: "#how-it-works" },
    ],
  },
  {
    title: "For Creators",
    links: [
      { label: "Find Campaigns", href: "/discover" },
      { label: "Join Konnectika", href: "/signup" },
      { label: "Success Stories", href: "#testimonials" },
      { label: "Featured Campaigns", href: "#featured-campaigns" },
    ],
  },
  {
    title: "For Brands",
    links: [
      { label: "Start a Campaign", href: "/signup" },
      { label: "Creator Marketplace", href: "#marketplace" },
      { label: "Why Konnectika", href: "#why-konnectika" },
      { label: "Campaign Workflow", href: "#workflow" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Community Guidelines", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export const socialLinks = [
  { label: "Instagram", href: "#" },
  { label: "TikTok", href: "#" },
  { label: "X", href: "#" },
  { label: "YouTube", href: "#" },
];
