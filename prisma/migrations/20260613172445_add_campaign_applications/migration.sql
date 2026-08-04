-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CampaignApplication" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "instagramFollowers" INTEGER,
    "tiktokFollowers" INTEGER,
    "youtubeFollowers" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignApplication_creatorId_idx" ON "CampaignApplication"("creatorId");

-- CreateIndex
CREATE INDEX "CampaignApplication_campaignId_idx" ON "CampaignApplication"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignApplication_creatorId_campaignId_key" ON "CampaignApplication"("creatorId", "campaignId");

-- AddForeignKey
ALTER TABLE "CampaignApplication" ADD CONSTRAINT "CampaignApplication_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignApplication" ADD CONSTRAINT "CampaignApplication_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
