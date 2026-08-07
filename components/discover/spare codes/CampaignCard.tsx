"use client";

import { Bookmark, Clock } from "lucide-react";
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
      className="bg-zinc-900 border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-200 group"
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
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 p-1.5  bg-black/40 text-zinc-400 hover:text-zinc-100 transition-colors"
          style={{ borderRadius: "9999px" }}
        >
          <Bookmark size={13} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h3 className="text-zinc-100 text-sm font-medium leading-tight line-clamp-1">
              {campaign.name}
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5 flex items-center gap-1">
              {campaign.brand}
              {campaign.isFeatured && (
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
              )}
            </p>
          </div>
        </div>

       

        <PlatformIcons platforms={campaign.platforms} />

        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Budget Funded</span>
            <span className="text-zinc-300 font-medium">
              TZS {formatTZS(campaign.budgetFunded)}
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1">
            <div
              className="h-1 rounded-full bg-orange-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">
              Payment Rate:{" "}
              <span className="text-zinc-300">TZS {formatTZS(campaign.paymentRate)}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1.5">
            {campaign.tags.map((tag) => (
              <span key={tag} className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-medium ${daysColor}`}>
            <Clock size={10} />
            {campaign.daysLeft}d left
          </div>
        </div>
      </div>
    </div>
  );
}
