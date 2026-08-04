import { getAllCampaigns } from "@/lib/campaigns";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import { StatsCards, StatCardData } from "@/app/dashboard/components/StatsCards";
import AllCampaigns from "@/app/dashboard/campaigns/components/AllCampaigns";
import { formatTZS } from "@/lib/utils";

async function AdminDashboard() {
  const campaigns = await getAllCampaigns();

  const totalApplications = campaigns.reduce(
    (sum, c) => sum + c._count.applications,
    0
  );
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budgetTotal, 0);
  const uniqueBrands = new Set(
    campaigns.map((c) => c.businessProfile.companyName)
  ).size;

  const stats: StatCardData[] = [
    {
      label: "Total Budget Allocated",
      value: `TZS ${formatTZS(totalBudget)}`,
      highlight:true
      
    },
    {
      label: "Total Campaigns",
      value: campaigns.length,
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

  return (
    <DashboardShell>
      <StatsCards stats={stats} />
      <AllCampaigns campaigns={campaigns} />
    </DashboardShell>
  );
}

export default AdminDashboard;
