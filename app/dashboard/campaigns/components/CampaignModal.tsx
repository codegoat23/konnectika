"use client";

import { useEffect } from "react";
import { X, Bookmark, Check } from "lucide-react";
import type { Campaign } from "@/types";
import type { ApplicationStatus } from "@prisma/client";
import PlatformIcons from "./PlatformIcons";
import { formatTZS, getProgressPercent } from "@/lib/utils";

interface CampaignModalProps {
  campaign: Campaign | null;
  onClose: () => void;
  /**
   * If the viewer has already applied to this campaign, pass their
   * application status to replace the "Join Campaign" button with a
   * status indicator instead.
   */
  applicationStatus?: ApplicationStatus;
}

const APPLICATION_STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Application Pending Review",
    className: "bg-warning/15 text-warning border border-warning/25",
  },
  APPROVED: {
    label: "You're In — Application Approved",
    className: "bg-success/15 text-success border border-success/25",
  },
  REJECTED: {
    label: "Application Not Accepted",
    className: "bg-destructive/15 text-destructive border border-destructive/25",
  },
};

export default function CampaignModal({ campaign, onClose, applicationStatus }: CampaignModalProps) {
  useEffect(() => {
    if (!campaign) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [campaign, onClose]);

  if (!campaign) return null;

  const progress = getProgressPercent(campaign.budgetFunded, campaign.budgetTotal);
  const remaining = campaign.budgetTotal - campaign.budgetFunded;
  const statusConfig = applicationStatus ? APPLICATION_STATUS_CONFIG[applicationStatus] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
      style={{ backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative bg-card border border-border rounded-3xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl scrollbar-custom"
      >
        <div
          className="h-44 flex items-center justify-center relative rounded-t-3xl overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: `url(${campaign.thumbnailPic})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 size-11 flex items-center justify-center rounded-full bg-black/50 text-zinc-300 hover:text-white border border-border transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 id="campaign-modal-title" className="text-foreground text-lg sm:text-xl font-bold leading-tight">
                {campaign.name}
              </h2>
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
            <p className="text-muted-foreground text-sm leading-relaxed">{campaign.description}</p>
          </div>

          <div className="mt-4">
            <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
              What You&apos;ll Do
            </h4>
            <ul className="space-y-2">
              {campaign.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check size={14} className="text-orange-500 mt-0.5 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 border border-border rounded-xl overflow-hidden">
            <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider px-4 pt-4 pb-2">
              Campaign Details
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: "Category", value: campaign.category },
                    { label: "Campaign Type", value: campaign.campaignType },
                    { label: "Budget Funded", value: `TZS ${formatTZS(campaign.budgetFunded)}` },
                    {
                      label: "Remaining Budget",
                      value: `TZS ${formatTZS(remaining)}`,
                      valueClass: "text-muted-foreground",
                    },
                    { label: "Payment Rate", value: `TZS ${formatTZS(campaign.paymentRate)} per approved post` },
                    {
                      label: "Creator Requirements",
                      value: "Tanzania based creators with active audience",
                    },
                    { label: "Content Format", value: campaign.contentFormat },
                    { label: "Duration", value: campaign.duration },
                    {
                      label: "Applications Close",
                      value: campaign.applicationsClose,
                    },
                    {
                      label: "Type",
                      value: campaign.isOpenToAll ? "Open to all creators" : "Invite only",
                    },
                  ].map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <td className="px-4 py-2.5 text-muted-foreground text-xs w-2/5">{row.label}</td>
                      <td className={`px-4 py-2.5 text-xs ${row.valueClass ?? "text-foreground"}`}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4">
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

          <div className="mt-4 p-3 bg-muted/60 rounded-xl border border-border">
            <h4 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
              Terms &amp; Conditions
            </h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Content must be original and comply with the brand guidelines. AI-generated content
              is not allowed. Payment will be made within 7 days after content approval.
            </p>
          </div>

          <div className="flex gap-3 mt-5">
            {statusConfig ? (
              <div
                className={`flex-1 text-center text-sm font-medium py-3 rounded-full ${statusConfig.className}`}
              >
                {statusConfig.label}
              </div>
            ) : (
              <button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]"
              >
                Join Campaign
              </button>
            )}
            <button
              aria-label="Bookmark campaign"
              className="p-3 border border-border text-muted-foreground hover:text-foreground rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary size-11 flex items-center justify-center shrink-0"
            >
              <Bookmark size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
