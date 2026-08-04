"use client";

import { useEffect } from "react";
import { X, Bookmark, Check, Calendar, Clock, Users, Wallet } from "lucide-react";
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
  const remaining = campaign.budgetTotal - campaign.budgetFunded;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      style={{ backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl scrollbar-custom "
      style={{
        borderRadius: "24px"
      }}
      >

      <div
  className="h-44 flex items-center justify-center relative rounded-t-2xl overflow-hidden bg-cover bg-center"
  style={{
    backgroundImage: `url(${campaign.thumbnailPic})`,
    backgroundSize: "fit",
    backgroundPosition: "center",
  }}
>
       
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-zinc-400 hover:text-white border border-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-white text-xl font-bold leading-tight">{campaign.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-zinc-400 text-sm">{campaign.brand}</span>
                <span className="w-2 h-2 rounded-full bg-red-500" />
              </div>
            </div>
          </div>

          <PlatformIcons platforms={campaign.platforms} size="md" />

          <div className="mt-4">
            <h4 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
              About Campaign
            </h4>
            <p className="text-zinc-300 text-sm leading-relaxed">{campaign.description}</p>
          </div>

          <div className="mt-4">
            <h4 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
              What You&apos;ll Do
            </h4>
            <ul className="space-y-2">
              {campaign.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 border border-white/5 rounded-xl overflow-hidden">
            <h4 className="text-zinc-400 text-xs font-medium uppercase tracking-wider px-4 pt-4 pb-2">
              Campaign Details
            </h4>
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: "Category", value: campaign.category },
                  { label: "Campaign Type", value: campaign.campaignType },
                  { label: "Budget Funded", value: `TZS ${formatTZS(campaign.budgetFunded)}` },
                  {
                    label: "Remaining Budget",
                    value: `TZS ${formatTZS(remaining)}`,
                    valueClass: "text-green-400",
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
                  <tr key={row.label} className="border-t border-white/5">
                    <td className="px-4 py-2.5 text-zinc-500 text-xs w-2/5">{row.label}</td>
                    <td className={`px-4 py-2.5 text-xs ${row.valueClass ?? "text-zinc-200"}`}>
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
              <span>Budget progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-zinc-800/60 rounded-xl border border-white/5">
            <h4 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">
              Terms &amp; Conditions
            </h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Content must be original and comply with the brand guidelines. AI-generated content
              is not allowed. Payment will be made within 7 days after content approval.
            </p>
          </div>

          <div className="flex gap-3 mt-5">
            <button
  onClick={() => {
    router.push(`/campaign/${campaign.id}/apply`);
  }}
  className="flex-1 bg-white text-black text-sm font-medium py-3 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
>
  Join Campaign
</button>
            <button className="p-3  border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors" 
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
