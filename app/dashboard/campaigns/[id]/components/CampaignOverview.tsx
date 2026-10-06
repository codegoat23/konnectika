"use client";

import PlatformIcons from "@/components/discover/PlatformIcons";
import { RiVerifiedBadgeLine } from "react-icons/ri";
import type { Platform } from "@/types";

interface CampaignOverviewData {
  description: string | null;
  platforms: Platform[];
  requirements: string[];
}

export default function CampaignOverview({ campaign }: { campaign: CampaignOverviewData }) {
  return (
    <div
      className="bg-card border border-border p-5 text-sm text-muted-foreground space-y-4"
      style={{ borderRadius: 24 }}
    >
      <p className="text-xs">{campaign?.description}</p>

      <PlatformIcons platforms={campaign?.platforms} />

      {campaign?.requirements?.length > 0 && (
        <div className="pt-2">
          <h3 className="text-foreground font-semibold mb-3">Requirements</h3>

          <div className="space-y-3">
            {campaign.requirements.map((req: string, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <RiVerifiedBadgeLine className="mt-0.5 size-4 shrink-0 text-green-500" aria-hidden="true" />
                <span>{req}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
