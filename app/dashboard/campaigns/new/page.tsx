import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";

import CampaignForm from "./components/create-campaign-form";

export default async function NewCampaignPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "BRAND") {
    redirect("/dashboard/campaigns");
  }

  return (
    <DashboardShell>
      <CampaignForm mode="create" />
    </DashboardShell>
  );
}
