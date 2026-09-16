"use client"

import React from "react";
import { useMemo, useState } from "react";
import { StatsCards } from "../components/StatsCards";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import ActiveCampaigns from "./activeCampaigns";
import { StatCardData } from "../components/StatsCards";
import { ApprovedCampaigns } from "@/lib/campaigns";
import { CreatorEarnings } from "@/lib/earnings";
import { getRangeBounds } from "../components/Overviewheader";
import { RevenueAnalyticsChart } from "../components/revenueAnaltyicsChart";

type DashboardProps = {
  campaigns: ApprovedCampaigns[];
  earnings: CreatorEarnings;
};

function CreatorDashboard({ campaigns, earnings }: DashboardProps) {
  const [range, setRange] = useState("This Week");

  const statCardsData = useMemo<StatCardData[]>(() => {
    const { start, end } = getRangeBounds(range);
    const inRangeCampaigns = campaigns.filter(
      (c) => c.appliedAt && c.appliedAt >= start && c.appliedAt <= end
    );
    const inRangeEarnings = earnings.items.filter(
      (e) => new Date(e.createdAt) >= start && new Date(e.createdAt) <= end
    );
    const total = inRangeEarnings.reduce((sum, e) => sum + e.creatorAmount, 0);
    const pending = inRangeEarnings
      .filter((e) => e.status === "PENDING")
      .reduce((sum, e) => sum + e.creatorAmount, 0);

    return [
      {
        label: "Total Earnings",
        value: `TZS ${total.toLocaleString()}`,
        trend: "up",
        footerTitle: "All-time revenue",
        highlight: true,
        footerSubtitle: "Across all campaigns",
      },
      {
        label: "Pending Earnings",
        value: `TZS ${pending.toLocaleString()}`,
        trend: "up",
        footerTitle: "Awaiting payout",
        footerSubtitle: "Processing by platform",
        accent: "orange",
        sparkline: [4, 10, 5, 8, 6, 9, 7, 4, 4, 10],
      },
      {
        label: "Active Campaigns",
        value: inRangeCampaigns.length,
        trend: "down",
        footerTitle: "Currently running",
        footerSubtitle: "Live campaigns",
        accent: "orange",
      },
      {
        label: "Submissions",
        value: 24,
        trend: "down",
        footerTitle: "Finished campaigns",
        footerSubtitle: "Lifetime completed work",
      },
    ];
  }, [campaigns, earnings, range]);

  return (
    <DashboardShell>
      <StatsCards stats={statCardsData} range={range} onRangeChange={setRange} />
      <ActiveCampaigns active_campaigns={campaigns} />
      <div className="px-4 lg:px-6 py-10">
        <RevenueAnalyticsChart />
      </div>
    </DashboardShell>
  );
}

export default CreatorDashboard;