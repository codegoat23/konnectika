"use client"

import { useMemo, useState } from "react";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import { StatsCards, StatCardData } from "@/app/dashboard/components/StatsCards";
import AllCampaigns from "@/app/dashboard/campaigns/components/AllCampaigns";
import { formatTZS } from "@/lib/utils";
import { AllCampaign } from "@/lib/campaigns";
import { getRangeBounds } from "../components/Overviewheader";

type AdminDashboardProps = {
  campaigns: AllCampaign[];
};

function AdminDashboard({ campaigns }: AdminDashboardProps) {
  const [range, setRange] = useState("This Week");

  const stats = useMemo<StatCardData[]>(() => {
    const { start, end } = getRangeBounds(range);
    const inRange = campaigns.filter(
      (c) => c.createdAt >= start && c.createdAt <= end
    );

    const totalApplications = inRange.reduce(
      (sum, c) => sum + c._count.applications,
      0
    );
    const totalBudget = inRange.reduce((sum, c) => sum + c.budgetTotal, 0);
    const uniqueBrands = new Set(
      inRange.map((c) => c.businessProfile.companyName)
    ).size;

    return [
      {
        label: "Total Budget Allocated",
        value: `TZS ${formatTZS(totalBudget)}`,
        highlight: true,
      },
      {
        label: "Total Campaigns",
        value: inRange.length,
        footerTitle: "Across the whole platform",
      },
      {
        label: "Total Brands",
        value: uniqueBrands,
      },
      {
        label: "Total Applications",
        value: totalApplications,
        footerSubtitle: "All statuses, all campaigns",
      },
    ];
  }, [campaigns, range]);

  return (
    <DashboardShell>
      <StatsCards stats={stats} range={range} onRangeChange={setRange} />
      <AllCampaigns campaigns={campaigns} />
    </DashboardShell>
  );
}

export default AdminDashboard;