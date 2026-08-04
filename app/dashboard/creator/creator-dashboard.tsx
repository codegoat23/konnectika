"use client"

import React from "react";
import { useEffect, useState } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { StatsCards } from "../components/StatsCards";
import { SectionCards } from "@/app/dashboard/creator/overview-stats";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import ActiveCampaigns from "./activeCampaigns";
import { StatCardData } from "../components/StatsCards";
import { ApprovedCampaigns, getApprovedCampaigns } from "@/lib/campaigns";
import { OverviewHeader } from "../components/Overviewheader";
import { RevenueAnalyticsChart } from "../components/revenueAnaltyicsChart";


type DashboardProps = {
  campaigns: ApprovedCampaigns[];
  earnings: {
    totalEarnings: number;
    pendingEarnings: number;
  };
};
function CreatorDashboard({campaigns,earnings}:DashboardProps) {
  const statCardsData: StatCardData[] = [
  {
  label: "Total Earnings",
  value: `TZS ${earnings.totalEarnings.toLocaleString()}`,
  
  trend: "up",
  footerTitle: "All-time revenue",
  highlight: true,
  footerSubtitle: "Across all campaigns",
},
  {
    label: "Pending Earnings",
    value: `TZS  ${earnings.pendingEarnings.toLocaleString()}`,
    trend: "up",
    footerTitle: "Awaiting payout",
    footerSubtitle: "Processing by platform",
    accent: "orange",
    sparkline:[4, 10, 5, 8, 6, 9, 7, 4, 4, 10]
   
  },
  {
    label: "Active Campaigns",
    value: campaigns.length,
    trend: "down",
    footerTitle: "Currently running",
    footerSubtitle: "Live campaigns",
    accent: "orange",
  },
  {
    label: "submissions",
    value: 24,
    trend: "down",
    footerTitle: "Finished campaigns",
    footerSubtitle: "Lifetime completed work",
  },
];
 


  
  return (
    <DashboardShell>
   
      <StatsCards stats={statCardsData}/>
      <ActiveCampaigns active_campaigns={campaigns}/>
      <div className="px-4 lg:px-6 py-10">
        <RevenueAnalyticsChart />
        
      </div>
    </DashboardShell>
  );
}

export default CreatorDashboard;
