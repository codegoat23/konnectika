import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";

import { prisma } from "@/lib/prisma";
import CampaignForm from "../../new/components/create-campaign-form";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "BRAND") {
    redirect("/dashboard/campaigns");
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      businessProfile: { select: { userId: true } },
    },
  });

  if (!campaign) return <div>Not found</div>;

  // Brands may only edit campaigns they own.
  if (campaign.businessProfile.userId !== user.userId) {
    redirect("/dashboard/campaigns");
  }

  return (
    <DashboardShell>
      <CampaignForm mode="edit" initialData={campaign} />
    </DashboardShell>
  );
}
