"use client";

import { Edit } from "lucide-react";

const creatorStatusStyles: Record<string, string> = {
  APPROVED: "bg-green-500/10 text-green-400",
  REJECTED: "bg-red-500/10 text-red-400",
  CHANGES_REQUESTED: "bg-amber-500/10 text-amber-400",
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
}: {
  campaign: CampaignHeaderData;
  role: string;
  creatorStatus?: string;
  onBack?: () => void;
  onEdit?: () => void;
}) {
  return (
    <>
      {/* HEADER ACTIONS */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>

        {role === "BRAND" ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-medium"
          >
            <Edit size={14} />
            Edit Campaign
          </button>
        ) : role === "CREATOR" ? (
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              creatorStatusStyles[creatorStatus || ""] ||
              "bg-amber-500/10 text-amber-400"
            }`}
          >
            {creatorStatus || "PENDING"}
          </div>
        ) : null}
      </div>

      {/* CAMPAIGN HERO CARD */}
  <div
  className="rounded-3xl overflow-hidden border border-border bg-card"
  style={{ borderRadius: 24 }}
>
  <div
    className="h-52 bg-cover bg-center relative"
    style={{ backgroundImage: `url(${campaign?.thumbnailPic})` }}
  >
    {/* Bottom dark gradient */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

    <div className="absolute bottom-5 left-5 z-10">
      <h1 className="text-2xl font-bold text-white">
        {campaign?.name}
      </h1>

      <p className="text-zinc-300 text-sm">
        {campaign?.businessProfile?.companyName}
      </p>
    </div>
  </div>
</div>
    </>
  );
}