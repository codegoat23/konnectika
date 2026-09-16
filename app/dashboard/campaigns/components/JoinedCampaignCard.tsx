"use client";

import { Clock } from "lucide-react";
import type { JoinedCampaign } from "@/lib/campaigns";
import PlatformIcons from "@/app/dashboard/creator/components/PlatformIcons";
import { getProgressPercent, getDaysLeftColor } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning border border-warning/25",
  APPROVED: "bg-success/15 text-success border border-success/25",
  REJECTED: "bg-destructive/15 text-destructive border border-destructive/25",
};

interface JoinedCampaignCardProps {
  campaign: JoinedCampaign;
  onClick: (campaign: JoinedCampaign) => void;
}

export default function JoinedCampaignCard({ campaign, onClick }: JoinedCampaignCardProps) {
  const progress = getProgressPercent(campaign.budgetFunded, campaign.budgetTotal);
  const daysColor = getDaysLeftColor(campaign.daysLeft);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View joined campaign: ${campaign.name} by ${campaign.businessProfile.companyName}`}
      onClick={() => onClick(campaign)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(campaign);
        }
      }}
      className="
        group
        relative
        h-[180px]
        hover:h-[210px]
        focus-visible:h-[210px]
        transition-all
        duration-500
        ease-out
        overflow-hidden
        cursor-pointer
        border border-border
        rounded-3xl
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-primary
        focus-visible:ring-offset-2
      "
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${campaign.thumbnailPic})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-transparent" />

      {/* Always Visible */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-row items-center justify-between">
        <p className="text-zinc-300 font-bold text-xs">{campaign.businessProfile.companyName}</p>

        <div className="z-10">
          <span
            className={`text-[8px] font-medium px-2 py-1 rounded-full whitespace-nowrap ${
              STATUS_STYLES[campaign.status] ??
              "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
            }`}
          >
            {campaign.status}
          </span>
        </div>
      </div>

      {/* Campaign Details Content */}
      <div
        className="
          absolute
          left-4
          right-4
          bottom-12
          opacity-100 sm:opacity-0
          sm:translate-y-4
          group-hover:opacity-100
          group-hover:translate-y-0
          group-focus-visible:opacity-100
          group-focus-visible:translate-y-0
          transition-all
          duration-500
          delay-150
          z-10
        "
      >
        <h3 className="text-white font-semibold text-sm line-clamp-1">{campaign.name}</h3>

        <div className="mt-1">
          <PlatformIcons platforms={campaign.platforms} />
        </div>

        <div className="mt-2 flex gap-1 items-center flex-wrap">
          {campaign.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-orange-500/20 text-[10px] text-orange-300 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div className="h-full bg-orange-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
