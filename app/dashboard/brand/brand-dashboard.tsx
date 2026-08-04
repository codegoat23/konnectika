"use client"
import { CreatedCampaign } from "@/lib/campaigns";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import { StatsCards, StatCardData } from "@/app/dashboard/components/StatsCards";
import CreatedCampaigns from "@/app/dashboard/campaigns/components/CreatedCampaigns";
import { formatTZS } from "@/lib/utils";
import SocialFolderGrid from "@/components/social/SocialFolder";

type DashboardProps ={ 
  campaigns: CreatedCampaign[];
}

function BrandDashboard({campaigns}:DashboardProps) {
 
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budgetTotal, 0);
  const totalFunded = campaigns.reduce((sum, c) => sum + c.budgetFunded, 0);
  const totalApplications = campaigns.reduce(
    (sum, c) => sum + c._count.applications,
    0
  );
  const activeCount = campaigns.filter(
    (c) => c.badge === "active" || c.badge === "hot"
  ).length;

  const stats: StatCardData[] = [
      {
      label: "Budget Funded",
      value: `TZS ${formatTZS(totalFunded)}`,
      footerSubtitle: `of $${totalBudget} total budgeted`,
      highlight:true
      
    },
    {
      label: "Campaigns Created",
      value: campaigns.length,
      footerTitle: "Total campaigns launched",
    },
  
    {
      label: "Active Campaigns",
      value: activeCount,
      trend: "up",
    },
    {
      label: "Total Applications",
      value: totalApplications,
      footerSubtitle: "Across all campaigns",
    },
  ];

  return (
    <DashboardShell>
      <StatsCards stats={stats} />
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
