"use client";

import { Bookmark, Clock, Users } from "lucide-react";
import type { Campaign } from "@/types";
import PlatformIcons from "./PlatformIcons";
import { formatTZS, getProgressPercent, getBadgeStyles, getDaysLeftColor } from "@/lib/utils";

interface CampaignCardProps {
  campaign: Campaign;
  onClick: (campaign: Campaign) => void;
}

export default function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const progress = getProgressPercent(campaign.budgetFunded, campaign.budgetTotal);
  const badge = getBadgeStyles(campaign.badge);
  const daysColor = getDaysLeftColor(campaign.daysLeft);

  return (
    <div
      onClick={() => onClick(campaign)}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-border hover:-translate-y-0.5 transition-all duration-200 group"
      style={{
        borderRadius: "24px"
      }}
    >
     <div
  className="relative h-36 flex items-center justify-center bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: `url(${campaign.thumbnailPic})`,
    backgroundSize: "fit",
    backgroundPosition: "center",
  }}
>
      

        <div className="absolute top-3 left-3">
          
        </div>

        
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <div className="flex flex-row justify-between items-center w-[260px] ">
                 <h3 className="text-foreground text-sm font-medium leading-tight line-clamp-1">
              {campaign.name}
            </h3>
             <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground ">
  <Users size={12} />
  <span>{campaign._count.applications}</span>
</div>
            </div>
           
            <p className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
              {campaign.brand}
              {campaign.isFeatured && (
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
              )}
            </p>
          </div>
        </div>

       

     <div className="mt-3 space-y-2">
  {/* Platforms + Rate */}
  <div className="flex items-center justify-between gap-3">
    <PlatformIcons platforms={campaign.platforms} />

    <span
      className="inline-flex items-center gap-1.5
      px-2.5 py-1 rounded-full
      bg-card border border-border
      text-[10px] text-muted-foreground
      backdrop-blur-md
      whitespace-nowrap
      hover:bg-muted hover:border-border
      transition-all duration-200"
    >
      <span className="text-muted-foreground">TZS</span>
      <span className="text-foreground font-medium">
        {formatTZS(campaign.paymentRate)}
      </span>
      <span className="text-muted-foreground">/post</span>
    </span>
  </div>

  {/* Progress */}
  <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
    <div
      className="h-1 rounded-full bg-white transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
</div>

       
      </div>
    </div>
  );
}
