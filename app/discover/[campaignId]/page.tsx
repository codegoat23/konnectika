import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import Navbar from "@/components/discover/Navbar";
import { CampaignMetrics } from "@/components/discover/CampaignMetrics";
import { CampaignTabs } from "@/components/discover/CampaignTabs";
import { PublicCampaignHeader } from "@/components/discover/PublicCampaignHeader";
import type { CampaignCta } from "@/components/discover/JoinCampaignButton";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getCampaignDetail } from "@/lib/campaign-detail";

interface PageProps {
  params: Promise<{ campaignId: string }>;
}

// Skip the DB lookup for ids that can't be a campaign id. (This page renders
// a graceful not-found state rather than calling framework notFound(), which
// on dynamic routes only renders the not-found UI with a noindex meta.)
const CAMPAIGN_ID_PATTERN = /^[a-zA-Z0-9_-]{20,64}$/;

const NOT_FOUND_METADATA: Metadata = {
  title: "Campaign not found",
  description: "This campaign is unavailable or no longer open to the public.",
  robots: { index: false, follow: false },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { campaignId } = await params;

  if (!CAMPAIGN_ID_PATTERN.test(campaignId)) {
    return NOT_FOUND_METADATA;
  }

  const campaign = await getCampaignDetail(campaignId);

  if (!campaign) {
    return NOT_FOUND_METADATA;
  }

  const title = `${campaign.title} | Konnectika`;

  return {
    title,
    description: campaign.description,
    alternates: { canonical: `/discover/${campaign.id}` },
    openGraph: {
      title,
      description: campaign.description,
      url: `/discover/${campaign.id}`,
      type: "website",
      siteName: "Konnectika",
      images: [{ url: campaign.thumbnailPic, alt: campaign.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: campaign.description,
      images: [campaign.thumbnailPic],
    },
  };
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { campaignId } = await params;

  const campaign = CAMPAIGN_ID_PATTERN.test(campaignId)
    ? await getCampaignDetail(campaignId)
    : null;

  if (!campaign) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <BackLink />
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-6xl font-bold text-foreground">404</p>
            <h1 className="mt-4 text-2xl font-semibold text-foreground">
              Campaign not found
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              This campaign doesn&apos;t exist or isn&apos;t publicly
              available.
            </p>
            <div className="mt-6">
              <Button asChild size="lg">
                <Link href="/discover">
                  Explore Campaigns
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 🔐 Auth-aware Join Campaign state
  const user = await getAuthUser();

  let cta: CampaignCta;
  if (campaign.isClosed) {
    cta = { type: "closed" };
  } else if (!user) {
    cta = {
      type: "login",
      href: `/login?redirectTo=/discover/${campaign.id}`,
    };
  } else if (user.role !== "CREATOR") {
    cta = { type: "brand" };
  } else {
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });
    const application = creator
      ? await prisma.campaignApplication.findUnique({
          where: {
            creatorId_campaignId: {
              creatorId: creator.id,
              campaignId: campaign.id,
            },
          },
          select: { id: true },
        })
      : null;
    cta = application
      ? { type: "applied" }
      : { type: "join", href: `/campaign/${campaign.id}/apply` };
  }

  return (
    <main className="min-h-screen bg-background">
      

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <BackLink />

        <div className="mt-6">
          <PublicCampaignHeader campaign={campaign} cta={cta} />
        </div>

        <div className="mt-10">
          <CampaignMetrics campaign={campaign} />
        </div>

        <div className="mt-10">
          <CampaignTabs campaign={campaign} />
        </div>
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/discover"
      className="inline-flex items-center gap-2 border border-zinc-500/30 p-3 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back
    </Link>
  );
}
