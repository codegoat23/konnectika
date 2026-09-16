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
       <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    {/* Gold gradient */}
    <linearGradient id="gold3d" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF2B0"/>
      <stop offset="35%" stop-color="#F7C948"/>
      <stop offset="70%" stop-color="#D4A017"/>
      <stop offset="100%" stop-color="#8A5A0A"/>
    </linearGradient>

    {/* Highlight shine */}
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.9)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>

    {/* Soft shadow */}
    <filter id="softShadow">
      <feDropShadow dx="0" dy="0.8" stdDeviation="0.8" flood-color="#000" flood-opacity="0.35"/>
    </filter>

    {/* Inner glow */}
    <filter id="innerGlow">
      <feGaussianBlur stdDeviation="0.6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  {/* Badge shape */}
  <path
    d="M16 8.375C16 8.93437 15.8656 9.45312 15.5969 9.92813C15.3281 10.4031 14.9688 10.775 14.5156 11.0344C14.5281 11.1188 14.5344 11.25 14.5344 11.4281C14.5344 12.275 14.25 12.9937 13.6875 13.5875C13.1219 14.1844 12.4406 14.4812 11.6438 14.4812C11.2875 14.4812 10.9469 14.4156 10.625 14.2844C10.375 14.7969 10.0156 15.2094 9.54375 15.525C9.075 15.8438 8.55937 16 8 16C7.42812 16 6.90938 15.8469 6.44688 15.5344C5.98125 15.225 5.625 14.8094 5.375 14.2844C5.05312 14.4156 4.71562 14.4812 4.35625 14.4812C3.55937 14.4812 2.875 14.1844 2.30312 13.5875C1.73125 12.9937 1.44687 12.2719 1.44687 11.4281C1.44687 11.3344 1.45938 11.2031 1.48125 11.0344C1.02813 10.7719 0.66875 10.4031 0.4 9.92813C0.134375 9.45312 0 8.93437 0 8.375C0 7.78125 0.15 7.23438 0.446875 6.74062C0.74375 6.24687 1.14375 5.88125 1.64375 5.64375C1.5125 5.2875 1.44687 4.92812 1.44687 4.57188C1.44687 3.72813 1.73125 3.00625 2.30312 2.4125C2.875 1.81875 3.55937 1.51875 4.35625 1.51875C4.7125 1.51875 5.05312 1.58438 5.375 1.71563C5.625 1.20312 5.98438 0.790625 6.45625 0.475C6.925 0.159375 7.44063 0 8 0C8.55937 0 9.075 0.159375 9.54375 0.471875C10.0125 0.7875 10.375 1.2 10.625 1.7125C10.9469 1.58125 11.2844 1.51562 11.6438 1.51562C12.4406 1.51562 13.1219 1.8125 13.6875 2.40937C14.2531 3.00625 14.5344 3.725 14.5344 4.56875C14.5344 4.9625 14.475 5.31875 14.3562 5.64062C14.8562 5.87813 15.2563 6.24375 15.5531 6.7375C15.85 7.23438 16 7.78125 16 8.375Z"
    fill="url(#gold3d)"
    filter="url(#softShadow)"
  />

  {/* Shine highlight (top-left glow) */}
  <path
    d="M4 3 C6 1.5, 9 1.5, 11 3 C9 2.2, 6 2.2, 4 3 Z"
    fill="url(#shine)"
    opacity="0.6"
  />

  {/* Check mark */}
  <path
    d="M7.65938 10.7844L10.9625 5.8375C11.0469 5.70625 11.0719 5.5625 11.0437 5.40938C11.0125 5.25625 10.9344 5.13438 10.8031 5.05312C10.6719 4.96875 10.5281 4.94063 10.375 4.9625C10.2188 4.9875 10.0938 5.0625 10 5.19375L7.09062 9.56875L5.75 8.23125C5.63125 8.1125 5.49375 8.05625 5.34062 8.0625C5.18437 8.06875 5.05 8.125 4.93125 8.23125C4.825 8.3375 4.77187 8.47187 4.77187 8.63437C4.77187 8.79375 4.825 8.92813 4.93125 9.0375L6.77187 10.8781L6.8625 10.95C6.96875 11.0219 7.07812 11.0562 7.18437 11.0562C7.39375 11.0531 7.55313 10.9656 7.65938 10.7844Z"
    fill="white"
  />
</svg>
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
