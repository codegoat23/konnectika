import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🌱 Seeding Konnectika...");

  // =========================
  // 👤 BRAND USERS + PROFILES
  // =========================

  const vodacomtz = await prisma.user.create({
    data: {
      email: "vodacom@konnectika.com",
      role: "BRAND",
      businessProfile: {
        create: {
          companyName: "Vodacom TZ",
          logo: "/brands/vodacom.png",
          website: "https://vodacom.co.tz",
          industry: "Telecom",
          description: "Leading mobile network in Tanzania",
        },
      },
    },
    include: { businessProfile: true },
  });

  const serengetiBeer = await prisma.user.create({
    data: {
      email: "serengeti@konnectika.com",
      role: "BRAND",
      businessProfile: {
        create: {
          companyName: "Serengeti Breweries",
          logo: "/brands/serengeti.png",
          website: "https://serengetibreweries.co.tz",
          industry: "Beverages",
          description: "Iconic Tanzanian beverage company",
        },
      },
    },
    include: { businessProfile: true },
  });

  const kukuPoa = await prisma.user.create({
    data: {
      email: "kuku@konnectika.com",
      role: "BRAND",
      businessProfile: {
        create: {
          companyName: "Kuku Poa",
          logo: "/brands/kukupoa.png",
          industry: "Food",
          description: "Local chicken food brand",
        },
      },
    },
    include: { businessProfile: true },
  });

  const crdb = await prisma.user.create({
    data: {
      email: "crdb@konnectika.com",
      role: "BRAND",
      businessProfile: {
        create: {
          companyName: "CRDB Bank",
          logo: "/brands/crdb.png",
          industry: "Finance",
          description: "Major Tanzanian bank",
        },
      },
    },
    include: { businessProfile: true },
  });

  const selcom = await prisma.user.create({
    data: {
      email: "selcom@konnectika.com",
      role: "BRAND",
      businessProfile: {
        create: {
          companyName: "Selcom Pesa",
          logo: "/brands/selcom.png",
          industry: "Finance",
          description: "Digital payments platform in Tanzania",
        },
      },
    },
    include: { businessProfile: true },
  });

  const yas = await prisma.user.create({
    data: {
      email: "yas@konnectika.com",
      role: "BRAND",
      businessProfile: {
        create: {
          companyName: "Yas Tanzania",
          logo: "/brands/yas.png",
          industry: "Telecom",
          description: "Yas mobile financial services",
        },
      },
    },
    include: { businessProfile: true },
  });

  // =========================
  // 🚀 CAMPAIGNS
  // =========================

  await prisma.campaign.createMany({
    data: [
      {
        name: "Vodacom Bundle Challenge",
        description:
          "We're looking for creators to showcase how Vodacom bundles keep them connected, entertained, and powered up every day.",
        category: "Lifestyle",
        campaignType: "UGC",
        badge: "featured",

        thumbnailColor: "#cc0000",
        thumbnailPic: "/thumbnails/vodacom.webp",
        thumbnailInitials: "VT",

        paymentRate: 500000,
        budgetFunded: 800000000,
        budgetTotal: 1000000000,

        daysLeft: 2,
        contentFormat: "Video (15s - 60s)",
        duration: "May 20, 2024 – June 20, 2024",

        applicationsClose: new Date("2026-06-15"),

        isOpenToAll: true,
        isFeatured: true,

        tags: ["Lifestyle", "UGC"],
        requirements: [
          "Create engaging short-form content",
          "Show how you use Vodacom bundles",
          "Tag @vodacomtanzania",
          "Be creative and authentic",
        ],
        creatorsJoined: 340,
        brand: "Vodacom TZ",

        businessProfileId: vodacomtz.businessProfile!.id,
        platforms: ["instagram", "tiktok", "facebook", "youtube"],
      },

      {
        name: "Serengeti Moments",
        description:
          "Share your boldest adventures with Serengeti and show what #SerengetiMoments mean to you.",
        category: "Travel",
        campaignType: "UGC",
        badge: "active",

        thumbnailColor: "#c8860a",
        thumbnailPic: "/thumbnails/serengeti.jpeg",
        thumbnailInitials: "SR",

        paymentRate: 350000,
        budgetFunded: 300000000,
        budgetTotal: 500000000,

        daysLeft: 5,
        contentFormat: "Video + Photo",
        duration: "June 1 – June 30, 2024",

        applicationsClose: new Date("2026-06-20"),

        isOpenToAll: false,
        isFeatured: false,

        tags: ["Travel", "Lifestyle"],
        requirements: [
          "18+ creators only",
          "Travel or lifestyle niche required",
          "Instagram Reels or TikTok format",
          "Show product clearly in content",
        ],
        creatorsJoined: 180,
        brand: "Serengeti Breweries",

        businessProfileId: serengetiBeer.businessProfile!.id,
        platforms: ["instagram", "facebook"],
      },

      {
        name: "Kuku Poa Foodies",
        description:
          "Show your love for great food with Kuku Poa. Create mouth-watering content that gets people hungry!",
        category: "Food",
        campaignType: "UGC",
        badge: "hot",

        thumbnailColor: "#cc0000",
        thumbnailPic: "/thumbnails/kukupoa.png",
        thumbnailInitials: "KP",

        paymentRate: 500000,
        budgetFunded: 500000000,
        budgetTotal: 600000000,

        daysLeft: 3,
        contentFormat: "Video",
        duration: "May 25 – June 25, 2024",

        applicationsClose: new Date("2026-06-12"),

        isOpenToAll: true,
        isFeatured: false,

        tags: ["Food", "UGC"],
        requirements: [
          "Food niche preferred",
          "Show product with honest review",
          "Minimum 2,000 followers",
        ],
        creatorsJoined: 203,
        brand: "Kuku Poa",

        businessProfileId: kukuPoa.businessProfile!.id,
        platforms: ["instagram", "tiktok", "facebook"],
      },

      {
        name: "CRDB Save Smart",
        description:
          "Educate your audience on smart saving habits with CRDB Bank.",
        category: "Finance",
        campaignType: "Ambassador",
        badge: "active",

        thumbnailColor: "#007a3d",
        thumbnailPic: "/thumbnails/crdb.jpg",
        thumbnailInitials: "CB",

        paymentRate: 800000,
        budgetFunded: 300000000,
        budgetTotal: 500000000,

        daysLeft: 10,
        contentFormat: "Video + Static Post",
        duration: "June 10 – July 10, 2024",

        applicationsClose: new Date("2026-06-25"),

        isOpenToAll: false,
        isFeatured: false,

        tags: ["Finance", "Education"],
        requirements: [
          "Finance or education niche",
          "Professional tone required",
          "No misleading claims",
        ],
        creatorsJoined: 45,
        brand: "CRDB Bank",

        businessProfileId: crdb.businessProfile!.id,
        platforms: ["youtube", "facebook"],
      },

      {
        name: "Selcom Send Money",
        description:
          "Showcase how easy it is to send money with Selcom Pesa.",
        category: "Finance",
        campaignType: "UGC",
        badge: "active",

        thumbnailColor: "#cc0000",
        thumbnailPic: "/thumbnails/selcom.png",
        thumbnailInitials: "SP",

        paymentRate: 550000,
        budgetFunded: 800000000,
        budgetTotal: 1000000000,

        daysLeft: 4,
        contentFormat: "Video (15s - 60s)",
        duration: "June 1 – June 30, 2024",

        applicationsClose: new Date("2026-06-18"),

        isOpenToAll: true,
        isFeatured: false,

        tags: ["Finance", "Lifestyle"],
        requirements: [
          "Any niche accepted",
          "Demo-style content preferred",
          "Authentic experience required",
        ],
        creatorsJoined: 167,
        brand: "Selcom Pesa",

        businessProfileId: selcom.businessProfile!.id,
        platforms: ["instagram", "tiktok", "youtube"],
      },

      {
        name: "Mix by Yass",
        description:
          "Showcase how easy it is to send money with Mix by Yass.",
        category: "Finance",
        campaignType: "UGC",
        badge: "active",

        thumbnailColor: "#cc0000",
        thumbnailPic: "/thumbnails/yas.jpg",
        thumbnailInitials: "YX",

        paymentRate: 550000,
        budgetFunded: 8000000,
        budgetTotal: 10000000,

        daysLeft: 4,
        contentFormat: "Video (15s - 60s)",
        duration: "June 1 – June 30, 2024",

        applicationsClose: new Date("2026-06-18"),

        isOpenToAll: true,
        isFeatured: false,

        tags: ["Finance", "Lifestyle"],
        requirements: [
          "Any niche accepted",
          "Demo-style content preferred",
          "Authentic experience required",
        ],
        creatorsJoined: 167,
        brand: "Yas Tanzania",

        businessProfileId: yas.businessProfile!.id,
        platforms: ["instagram", "tiktok", "youtube"],
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
}

// =========================
// 🚀 RUNNER
// =========================

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });