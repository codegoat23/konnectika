import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const SEARCH_LIMIT = 6;

export type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
};

export type SearchGroup = {
  type: "campaigns" | "creators" | "brands" | "applications";
  label: string;
  items: SearchItem[];
};

// GET /api/search?q=…
// Role-aware global search for the dashboard. Every group is scoped to what
// the authenticated user is allowed to see:
//   campaigns    ADMIN all · BRAND own + approved · CREATOR approved
//   creators     ADMIN all · BRAND creators who applied to their campaigns
//   brands       ADMIN all
//   applications ADMIN all · BRAND on their campaigns · CREATOR their own
export async function GET(req: Request) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ groups: [] });
  }

  const role = user.role;
  const search = { contains: q, mode: "insensitive" as const };

  const campaignRoleFilter: Prisma.CampaignWhereInput[] =
    role === "BRAND"
      ? [
          {
            OR: [
              { businessProfile: { userId: user.userId } },
              { status: "APPROVED" },
            ],
          },
        ]
      : role === "CREATOR"
        ? [{ status: "APPROVED" }]
        : [];

  const campaignWhere: Prisma.CampaignWhereInput = {
    AND: [
      ...campaignRoleFilter,
      { OR: [{ name: search }, { brand: search }, { category: search }] },
    ],
  };

  const creatorWhere: Prisma.CreatorProfileWhereInput = {
    AND: [
      ...(role === "BRAND"
        ? [
            {
              applications: {
                some: {
                  campaign: { businessProfile: { userId: user.userId } },
                },
              },
            },
          ]
        : []),
      { OR: [{ username: search }, { displayName: search }] },
    ],
  };

  const applicationWhere: Prisma.CampaignApplicationWhereInput = {
    AND: [
      ...(role === "BRAND"
        ? [{ campaign: { businessProfile: { userId: user.userId } } }]
        : role === "CREATOR"
          ? [{ creator: { userId: user.userId } }]
          : []),
      {
        OR: [
          { campaign: { name: search } },
          { creator: { username: search } },
        ],
      },
    ],
  };

  const [campaigns, creators, brands, applications] = await Promise.all([
    prisma.campaign.findMany({
      where: campaignWhere,
      select: {
        id: true,
        name: true,
        category: true,
        brand: true,
        businessProfile: { select: { companyName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: SEARCH_LIMIT,
    }),

    role === "CREATOR"
      ? Promise.resolve([])
      : prisma.creatorProfile.findMany({
          where: creatorWhere,
          select: { id: true, username: true, displayName: true },
          orderBy: { createdAt: "desc" },
          take: SEARCH_LIMIT,
        }),

    role === "ADMIN"
      ? prisma.businessProfile.findMany({
          where: {
            AND: [{ OR: [{ companyName: search }, { industry: search }] }],
          },
          select: { id: true, companyName: true, industry: true },
          orderBy: { createdAt: "desc" },
          take: SEARCH_LIMIT,
        })
      : Promise.resolve([]),

    prisma.campaignApplication.findMany({
      where: applicationWhere,
      select: {
        id: true,
        status: true,
        campaign: { select: { id: true, name: true } },
        creator: { select: { username: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: SEARCH_LIMIT,
    }),
  ]);

  const groups: SearchGroup[] = [];

  if (campaigns.length > 0) {
    groups.push({
      type: "campaigns",
      label: "Campaigns",
      items: campaigns.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: [
          c.brand ?? c.businessProfile.companyName ?? "",
          c.category,
        ]
          .filter(Boolean)
          .join(" · "),
        url: `/dashboard/campaigns/${c.id}`,
      })),
    });
  }

  if (creators.length > 0) {
    groups.push({
      type: "creators",
      label: "Creators",
      items: creators.map((c) => ({
        id: c.id,
        title: c.displayName || c.username || "Creator",
        subtitle: c.username ? `@${c.username}` : "",
        url: `/dashboard/applicants?q=${encodeURIComponent(
          c.username ?? c.displayName ?? ""
        )}`,
      })),
    });
  }

  if (brands.length > 0) {
    groups.push({
      type: "brands",
      label: "Brands",
      items: brands.map((b) => ({
        id: b.id,
        title: b.companyName ?? "Brand",
        subtitle: b.industry ?? "",
        url: "/dashboard/campaigns",
      })),
    });
  }

  if (applications.length > 0) {
    groups.push({
      type: "applications",
      label: "Applications",
      items: applications.map((a) => ({
        id: a.id,
        title: a.campaign.name,
        subtitle: `${
          a.creator.displayName || a.creator.username || "Creator"
        } · ${a.status.toLowerCase()}`,
        url: "/dashboard/applicants",
      })),
    });
  }

  return NextResponse.json({ groups });
}
