import type { Metadata } from "next";
import Navbar from "@/components/discover/Navbar";
import DiscoverClient from "@/components/discover/DiscoverClient";

const title = "Discover Campaigns | Konnectika";
const description =
  "Find brands, explore opportunities, and collaborate on campaigns that match your style and audience.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/discover" },
  openGraph: {
    title,
    description,
    url: "/discover",
    siteName: "Konnectika",
    type: "website",
    images: [{ url: "/assets/link-banner.webp", width: 1080, height: 630, alt: "Discover campaigns on Konnectika" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/link-banner.webp"],
  },
};

export default function DiscoverPage() {
  return (
    <main className="discover-dark min-h-screen bg-background">
      
      <DiscoverClient />
    </main>
  );
}
