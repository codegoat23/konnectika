import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

// The sitemap includes approved public campaign pages. Resolve it at request
// time so the build does not depend on database availability and new campaigns
// become discoverable without waiting for a redeploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const campaigns = await prisma.campaign
    .findMany({
      where: { status: "APPROVED" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    })
    .catch((error) => {
      console.error("[sitemap] Could not load public campaigns:", error);
      return [];
    });

  return [
    {
      url: siteUrl,
      images: [`${siteUrl}/assets/link-banner.webp`],
    },
    { url: `${siteUrl}/discover` },
    { url: `${siteUrl}/launch-campaign` },
    ...campaigns.map(({ id, updatedAt }) => ({
      url: `${siteUrl}/discover/${id}`,
      lastModified: updatedAt,
    })),
  ];
}
