"use client";

interface CampaignBudgetData {
  budgetTotal: number;
  budgetFunded: number;
}

export default function CampaignBudget({ campaign }: { campaign: CampaignBudgetData }) {
  const total = campaign?.budgetTotal ?? 0;
  const funded = campaign?.budgetFunded ?? 0;
  const pct = total > 0 ? Math.round((funded / total) * 100) : 0;

  return (
    <div
      className="bg-card border border-border p-5"
      style={{ borderRadius: 24 }}
    >
      <h3 className="text-foreground font-semibold mb-4">Budget</h3>

      <div className="grid grid-cols-3 gap-3">
        <div
          className="bg-muted/50 border border-border p-3 rounded-xl"
          style={{ borderRadius: 16 }}
        >
          <p className="text-xs text-muted-foreground">Total Budget</p>
          <p className="text-foreground font-semibold">
            TZS {total.toLocaleString()}
          </p>
        </div>

        <div
          className="bg-muted/50 border border-border p-3 rounded-xl"
          style={{ borderRadius: 16 }}
        >
          <p className="text-xs text-muted-foreground">Spent</p>
          <p className="text-emerald-600 font-semibold">
            TZS {funded.toLocaleString()}
          </p>
        </div>

        <div
          className="bg-muted/50 border border-border p-3 rounded-xl"
          style={{ borderRadius: 16 }}
        >
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="text-amber-600 font-semibold">
            TZS {(total - funded).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Budget usage</span>
          <span>{pct}%</span>
        </div>

        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500"
            style={{ width: `${pct}%`, borderRadius: 50 }}
          />
        </div>
      </div>
    </div>
  );
}