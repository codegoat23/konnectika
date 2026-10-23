import type { Metadata } from "next";
import InquiryForm from "./inquiry-form";

export const metadata: Metadata = {
  title: "Launch Campaign | Konnectika",
  description: "Tell us about your campaign and we'll connect you with the right creators.",
};

export default function BrandCampaignInquiryPage() {
  return <main className="inquiry-page"><InquiryForm /></main>;
}
