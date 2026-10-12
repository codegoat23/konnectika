"use client";

import { Bookmark, Clock } from "lucide-react";
import type { Campaign } from "@/types";
import PlatformIcons from "./PlatformIcons";
import { formatTZS, getProgressPercent, getBadgeStyles, getDaysLeftColor } from "@/lib/utils";
import { ApprovedCampaigns } from "@/lib/campaigns";

interface CampaignCardProps {
  campaign: ApprovedCampaigns;
  onClick: (campaign: ApprovedCampaigns) => void;
}

export default function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const progress = getProgressPercent(campaign.budgetFunded, campaign.budgetTotal);
  const badge = getBadgeStyles(campaign.badge);
  const daysColor = getDaysLeftColor(campaign.daysLeft);

  return (
<div
  onClick={() => onClick(campaign)}
  className="
    bg-card
    group
    relative
    h-[190px]
    hover:h-[210px]
    transition-all
    duration-500
    ease-out
    rounded-[24]
    overflow-hidden
    cursor-pointer
    border border-border
    z-20
    hover:border-border
    hover:-translate-y-0.5
  "
 
>
  {/* Background */}
  <div
    className="absolute inset-0 bg-cover bg-center "
    style={{
      backgroundImage: `url(${campaign.thumbnailPic})`,
    }}
  />

  {/* Overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-transparent" />

  {/* Always Visible */}
  <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-row items-center justify-between">
    <div className="flex items-center gap-2 justify-center">
        <p className="text-zinc-300 font-medium text-[10px]">
      {campaign.businessProfile.companyName}
    </p>
   
    </div>
  
 
  </div>

  {/* Hidden Content */}
  <div
    className="
      absolute
      left-4
      right-4
      bottom-12
      opacity-0
      translate-y-4
      group-hover:opacity-100
      group-hover:translate-y-0
      transition-all
      duration-500
      delay-150
      z-10
    "
  >
    <h3 className="text-white font-semibold text-sm">
      {campaign.name}
         
    </h3>

    <div className="mt-1">
      <PlatformIcons platforms={campaign.platforms} />
    </div>
<div className=" flex flex-row justify-between items-center gap-2 text-xs text-zinc-400">
 <div className="mt-2 flex gap-1 items-center flex-wrap">
      {campaign.tags.slice(0, 2).map((tag) => (
        <span
          key={tag}
          className="px-2 py-1 rounded-full bg-orange-500/10 text-[10px] text-orange-400"
        >
          {tag}
        </span>
      ))}
    </div>
   

</div>
   

    
  </div>

  {/* Progress Bar */}
  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
    <div
      className="h-full bg-orange-500"
      style={{ width: `${progress}%` }}
    />
  </div>
</div>
  );
}
