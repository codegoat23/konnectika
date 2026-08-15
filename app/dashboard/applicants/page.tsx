// app/dashboard/applicants/page.tsx
//
// Global Applicants page, one URL for both roles:
//   - ADMIN: every campaign's applications, with earning status and the
//     "Make Available" action (APPROVED -> AVAILABLE).
//   - BRAND: applications on their own campaigns, with approve/reject and
//     submission-review actions.
//   - CREATOR: no applicants view -> redirected to the dashboard.

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/getSessionUser";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import AdminApplicants from "./components/AdminApplicants";
import BrandApplicants from "./components/BrandApplicants";
import { applicantsInclude } from "./components/types";

const LIMIT = 25;

export default async function ApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const skip = (page - 1) * LIMIT;
  const query = (q ?? "").trim();

  const brandScope: Prisma.CampaignApplicationWhereInput[] =
    user.role === "BRAND"
      ? [{ campaign: { businessProfile: { userId: user.id } } }]
      : [];

  const queryFilter: Prisma.CampaignApplicationWhereInput[] = query
    ? [
        {
          OR: [
            {
              campaign: { name: { contains: query, mode: "insensitive" } },
            },
            {
              creator: {
                username: { contains: query, mode: "insensitive" },
              },
            },
            {
              creator: {
                displayName: { contains: query, mode: "insensitive" },
              },
            },
          ],
        },
      ]
    : [];

  const where: Prisma.CampaignApplicationWhereInput = {
    AND: [...brandScope, ...queryFilter],
  };

  const [applications, totalApplications] = await Promise.all([
    prisma.campaignApplication.findMany({
      where,
      include: applicantsInclude,
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      skip,
    }),
    prisma.campaignApplication.count({ where }),
  ]);

  const props = {
    applications,
    page,
    totalPages: Math.max(1, Math.ceil(totalApplications / LIMIT)),
    start: (page - 1) * LIMIT + 1,
  };

  if (user.role === "ADMIN") {
    return (
      <DashboardShell>
        <AdminApplicants {...props} />
      </DashboardShell>
    );
  }

  if (user.role === "BRAND") {
    return (
      <DashboardShell>
        <BrandApplicants {...props} />
      </DashboardShell>
    );
  }

  redirect("/dashboard");
}
