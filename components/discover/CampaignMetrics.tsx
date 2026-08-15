import { Clock3, Share2, Tag, Users } from "lucide-react";

import type { CampaignDetail } from "@/lib/campaign-detail";
import {
  formatTZS,
  getDaysLeftColor,
  getPlatformLabel,
  getProgressPercent,
} from "@/lib/utils";
import PlatformIcons from "./PlatformIcons";

interface CampaignMetricsProps {
  campaign: CampaignDetail;
}

function MetricRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5 last:border-b-0">
      <div className="flex items-center gap-4">
        <span className="text-white/70">{icon}</span>

        <span className="text-[15px] font-medium text-white/70">
          {label}
        </span>
      </div>

      <div className="text-right text-[15px] font-semibold text-white/85">
        {value}
      </div>
    </div>
  );
}

export function CampaignMetrics({ campaign }: CampaignMetricsProps) {
  const budget = campaign.budgetTotal;
  const funded = campaign.budgetFunded;
  const remaining = Math.max(budget - funded, 0);
  const progress = budget > 0 ? getProgressPercent(funded, budget) : 0;
  const daysColor = getDaysLeftColor(campaign.daysLeft);
  const closed = campaign.isClosed;

  return (
    <div className="w-full space-y-3">
      {/* ================= BUDGET CARD ================= */}
      <div className="overflow-hidden rounded-[24px] border border-white/[0.12] bg-[#211f1f] shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
        {/* Budget */}
        <div className="rounded-[22px] bg-gradient-to-b from-[#302e2e] to-[#242222] px-6 pb-7 pt-6">
          <div className="mb-7 flex items-baseline gap-2">
            <span className="text-3xl font-medium text-white/30">
              TZS
            </span>

            <span className="text-4xl font-bold tracking-tight text-white">
              {formatTZS(budget)}
            </span>

            <span className="text-3xl font-semibold text-white/30">
              budget
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-white"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          {/* Budget labels */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-lg font-bold text-white">
              TZS {formatTZS(funded)}
              <span className="ml-1 text-sm font-medium text-white/50">
                funded
              </span>
            </span>

            <span className="text-lg font-bold text-white/70">
              TZS {formatTZS(remaining)}
              <span className="ml-1 text-sm font-medium text-white/50">
                left
              </span>
            </span>
          </div>
        </div>

        {/* Campaign badges */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-5">
          {/* Earnings badge */}
          <span className="rounded-full border border-info/30 bg-info/20 px-3 py-1.5 text-sm font-semibold text-info">
            TZS {formatTZS(campaign.paymentRate)} / post
          </span>

          {/* Creators */}
          <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-sm font-semibold text-white/90">
            <Users className="h-4 w-4 fill-current" />
            {campaign.applicants}
          </span>

          {/* Applications close */}
          <span
            className={`flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-sm font-semibold ${daysColor}`}
          >
            <Clock3 className="h-4 w-4 fill-current" />
            {closed ? "Closed" : `${campaign.daysLeft} days left`}
          </span>
        </div>
      </div>

      {/* ================= DETAILS ================= */}
      <div className="overflow-hidden rounded-[24px] bg-[#211f1f]">
        {/* Category */}
        <MetricRow
          icon={<Tag className="h-5 w-5 fill-current" />}
          label="Category"
          value={campaign.category}
        />

        {/* Platforms */}
        <MetricRow
          icon={<Share2 className="h-5 w-5" />}
          label="Platforms"
          value={
            <span className="inline-flex flex-wrap items-center justify-end gap-2">
              <PlatformIcons platforms={campaign.platforms} />
             
            </span>
          }
        />

        {/* Last updated */}
        <MetricRow
          icon={<Clock3 className="h-5 w-5 fill-current" />}
          label="Last updated"
          value={campaign.lastUpdated}
        />
      </div>
    </div>
  );
}
