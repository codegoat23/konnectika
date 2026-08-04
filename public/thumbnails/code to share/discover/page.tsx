import type { Metadata } from "next";
import Navbar from "@/components/discover/Navbar";
import DiscoverClient from "@/components/discover/DiscoverClient";

export const metadata: Metadata = {
  title: "Discover Campaigns | Konnectika",
  description:
    "Find brands, explore opportunities, and collaborate on campaigns that match your style and audience.",
};

export default function DiscoverPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      
      <DiscoverClient />
    </main>
  );
}
