import { ChartColumn } from "lucide-react";

export function CampaignAnalytics() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
      <ChartColumn className="mx-auto size-6 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-bold text-foreground">Analytics</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Campaign analytics will appear here. Private brand analytics are never
        shown publicly.
      </p>
    </div>
  );
}
