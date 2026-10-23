"use client"
import { useMemo, useState } from "react";
import { CreatedCampaign } from "@/lib/campaigns";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import { StatsCards, StatCardData } from "@/app/dashboard/components/StatsCards";
import CreatedCampaigns from "@/app/dashboard/campaigns/components/CreatedCampaigns";
import { formatTZS } from "@/lib/utils";
import SocialFolderGrid from "@/components/social/SocialFolder";
import { getRangeBounds } from "../components/Overviewheader";

type DashboardProps = {
  campaigns: CreatedCampaign[];
}

function BrandDashboard({ campaigns }: DashboardProps) {
  const [range, setRange] = useState("This Week");

  const stats = useMemo<StatCardData[]>(() => {
    const { start, end } = getRangeBounds(range);
    const inRange = campaigns.filter(
      (c) => c.createdAt >= start && c.createdAt <= end
    );

    const totalBudget = inRange.reduce((sum, c) => sum + c.budgetTotal, 0);
    const totalFunded = inRange.reduce((sum, c) => sum + c.budgetFunded, 0);
    const totalApplications = inRange.reduce(
      (sum, c) => sum + c._count.applications,
      0
    );
    const activeCount = inRange.filter(
      (c) => c.badge === "active" || c.badge === "hot"
    ).length;

    return [
      {
        label: "Budget Funded",
        value: `TZS ${formatTZS(totalFunded)}`,
        footerSubtitle: ``,
        highlight: true,
      },
      {
        label: "Campaigns Created",
        value: inRange.length,
        footerTitle: "",
      },
      {
        label: "Active Campaigns",
        value: activeCount,
        trend: "up",
      },
      {
        label: "Total Applications",
        value: totalApplications,
        footerSubtitle: "",
      },
    ];
  }, [campaigns, range]);

  return (
    <DashboardShell>
      <StatsCards stats={stats} range={range} onRangeChange={setRange} />
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <CreatedCampaigns campaigns={campaigns} limit={3} />
        </div>
        <div className="w-full shrink-0 px-4 lg:w-[280px] lg:px-0">
          <SocialFolderGrid />
        </div>
      </div>
    </DashboardShell>
  );
}

export default BrandDashboard;