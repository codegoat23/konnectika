import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth"; // adjust path if needed
import { notify, NotifyAdmin } from "@/lib/notification";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { campaignId, message } = await req.json();

    // get creator profile
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: user.userId },
      include: {
        socialAccounts: true,
      },
    });

    if (!creatorProfile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // prevent duplicate application
    const existing = await prisma.campaignApplication.findUnique({
      where: {
        creatorId_campaignId: {
          creatorId: creatorProfile.id,
          campaignId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already applied" },
        { status: 400 }
      );
    }

    // snapshot followers
    const instagram = creatorProfile.socialAccounts.find(
      (s) => s.platform === "INSTAGRAM"
    );

    const tiktok = creatorProfile.socialAccounts.find(
      (s) => s.platform === "TIKTOK"
    );

    const youtube = creatorProfile.socialAccounts.find(
      (s) => s.platform === "YOUTUBE"
    );

   const campaign = await prisma.campaign.findUnique({
  where: {
    id: campaignId,
  },
  select: {
    name: true,
    status: true,
    applicationsClose: true,
    businessProfile:{
      select: {
        userId: true,
      }
    }
  },
});

if (!campaign) {
  return NextResponse.json(
    { error: "Campaign not found" },
    { status: 404 }
  );
}

// Eligibility checks
if (campaign.status !== "APPROVED") {
  return NextResponse.json(
    { error: "This campaign is not open for applications." },
    { status: 400 }
  );
}

if (campaign.applicationsClose && campaign.applicationsClose < new Date()) {

  return NextResponse.json(
    { error: "Applications for this campaign have closed." },
    { status: 400 }
  );
}


const application = await prisma.campaignApplication.create({
  data: {
    creatorId: creatorProfile.id,
    campaignId,
    message,

    instagramFollowers: instagram?.followers,
    tiktokFollowers: tiktok?.followers,
    youtubeFollowers: youtube?.followers,
  },
});

//Notification for new submission
await notify({
  userId: creatorProfile.userId,
  title: "Campaign Application Submitted",
  message: `Your application for "${campaign.name}" has been submitted.`,
  type: "SUCCESS",
});
await NotifyAdmin({
  title: "New Campaign  Submission",
  message: `Application for "${campaign.name}" has been submitted from "${creatorProfile.username}".`,
  type: "INFO",
});

//notification for new Application
await notify({
  userId: campaign.businessProfile.userId,// Assuming the campaign has a businessProfileId field
  title: "New Campaign Application",
  message: `You have a new application for your campaign "${campaign.name}".`,
  type: "INFO",
});

await NotifyAdmin({
  title: "New Campaign Application",
  message: `There's new application for  "${campaign.name}" campaign.`,
  type: "INFO",
});

    return NextResponse.json(application); 
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}