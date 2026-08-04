# 🗄️ Konnectika Database Schema (Prisma)

## 📌 Overview
This database is built using PostgreSQL with Prisma ORM. It powers users, campaigns, applications, payments, and verification flows.

---

## 👤 User Model

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  
}

enum Role {
  CREATOR
  BRAND
  ADMIN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?

  role      Role     @default(CREATOR)
  onboardingStep Int @default(1)
  onboardingDone Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  creatorProfile  CreatorProfile?
  businessProfile BusinessProfile?
}

model CreatorProfile {
  id            String   @id @default(cuid())

  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  username      String?   @unique
  displayName   String?

  phone         String?
  phoneVerified Boolean  @default(false)
 

  socialAccounts SocialAccount[]
 applications  CampaignApplication[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([username])
}

model BusinessProfile {
  id        String   @id @default(cuid())

  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  companyName String?
  logo        String?
  website     String?

  industry    String?
  description String?

  // 🔥 RELATION: business creates campaigns
  campaigns   Campaign[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([companyName])
}
model SocialAccount {
  id        String   @id @default(cuid())

  creatorId String
  creator   CreatorProfile @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  platform  SocialPlatform
  handle    String
  url       String?

  followers Int?     @default(0)
  verified  Boolean  @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([creatorId, platform])
  @@index([platform])
  @@index([creatorId])
}

enum SocialPlatform {
  TWITTER
  INSTAGRAM
  TIKTOK
  YOUTUBE
  FACEBOOK
  LINKEDIN
}

model Campaign {
  id          String   @id @default(cuid())

  name        String
  description String
  category    String

  campaignType CampaignTypeEnum
  badge        BadgeType

  thumbnailColor    String
  thumbnailPic      String
  thumbnailInitials String

  paymentRate   Int
  budgetFunded  Int   @default(0)
  budgetTotal   Int

  daysLeft      Int

  contentFormat String
  duration      String

  applicationsClose DateTime

  isOpenToAll   Boolean @default(true)
  isFeatured    Boolean @default(false)

  // ⭐ NEW FIELDS (from your frontend)
  tags           String[]
  requirements   String[]
  creatorsJoined Int     @default(0)
  brand          String?

  // relations
  businessProfileId String
  businessProfile   BusinessProfile @relation(fields: [businessProfileId], references: [id], onDelete: Cascade)

  platforms Platform[]
  applications CampaignApplication[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([businessProfileId])
}
enum BadgeType {
  active
  hot
  new
  featured
}

enum Platform {
  instagram
  tiktok
  facebook
  youtube
  x
}

enum CampaignTypeEnum {
  UGC
  Sponsored
  Affiliate
  Ambassador
}
model CampaignApplication {
  id          String   @id @default(cuid())

  creatorId   String
  campaignId  String

  message     String?

  status      ApplicationStatus @default(PENDING)

  // optional but VERY useful (snapshot at time of apply)
  instagramFollowers Int?
  tiktokFollowers    Int?
  youtubeFollowers   Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  creator  CreatorProfile @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  campaign Campaign        @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([creatorId, campaignId])
  @@index([creatorId])
  @@index([campaignId])
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
}