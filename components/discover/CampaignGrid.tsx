"use client";

import { RefreshCw } from "lucide-react";
import type { Campaign } from "@/types";
import CampaignCard from "./CampaignCard";

interface CampaignGridProps {
  campaigns: Campaign[];
  onCardClick: (campaign: Campaign) => void;
  isLoading?: boolean;
}

export default function CampaignGrid({ campaigns, onCardClick, isLoading }: CampaignGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
            <div className="h-36 bg-muted" />
            <div className="p-4 space-y-3">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-2 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <RefreshCw size={24} className="text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium mb-1">No campaigns found</p>
        <p className="text-muted-foreground text-sm">Try adjusting your filters or search term</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} onClick={onCardClick} />
      ))}
    </div>
  );
}
