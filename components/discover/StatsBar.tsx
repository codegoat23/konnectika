import { Megaphone, Building2, Wallet, Users } from "lucide-react";
import type { StatsOverview } from "@/types";

interface StatsBarProps {
  stats: StatsOverview;
}

const statItems = (stats: StatsOverview) => [
  { icon: Megaphone, label: "Active Campaigns", value: stats.activeCampaigns.toString(), color: "text-orange-400" },
  { icon: Building2, label: "Brands", value: stats.brands.toString(), color: "text-orange-400" },
  { icon: Wallet, label: "Total Budget", value: stats.totalBudget, color: "text-orange-400" },
  { icon: Users, label: "Creators Joined", value: stats.creatorsJoined, color: "text-orange-400" },
];

export default function StatsBar({ stats }: StatsBarProps) {
  const items = statItems(stats);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3"
        >
          <div className={`p-2 rounded-lg bg-orange-500/10 ${item.color}`}>
            <item.icon size={16} />
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm leading-tight">{item.value}</p>
            <p className="text-muted-foreground text-xs">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
