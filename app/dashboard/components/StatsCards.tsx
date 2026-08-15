"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  ClockIcon,
  RocketIcon,
  CheckCircle2Icon,
  UsersIcon,
  WalletIcon,
  MegaphoneIcon,
  LucideIcon,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { OverviewHeader } from "./Overviewheader";

export interface StatCardData {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down";
  footerTitle?: string;
  footerSubtitle?: string;
  icon?: LucideIcon;
  accent?: "orange" | "blue" | "green" | "violet" | "primary";
  sparkline?: number[];
  /** Solid colored "hero" card style (like the orange Total Sales card) */
  highlight?: boolean;
}

function inferIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("earning") || l.includes("budget") || l.includes("revenue") || l.includes("fund"))
    return DollarSignIcon;
  if (l.includes("pending") || l.includes("await")) return ClockIcon;
  if (l.includes("active") || l.includes("launch")) return RocketIcon;
  if (l.includes("completed") || l.includes("finished")) return CheckCircle2Icon;
  if (l.includes("brand") || l.includes("application") || l.includes("user")) return UsersIcon;
  if (l.includes("campaign")) return MegaphoneIcon;
  return WalletIcon;
}

const SPARKLINE_KEYWORDS = ["earning", "revenue", "budget", "fund", "income"];
function shouldAutoSparkline(label: string) {
  const l = label.toLowerCase();
  return SPARKLINE_KEYWORDS.some((k) => l.includes(k));
}
function fabricateSparkline(trend: "up" | "down" | undefined): number[] {
  const base = [4, 6, 5, 7, 6, 8, 7, 9, 8, 10];
  return trend === "down" ? [...base].reverse() : base;
}

const accentClasses: Record<NonNullable<StatCardData["accent"]>, string> = {
  orange: "bg-orange-500/10 text-orange-500",
  blue: "bg-orange-500/10 text-orange-500",
  green: "bg-success/15 text-success",
  violet: "bg-orange-500/10 text-orange-500",
  primary: "bg-primary/10 text-primary",
};

const strokeColor: Record<NonNullable<StatCardData["accent"]>, string> = {
  orange: "#f97316",
  blue: "#fb923c",
  green: "#22c55e",
  violet: "#ea580c",
  primary: "var(--primary)",
};

// Decorative blob pattern for the highlighted / hero card, tucked in the
// bottom-right corner like the reference design.
function HeroPattern({ fill }: { fill: string }) {
  return (
    <svg
      className="pointer-events-none absolute -bottom-4 -right-4 size-28 opacity-25"
      viewBox="0 0 100 100"
      fill="none"
    >
      <path
        d="M50 5 C65 5 70 20 80 20 C95 20 95 40 90 50 C95 60 95 80 80 80 C70 80 65 95 50 95 C35 95 30 80 20 80 C5 80 5 60 10 50 C5 40 5 20 20 20 C30 20 35 5 50 5 Z"
        fill={fill}
      />
    </svg>
  );
}

export function StatsCards({ stats }: { stats: StatCardData[] }) {
  return (
    <>
        <OverviewHeader
     title="Overview"
     value="April 10, 2026 - May 11, 2026"
     onValueChange={(range) => console.log("Selected range:", range)}
   />
      <div className="grid grid-cols-2 gap-3 px-4 lg:px-6 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon ?? inferIcon(stat.label);
        const TrendIcon = stat.trend === "down" ? TrendingDownIcon : TrendingUpIcon;
        const accent = stat.accent ?? "primary";

              // ---- Highlighted "hero" card (solid orange, white text) ----
        if (stat.highlight) {
          return (
            <Card
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border-0 bg-orange-500 p-4 shadow-xs gap-2 text-white"
            >
              <HeroPattern fill="white" />
              <div className="relative flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <Icon className="size-3.5" />
                </div>
                <span className="text-xs font-medium">{stat.label}</span>
              </div>

              <div className="relative text-xl font-semibold tabular-nums">{stat.value}</div>

              <div className="relative flex items-center gap-1.5">
                {stat.delta && (
                  <Badge className="border-0 rounded-full bg-white/25 text-white text-[11px] px-1.5 py-0 h-5 gap-0.5 hover:bg-white/25">
                    <TrendIcon className="size-3" />
                    {stat.delta}
                  </Badge>
                )}
                {stat.footerSubtitle && (
                  <span className="text-[11px] text-white/70">{stat.footerSubtitle}</span>
                )}
              </div>
            </Card>
          );
        }

        // ---- Standard card: same layout as hero, icon top-left circle,
        // just swapping the orange fill for a light card + colored icon ----
        const trendColor =
          stat.trend === "down"
            ? "text-destructive bg-destructive/15"
            : "text-success bg-success/15";
        const accentClass = accentClasses[accent];
        const lineColor = strokeColor[accent];
        const isGreenAccent = accent === "green";

        return (
          
          <Card
            key={stat.label}
            className="relative overflow-hidden rounded-2xl  bg-card  p-4 shadow-xs gap-2"
          >
            <div className="relative flex items-center gap-2">
              <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${isGreenAccent ? "bg-success/15 text-success" : "bg-orange-500/10 text-orange-500"}`}>
                <Icon className="size-3.5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </div>

            <div className="relative text-xl font-semibold tabular-nums">{stat.value}</div>

            <div className="relative flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                {stat.delta && (
                  <Badge
                    variant="outline"
                    className={`border-0 rounded-full text-[11px] px-1.5 py-0 h-5 gap-0.5 ${trendColor}`}
                  >
                    <TrendIcon className="size-3" />
                    {stat.delta}
                  </Badge>
                )}
                {stat.footerSubtitle  && (
                  <span className="text-[11px] text-muted-foreground">
                    {stat.footerSubtitle}
                  </span>
                )}
              </div>

             
            </div>
          </Card>
        );
      })}
    </div>
    </>
  
  );
}