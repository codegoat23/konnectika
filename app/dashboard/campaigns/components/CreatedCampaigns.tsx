"use client"

import { CreatedCampaign } from "@/lib/campaigns";

import { Users } from "lucide-react";
import { useRouter } from "next/navigation";

const BADGE_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  hot: "bg-red-500/10 text-red-400 border border-red-500/20",
  new: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  featured: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

export default function CreatedCampaigns({
  campaigns,
  limit,
}: {
  campaigns: CreatedCampaign[];
  limit?: number;
}) {
  const router = useRouter();
  const visibleCampaigns =
    limit && campaigns.length > limit ? campaigns.slice(0, limit) : campaigns;
  const hasMore = !!limit && campaigns.length > limit;
  if (campaigns.length === 0) {
    return (
      <section className="px-4 lg:px-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Your Campaigns
        </h2>
        <p className="text-sm text-zinc-500">
          You haven&apos;t created any campaigns yet.{" "}
          <button
    onClick={() => router.push("/dashboard/campaigns/new")}
    className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200 transition"
    style={{
      borderRadius:14
    }}
  >
    + Create your First Campaign
  </button>
        </p>
      </section>
    );
  }

  

  return (
    <section className="px-4 lg:px-6 mt-7">
     <div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-white">
    Your Campaigns
  </h2>

  <div className="flex items-center gap-3">
    {hasMore && (
      <button
        onClick={() => router.push("/dashboard/campaigns")}
        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:border-white/25 hover:text-white transition"
        style={{ borderRadius: 14 }}
      >
        View More
      </button>
    )}

    <button
      onClick={() => router.push("/dashboard/campaigns/new")}
      className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200 transition"
      style={{
        borderRadius:14
      }}
    >
      + New Campaign
    </button>
  </div>
</div>

      <div className="space-y-3">
        {visibleCampaigns.map((campaign) => (
       <div
  key={campaign.id}
  onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
  className="cursor-pointer border border-white/10 rounded-2xl p-4 flex justify-between items-start bg-zinc-900/60 hover:bg-zinc-900/80 transition"
  style={{ borderRadius: 24 }}
>
  <div className="flex gap-4 flex-1 flex-row  items-center">

    {/* Thumbnail */}
    <div className="w-20 h-20 shrink-0 overflow-hidden rounded-xl ">
      <img
        src={campaign.thumbnailPic}
        alt={campaign.name}
        className="w-full h-full object-cover"
        style={{borderRadius:16}}
      />
    </div>

    {/* Content */}
    <div className="min-w-0 flex flex-col gap-1">
      <h3 className="font-medium text-white text-sm">
        {campaign.name}
      </h3>

      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
        {campaign.description}
      </p>

    
  
    </div>
    
  </div>

  {/* Right Side */}
  <div className="flex flex-col items-end gap-6 shrink-0 ml-4">
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
        BADGE_STYLES[campaign.badge] ??
        "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
      }`}
    >
      {campaign.badge}
    </span>

    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-200 ">
  <Users size={14} />
  <span>{campaign._count.applications}</span>
</div>
  </div>
  
</div>

        ))}
      </div>
    </section>
  );
}
