"use client";

import { useEffect } from "react";
import { X, Bookmark, Maximize2 } from "lucide-react";
import type { Campaign } from "@/types";
import PlatformIcons from "./PlatformIcons";
import { formatTZS, getProgressPercent } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface CampaignModalProps {
  campaign: Campaign | null;
  onClose: () => void;
}

export default function CampaignModal({ campaign, onClose }: CampaignModalProps) {
  const router = useRouter();
  useEffect(() => {
    if (!campaign) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [campaign, onClose]);

  if (!campaign) return null;

  const progress = getProgressPercent(campaign.budgetFunded, campaign.budgetTotal);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      style={{ backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-custom "
      style={{
        borderRadius: "24px"
      }}
      >

      <div
  className="relative flex h-40 items-center justify-center overflow-hidden rounded-t-2xl bg-cover bg-center sm:h-52"
  style={{
    backgroundImage: `url(${campaign.thumbnailPic})`,
    backgroundSize: "fit",
    backgroundPosition: "center",
  }}
>
       
          <button
            onClick={() => router.push(`/discover/${campaign.id}`)}
            className="absolute top-3 left-3 flex items-center gap-2 p-3 rounded-full bg-black/60 text-zinc-200 hover:text-white border border-border transition-colors text-sm font-medium"
            aria-label="View more campaign details"
            title="View more details"
          >
            <Maximize2 size={18} />
            
          </button>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-3 rounded-full bg-black/60 text-zinc-200 hover:text-white border border-border transition-colors"
            aria-label="Close campaign modal"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-foreground text-xl font-bold leading-tight">{campaign.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground text-sm">{campaign.brand}</span>
                <span className="w-2 h-2 rounded-full bg-orange-500" />
              </div>
            </div>
          </div>

          <PlatformIcons platforms={campaign.platforms} size="md" />

          <div className="mt-4">
            <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
              About Campaign
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
              {campaign.description}
            </p>
          </div>

          <div className="mt-4 flex flex-col items-start justify-between gap-1 rounded-xl border border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm text-muted-foreground">Payment Rate</span>
            <span className="text-base font-semibold text-foreground sm:text-lg">
              TZS {formatTZS(campaign.paymentRate)} <span className="text-xs font-normal text-muted-foreground">per approved post</span>
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Budget progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-orange-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
  onClick={() => {
    router.push(`/campaign/${campaign.id}/apply`);
  }}
  className="flex-1 bg-foreground text-background text-sm font-medium py-3 rounded-full cursor-pointer hover:bg-foreground/90 transition-colors"
>
  Join Campaign
</button>
            <button className="p-3  border border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors" 
            style={{
              borderRadius: "9999px"
            }}
            >
              <Bookmark size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
