import { formatTZS, getPlatformLabel } from "@/lib/utils";
import type { CampaignDetail } from "@/lib/campaign-detail";
import PlatformIcons from "./PlatformIcons";

interface CampaignMetricsProps {
  campaign: CampaignDetail;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-[150px] flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

export function CampaignMetrics({ campaign }: CampaignMetricsProps) {
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-6 border-y border-border py-6">
      <Metric
        label="Budget"
        value={`TZS ${formatTZS(campaign.budgetTotal)}`}
      />
      <Metric
        label="Earnings"
        value={`TZS ${formatTZS(campaign.paymentRate)} / post`}
      />
      <Metric label="Creators joined" value={campaign.applicants} />
      <Metric
        label="Platforms"
        value={
          <span className="flex flex-wrap items-center gap-2">
            <PlatformIcons platforms={campaign.platforms} />
            <span className="font-bold">
              {campaign.platforms.map(getPlatformLabel).join(" · ")}
            </span>
          </span>
        }
      />
      <Metric label="Category" value={campaign.category} />
      <Metric label="Last updated" value={campaign.lastUpdated} />
    </div>
  );
}
