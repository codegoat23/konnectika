"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { OverviewHeader, getRangeLabel } from "./Overviewheader";

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

function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = stat.icon ?? inferIcon(stat.label);
  const TrendIcon = stat.trend === "down" ? TrendingDownIcon : TrendingUpIcon;
  const accent = stat.accent ?? "primary";

  if (stat.highlight) {
    return (
      <Card className="relative overflow-hidden rounded-2xl border-0 bg-orange-500 p-5 lg:p-4 shadow-xs gap-3 lg:gap-2 text-white">
        <HeroPattern fill="white" />
        <div className="relative flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/25">
            {createElement(Icon, { className: "size-3.5" })}
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

  const trendColor =
    stat.trend === "down"
      ? "text-destructive bg-destructive/15"
      : "text-success bg-success/15";
  const isGreenAccent = accent === "green";

  return (
    <Card className="relative overflow-hidden rounded-2xl bg-card p-5 lg:p-4 shadow-xs gap-3 lg:gap-2">
      <div className="relative flex items-center gap-2">
        <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${isGreenAccent ? "bg-success/15 text-success" : "bg-orange-500/10 text-orange-500"}`}>
          {createElement(Icon, { className: "size-3.5" })}
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
          {stat.footerSubtitle && (
            <span className="text-[11px] text-muted-foreground">
              {stat.footerSubtitle}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatSkeleton() {
  return (
    <Card className="relative overflow-hidden rounded-2xl bg-card p-5 lg:p-4 shadow-xs gap-3 lg:gap-2">
      <div className="relative flex items-center gap-2">
        <Skeleton className="size-7 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-1/2" />
      <div className="relative flex items-center gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <>
      {/* Mobile placeholder: match the single-card overview layout. */}
      <div className="px-4 lg:hidden">
        <Card className="overflow-hidden rounded-3xl bg-card p-5 shadow-xs gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Desktop placeholder */}
      <div className="hidden lg:grid grid-cols-4 gap-3 px-6">
        {[0, 1, 2, 3].map((i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

export function StatsCards({
  stats,
  range,
  onRangeChange,
}: {
  stats: StatCardData[];
  range?: string;
  onRangeChange?: (range: string) => void;
}) {
  const [internalRange, setInternalRange] = useState("This Week");
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedRange = range ?? internalRange;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleRangeChange = (next: string) => {
    setIsLoading(true);
    setInternalRange(next);
    onRangeChange?.(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsLoading(false), 600);
  };

  const hero = stats.find((s) => s.highlight);

  return (
    <>
      <OverviewHeader
        title="Overview"
        value={getRangeLabel(selectedRange)}
        onValueChange={handleRangeChange}
      />

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <>
          {/* Mobile: one payout-style summary card keeps the overview compact. */}
          <div className="px-4 lg:hidden">
            {(() => {
              const featured = hero ?? stats[0];
              const secondary = stats.filter((stat) => stat !== featured);
              const FeaturedIcon = featured ? (featured.icon ?? inferIcon(featured.label)) : null;

              return featured ? (
                <Card className="relative overflow-hidden rounded-3xl border-0 bg-zinc-900 p-5 text-white shadow-lg gap-4">
                  <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border border-white/5" />
                  <div className="relative">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/65">
                      {FeaturedIcon && <FeaturedIcon className="size-3.5" />}
                      <span>{featured.label}</span>
                    </div>
                    <p className="mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums">
                      {featured.value}
                    </p>
                    {featured.footerSubtitle && (
                      <p className="mt-2 text-xs text-white/65">{featured.footerSubtitle}</p>
                    )}
                  </div>

                  {secondary.length > 0 && (
                    <div className="relative divide-y divide-white/10 border-t border-white/10">
                      {secondary.map((stat) => {
                        const Icon = stat.icon ?? inferIcon(stat.label);
                        return (
                          <div key={stat.label} className="flex items-center justify-between gap-4 py-3 first:pt-4 last:pb-0">
                            <div className="flex min-w-0 items-center gap-2 text-xs text-white/65">
                              <Icon className="size-3.5 shrink-0" />
                              <span className="truncate">{stat.label}</span>
                            </div>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
                              {stat.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              ) : null;
            })()}
          </div>

          {/* Desktop: 4-column grid */}
          <div className="hidden lg:grid grid-cols-4 gap-3 px-6">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
