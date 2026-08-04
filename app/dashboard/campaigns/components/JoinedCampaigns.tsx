"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { JoinedCampaign } from "@/lib/campaigns";
import JoinedCampaignCard from "./JoinedCampaignCard";
import CampaignModal from "@/app/dashboard/creator/components/CampaignModal";
import { useRouter } from "next/navigation";

export default function JoinedCampaigns({
  campaigns,
}: {
  campaigns: JoinedCampaign[];
}) {
  const [selected, setSelected] = useState<JoinedCampaign | null>(null);
  const router = useRouter()

  if (campaigns.length === 0) {
    return (
      <section className="px-4 lg:px-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Campaigns Joined
        </h2>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-full bg-zinc-800 mb-4">
            <RefreshCw size={24} className="text-zinc-500" />
          </div>
          <p className="text-zinc-300 font-medium mb-1">
            You haven&apos;t applied to any campaigns yet
          </p>
          <p className="text-zinc-500 text-sm">
            <a href="/discover" className="text-white underline">
              Browse open campaigns
            </a>{" "}
            to get started
          </p>
        </div>
      </section>
    );
  }

  // CampaignModal's `applicationsClose` field expects a display string —
  // the Prisma query returns a Date, so format it here.
  const modalCampaign = selected
    ? {
        ...selected,
        applicationsClose: selected.applicationsClose.toLocaleDateString(),
      }
    : null;

    
  return (
    <section className="px-4 lg:px-6">
          {/* CTA SECTION */}
<div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10 bg-zinc-900/40 p-4 rounded-2xl"
style={{
  borderRadius:24
}}
>

  <div>
    <p className="text-white font-semibold text-sm">
      Discover more opportunities
    </p>

    <p className="text-zinc-400 text-xs leading-relaxed">
      Explore active campaigns and apply to grow your reach
    </p>
  </div>

  <a
    href="/discover"
    target="_blank"
    rel="noopener noreferrer"
    className="px-5 py-2 rounded-xl text-sm bg-white text-black font-medium hover:bg-zinc-200 transition flex items-center gap-2"
    style={{
      borderRadius:10
    }}
  >
    Browse campaigns
  </a>

</div>
      <h2 className="text-lg font-semibold text-white mb-4 mt-10">
        Campaigns Joined
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {campaigns.map((campaign) => (
          <JoinedCampaignCard
            key={campaign.id}
            campaign={campaign}
            onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
          />
        ))}
      </div>
  

     
    </section>
  );
}
