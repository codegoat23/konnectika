import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import {
  getJoinedCampaigns,
  getCreatedCampaigns,
  getAllCampaigns,
} from "@/lib/campaigns";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import JoinedCampaigns from "./components/JoinedCampaigns";
import CreatedCampaigns from "./components/CreatedCampaigns";
import AllCampaigns from "./components/AllCampaigns";

// /dashboard/campaign
//   CREATOR -> campaigns they've joined
//   BRAND   -> campaigns they've created
//   ADMIN   -> every campaign, all brands

export default async function CampaignDashboardPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  switch (user.role) {
    case "CREATOR": {
      const campaigns = await getJoinedCampaigns(user.userId);
      return (
        <DashboardShell>
          <JoinedCampaigns campaigns={campaigns} />
        </DashboardShell>
      );
    }
    case "BRAND": {
      const campaigns = await getCreatedCampaigns(user.userId);
      return (
        <DashboardShell>
          <CreatedCampaigns campaigns={campaigns} />
        </DashboardShell>
      );
    }
    case "ADMIN": {
      const campaigns = await getAllCampaigns();
      return (
        <DashboardShell>
          <AllCampaigns campaigns={campaigns} />
        </DashboardShell>
      );
    }
    default: {
      const _exhaustive: string = user.role;
      throw new Error(`Unhandled role: ${_exhaustive}`);
    }
  }
}
