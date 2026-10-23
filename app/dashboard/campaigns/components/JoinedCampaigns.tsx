"use client";

import { useState } from "react";
import { JoinedCampaign } from "@/lib/campaigns";
import JoinedCampaignCard from "./JoinedCampaignCard";
import CampaignModal from "@/app/dashboard/creator/components/CampaignModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BiSolidMegaphone } from "react-icons/bi";
import EmptyDashboardState from "@/app/dashboard/components/EmptyDashboardState";

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
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Campaigns Joined
        </h2>

        <EmptyDashboardState
          title="No campaigns joined"
          description="Campaigns you join will appear here."
          icon={<BiSolidMegaphone aria-hidden="true" className="size-8" />}
          actionHref="/discover"
          actionLabel="Browse open campaigns"
        />
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
<div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-border bg-card p-4 rounded-2xl"
style={{
  borderRadius:24
}}
>

  <div>
    <p className="text-foreground font-semibold text-sm">
      Discover more opportunities
    </p>

    <p className="text-muted-foreground text-xs leading-relaxed">
      Explore active campaigns and apply to grow your reach
    </p>
  </div>

  <a
    href="/discover"
    target="_blank"
    rel="noopener noreferrer"
    className="px-5 py-2 rounded-xl text-sm bg-orange-500 text-white font-medium hover:bg-orange-600 transition flex items-center gap-2"
    style={{
      borderRadius:10
    }}
  >
    Browse campaigns
  </a>

</div>
      <h2 className="text-lg font-semibold text-foreground mb-4 mt-10">
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
