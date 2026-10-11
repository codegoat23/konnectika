"use client";

import { Edit } from "lucide-react";

const creatorStatusStyles: Record<string, string> = {
  APPROVED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/15 text-destructive",
  CHANGES_REQUESTED: "bg-warning/15 text-warning",
};

interface CampaignHeaderData {
  name: string;
  thumbnailPic: string | null;
  businessProfile: { companyName: string | null } | null;
}

export default function CampaignHeader({
  campaign,
  role,
  creatorStatus,
  onBack,
  onEdit,
  actions,
}: {
  campaign: CampaignHeaderData;
  role: string;
  creatorStatus?: string;
  onBack?: () => void;
  onEdit?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <>
      {/* HEADER ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {role === "BRAND" ? (
            <button
              onClick={onEdit}
              className="flex min-h-10 items-center justify-center gap-2 rounded-full bg-orange-500 px-3 py-2 text-xs font-medium text-white sm:px-4 sm:text-sm"
            >
              <Edit size={14} />
              Edit Campaign
            </button>
          ) : role === "CREATOR" ? (
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                creatorStatusStyles[creatorStatus || ""] ||
                "bg-warning/15 text-warning"
              }`}
            >
              {creatorStatus || "PENDING"}
            </div>
          ) : null}
          {actions}
        </div>
      </div>

      {/* CAMPAIGN HERO CARD */}
      <div
        className="rounded-3xl overflow-hidden border border-border bg-card"
        style={{ borderRadius: 24 }}
      >
        <div
          className="relative h-44 bg-cover bg-center sm:h-52 xl:h-64 2xl:h-72"
          style={{ backgroundImage: `url(${campaign?.thumbnailPic})` }}
        >
          {/* Bottom dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute inset-x-4 bottom-4 z-10 sm:inset-x-6 sm:bottom-5">
            <h1 className="max-w-full break-words text-2xl font-bold leading-tight text-white sm:text-4xl 2xl:text-6xl">
              {campaign?.name}
            </h1>

           
          </div>
        </div>
      </div>
    </>
  );
}
