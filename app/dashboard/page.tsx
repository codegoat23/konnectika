import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

import CreatorDashboard from "./creator/creator-dashboard";
import BrandDashboard from "./brand/brand-dashboard";
import AdminDashboard from "./admin/admin-dashboard";
import { getAllCampaigns, getApprovedCampaigns, getCreatedCampaigns } from "@/lib/campaigns";
import { getCreatorEarnings } from "@/lib/earnings";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  switch (user.role) {
   case "CREATOR": {
  const activeCampaigns = await getApprovedCampaigns(user.userId);

  const creator = await prisma.creatorProfile.findUnique({
  where: {
    userId: user.userId,
  },
});

if (!creator) {
  throw new Error("Creator profile not found");
}

const earnings = await getCreatorEarnings(creator.id);
  console.log(earnings)

  return (
    <CreatorDashboard
      campaigns={activeCampaigns}
      earnings={earnings}
    />
  );
}
    

    case "BRAND":
      const campaigns = user ? await getCreatedCampaigns(user.userId) : [];
      return <BrandDashboard campaigns={campaigns} />;

    case "ADMIN": {
      const allCampaigns = await getAllCampaigns();
      return <AdminDashboard campaigns={allCampaigns} />;
    }

    default:
      return <div className="p-6 text-foreground">Invalid role</div>;
  }
}
