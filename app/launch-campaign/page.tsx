import type { Metadata } from "next";
import InquiryForm from "./inquiry-form";

const title = "Launch Campaign | Konnectika";
const description = "Tell us about your campaign and we'll connect you with the right creators.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/launch-campaign" },
  openGraph: {
    title,
    description,
    url: "/launch-campaign",
    siteName: "Konnectika",
    type: "website",
    images: [{ url: "/assets/link-banner.webp", width: 1080, height: 630, alt: "Launch a campaign with Konnectika" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/link-banner.webp"],
  },
};

export default function BrandCampaignInquiryPage() {
  return <main className="inquiry-page"><InquiryForm /></main>;
}
