import { formatTZS, getPlatformLabel } from "@/lib/utils";
import type { CampaignEarning } from "@/lib/campaign-detail";
import PlatformIcons from "./PlatformIcons";

interface CampaignEarningsProps {
  earnings: CampaignEarning[];
}

export function CampaignEarnings({ earnings }: CampaignEarningsProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-foreground">Earnings</h2>
       
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {earnings.map((earning) => (
          <div
            key={earning.platform}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2">
              <PlatformIcons platforms={[earning.platform]} size="md" />
              <p className="text-sm font-bold text-foreground">
                {getPlatformLabel(earning.platform)}
              </p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              TZS {formatTZS(earning.rate)}
            </p>
            <p className="text-xs text-muted-foreground">per approved post</p>
          </div>
        ))}
      </div>
    </section>
  );
}
