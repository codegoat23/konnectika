import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import InquiryDashboard, { type CampaignInquiryRecord } from "./components/InquiryDashboard";

export default async function InquiriesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/403");

  const [inquiries, total, last30Days, industryGroups, creatorRequests] = await Promise.all([
    prisma.campaignInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.campaignInquiry.count(),
    prisma.campaignInquiry.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
    }),
    prisma.campaignInquiry.groupBy({ by: ["industry"] }),
    prisma.campaignInquiry.count({ where: { creatorCount: { not: null } } }),
  ]);

  const records: CampaignInquiryRecord[] = inquiries.map((inquiry) => ({
    ...inquiry,
    createdAt: inquiry.createdAt.toISOString(),
    startDate: inquiry.startDate?.toISOString() ?? null,
  }));

  return (
    <DashboardShell>
      <InquiryDashboard
        inquiries={records}
        total={total}
        summary={{ last30Days, industries: industryGroups.length, creatorRequests }}
      />
    </DashboardShell>
  );
}
