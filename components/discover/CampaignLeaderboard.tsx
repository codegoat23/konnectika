import { Trophy } from "lucide-react";

export function CampaignLeaderboard() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
      <Trophy className="mx-auto size-6 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-bold text-foreground">Leaderboard</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Leaderboard data will appear here once creators start participating.
      </p>
    </div>
  );
}
