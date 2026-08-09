import { BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CampaignDetail } from "@/lib/campaign-detail";
import { CopyCampaignLinkButton } from "./CopyCampaignLinkButton";
import { JoinCampaignButton, type CampaignCta } from "./JoinCampaignButton";

interface PublicCampaignHeaderProps {
  campaign: CampaignDetail;
  cta: CampaignCta;
}

export function PublicCampaignHeader({
  campaign,
  cta,
}: PublicCampaignHeaderProps) {
  const hasImage = Boolean(campaign.thumbnailPic);

  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
      {/* Campaign visual */}
   

      {/* Campaign information + actions */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{campaign.category}</Badge>
          {campaign.isFeatured && <Badge>Featured</Badge>}
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {campaign.title}
        </h1>

        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{campaign.brand}</span>
          {campaign.brandVerified && (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <BadgeCheck className="size-4" />
              Verified
            </span>
          )}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <JoinCampaignButton cta={cta} />
          <CopyCampaignLinkButton />
        </div>
        
      </div>
         {hasImage ? (
        <div
          className="aspect-[5/3] w-full shrink-0 overflow-hidden rounded-3xl border border-border bg-cover bg-center lg:w-[600px]"
          style={{ backgroundImage: `url(${campaign.thumbnailPic})` }}
          role="img"
          aria-label={campaign.title}
        />
      ) : (
        <div
          className="flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-border lg:w-[420px]"
          style={{ backgroundColor: campaign.thumbnailColor || "#18181b" }}
          aria-label={campaign.title}
        >
          <span className="text-5xl font-bold text-white/70">
            {campaign.thumbnailInitials}
          </span>
        </div>
      )}
    </header>
  );
}
