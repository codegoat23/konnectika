// prisma/seed-test.ts
//
// Deterministic, repeatable demo data for the automated marketplace tests.
// Targets the dedicated test database (konnectika_test) ONLY — it refuses to
// run against any other database.
//
//   npm run seed:test
//
// Demo actors:
//   Demo Admin                 admin@test.konnectika.local
//   Demo Brand Alpha           brand-alpha@test.konnectika.local
//   Demo Brand Beta            brand-beta@test.konnectika.local
//   Demo Creator Alpha/Beta/Gamma   creator-*@test.konnectika.local
//
// Campaigns:
//   A "Demo A Pending"        PENDING_REVIEW (awaiting admin approval)
//   B "Summer UGC"            APPROVED, 50,000 / 500,000 budget
//   C "Demo C Rejected"       REJECTED
//   D "Demo D Completed"      COMPLETED
//
// Plus applications / earnings / submissions in each realistic state (PENDING
// earning, APPROVED earning, PAID earning settled through a PAID payout,
// PENDING applications). Settlement runs entirely through scheduled payouts —
// there is no direct-payment / withdrawal flow.

import "dotenv/config";
import type { Prisma } from "@prisma/client";

async function main() {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!process.env.DATABASE_URL?.includes("konnectika_test")) {
    throw new Error(
      "seed:test only runs against the konnectika_test database. " +
        "Set TEST_DATABASE_URL (see .env)."
    );
  }

  const { prisma } = await import("@/lib/prisma");

  // Wipe everything first so re-running is deterministic and repeatable.
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.platformRevenue.deleteMany(),
    prisma.payout.deleteMany(),
    prisma.earning.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.campaignApplication.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.socialAccount.deleteMany(),
    prisma.creatorProfile.deleteMany(),
    prisma.businessProfile.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ------------------------------------------------------------------
  // Actors
  // ------------------------------------------------------------------
  await prisma.user.create({
    data: { email: "admin@test.konnectika.local", role: "ADMIN" },
  });

  const brandAlpha = await prisma.user.create({
    data: {
      email: "brand-alpha@test.konnectika.local",
      role: "BRAND",
      businessProfile: { create: { companyName: "Demo Alpha Co" } },
    },
    include: { businessProfile: true },
  });
  const brandBeta = await prisma.user.create({
    data: {
      email: "brand-beta@test.konnectika.local",
      role: "BRAND",
      businessProfile: { create: { companyName: "Demo Beta Co" } },
    },
    include: { businessProfile: true },
  });

  const creatorAlpha = await prisma.user.create({
    data: {
      email: "creator-alpha@test.konnectika.local",
      role: "CREATOR",
      creatorProfile: {
        create: { username: "creator-alpha", displayName: "Creator Alpha" },
      },
    },
    include: { creatorProfile: true },
  });
  const creatorBeta = await prisma.user.create({
    data: {
      email: "creator-beta@test.konnectika.local",
      role: "CREATOR",
      creatorProfile: {
        create: { username: "creator-beta", displayName: "Creator Beta" },
      },
    },
    include: { creatorProfile: true },
  });
  const creatorGamma = await prisma.user.create({
    data: {
      email: "creator-gamma@test.konnectika.local",
      role: "CREATOR",
      creatorProfile: {
        create: { username: "creator-gamma", displayName: "Creator Gamma" },
      },
    },
    include: { creatorProfile: true },
  });

  const now = new Date();

  // ------------------------------------------------------------------
  // Campaigns
  // ------------------------------------------------------------------
  const campaignBase: Omit<
    Prisma.CampaignUncheckedCreateInput,
    "name" | "paymentRate" | "budgetTotal" | "businessProfileId"
  > = {
    description: "Deterministic demo campaign for the marketplace tests.",
    category: "Lifestyle",
    campaignType: "UGC",
    badge: "new",
    thumbnailColor: "#18181b",
    thumbnailPic: "",
    thumbnailInitials: "DC",
    budgetFunded: 0,
    daysLeft: 30,
    contentFormat: "Video (15s - 60s)",
    duration: "30 days",
    applicationsClose: new Date(now.getTime() + 30 * 86400000),
    isOpenToAll: true,
    isFeatured: false,
    tags: ["Demo"],
    requirements: ["Be authentic"],
    creatorsJoined: 0,
    platforms: ["instagram", "tiktok"],
  };

  const campaignA = await prisma.campaign.create({
    data: {
      ...campaignBase,
      name: "Demo A Pending",
      paymentRate: 50000,
      budgetTotal: 500000,
      paymentStatus: "UNPAID",
      brand: "Demo Alpha Co",
      status: "PENDING_REVIEW",
      businessProfileId: brandAlpha.businessProfile!.id,
    },
  });

  const campaignB = await prisma.campaign.create({
    data: {
      ...campaignBase,
      name: "Summer UGC",
      paymentRate: 50000,
      budgetTotal: 500000,
      paymentStatus: "PAID",
      platformFeeRate: 5,
      platformFee: 25000,
      totalCharge: 525000,
      brand: "Demo Alpha Co",
      status: "APPROVED",
      businessProfileId: brandAlpha.businessProfile!.id,
    },
  });

  await prisma.campaign.create({
    data: {
      ...campaignBase,
      name: "Demo C Rejected",
      paymentRate: 40000,
      budgetTotal: 400000,
      paymentStatus: "UNPAID",
      brand: "Demo Beta Co",
      status: "REJECTED",
      businessProfileId: brandBeta.businessProfile!.id,
    },
  });

  const campaignD = await prisma.campaign.create({
    data: {
      ...campaignBase,
      name: "Demo D Completed",
      paymentRate: 100000,
      budgetTotal: 1000000,
      paymentStatus: "PAID",
      platformFeeRate: 5,
      platformFee: 50000,
      totalCharge: 1050000,
      brand: "Demo Alpha Co",
      status: "COMPLETED",
      businessProfileId: brandAlpha.businessProfile!.id,
    },
  });

  // Platform revenue for the brand fees (campaign approval = funds received).
  await prisma.platformRevenue.createMany({
    data: [
      {
        campaignId: campaignB.id,
        businessId: brandAlpha.businessProfile!.id,
        type: "BRAND_FEE",
        status: "PAID",
        feeRate: 5,
        grossAmount: 500000,
        feeAmount: 25000,
      },
      {
        campaignId: campaignD.id,
        businessId: brandAlpha.businessProfile!.id,
        type: "BRAND_FEE",
        status: "PAID",
        feeRate: 5,
        grossAmount: 1000000,
        feeAmount: 50000,
      },
    ],
  });

  // ------------------------------------------------------------------
  // Applications, earnings, submissions, payments
  // ------------------------------------------------------------------
  const appAlphaB = await prisma.campaignApplication.create({
    data: {
      creatorId: creatorAlpha.creatorProfile!.id,
      campaignId: campaignB.id,
      message: "I can create authentic summer content.",
      status: "APPROVED",
    },
  });

  // Creator Alpha: approved on Summer UGC, earning PENDING (no content yet).
  await prisma.earning.create({
    data: {
      creatorId: creatorAlpha.creatorProfile!.id,
      campaignId: campaignB.id,
      applicationId: appAlphaB.id,
      amount: 50000,
      platformFeeRate: 10,
      platformFee: 5000,
      creatorAmount: 45000,
      status: "PENDING",
      requestedAt: now,
    },
  });

  // Creator Beta: approved, content approved, earning APPROVED (will be paid
  // out once the admin approves the earning per campaign).
  const appBetaB = await prisma.campaignApplication.create({
    data: {
      creatorId: creatorBeta.creatorProfile!.id,
      campaignId: campaignB.id,
      message: "Summer content specialist.",
      status: "APPROVED",
    },
  });
  const subBetaB = await prisma.submission.create({
    data: {
      applicationId: appBetaB.id,
      creatorId: creatorBeta.creatorProfile!.id,
      campaignId: campaignB.id,
      screenshots: ["https://example.com/beta-summer.png"],
      postLinks: ["https://tiktok.com/@creator-beta/summer"],
      caption: "My summer UGC entry.",
      status: "APPROVED",
      reviewNote: "Approved by demo brand.",
      reviewedAt: now,
    },
  });
  const earningBetaB = await prisma.earning.create({
    data: {
      creatorId: creatorBeta.creatorProfile!.id,
      campaignId: campaignB.id,
      applicationId: appBetaB.id,
      submissionId: subBetaB.id,
      amount: 50000,
      platformFeeRate: 10,
      platformFee: 5000,
      creatorAmount: 45000,
      status: "APPROVED",
      requestedAt: now,
      approvedAt: now,
      availableAt: new Date(now.getTime() + 7 * 86400000),
    },
  });
  await prisma.platformRevenue.create({
    data: {
      campaignId: campaignB.id,
      creatorId: creatorBeta.creatorProfile!.id,
      earningId: earningBetaB.id,
      type: "CREATOR_FEE",
      status: "ACCRUED",
      feeRate: 10,
      grossAmount: 50000,
      feeAmount: 5000,
    },
  });

  // Creator Gamma: settled on the completed campaign via a PAID payout.
  const appGammaD = await prisma.campaignApplication.create({
    data: {
      creatorId: creatorGamma.creatorProfile!.id,
      campaignId: campaignD.id,
      message: "Completed campaign work.",
      status: "APPROVED",
    },
  });
  const subGammaD = await prisma.submission.create({
    data: {
      applicationId: appGammaD.id,
      creatorId: creatorGamma.creatorProfile!.id,
      campaignId: campaignD.id,
      screenshots: ["https://example.com/gamma-done.png"],
      postLinks: ["https://instagram.com/@creator-gamma/done"],
      status: "APPROVED",
      reviewedAt: now,
    },
  });
  const earningGammaD = await prisma.earning.create({
    data: {
      creatorId: creatorGamma.creatorProfile!.id,
      campaignId: campaignD.id,
      applicationId: appGammaD.id,
      submissionId: subGammaD.id,
      amount: 100000,
      platformFeeRate: 10,
      platformFee: 10000,
      creatorAmount: 90000,
      status: "PAID",
      requestedAt: now,
      approvedAt: now,
      availableAt: new Date(now.getTime() - 86400000),
      paidAt: now,
    },
  });
  await prisma.payout.create({
    data: {
      creatorId: creatorGamma.creatorProfile!.id,
      amount: 90000,
      status: "PAID",
      paymentReference: "DEMO-PAYOUT-001",
      paymentMethod: "M-PESA",
      paymentPhone: "+255712345678",
      paidAt: now,
      reviewedAt: now,
      earnings: { connect: { id: earningGammaD.id } },
    },
  });
  await prisma.platformRevenue.create({
    data: {
      campaignId: campaignD.id,
      creatorId: creatorGamma.creatorProfile!.id,
      earningId: earningGammaD.id,
      type: "CREATOR_FEE",
      status: "PAID",
      feeRate: 10,
      grossAmount: 100000,
      feeAmount: 10000,
    },
  });

  // Pending applications (awaiting brand decision).
  await prisma.campaignApplication.create({
    data: {
      creatorId: creatorAlpha.creatorProfile!.id,
      campaignId: campaignA.id,
      message: "Interested in the pending campaign.",
      status: "PENDING",
    },
  });
  await prisma.campaignApplication.create({
    data: {
      creatorId: creatorGamma.creatorProfile!.id,
      campaignId: campaignB.id,
      message: "Also applying to Summer UGC.",
      status: "PENDING",
    },
  });

  console.log("✅ Seeded demo marketplace data into", process.env.DATABASE_URL);
  console.log("   Admin:      admin@test.konnectika.local");
  console.log("   Brand Alpha brand-alpha@test.konnectika.local");
  console.log("   Brand Beta  brand-beta@test.konnectika.local");
  console.log("   Creators    creator-{alpha,beta,gamma}@test.konnectika.local");

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error("❌ seed:test failed:", e);
    process.exit(1);
  });
