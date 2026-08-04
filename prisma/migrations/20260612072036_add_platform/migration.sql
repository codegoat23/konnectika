/*
  Warnings:

  - Changed the type of `campaignType` on the `Campaign` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `badge` on the `Campaign` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('ACTIVE', 'HOT', 'NEW', 'FEATURED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'YOUTUBE', 'X');

-- CreateEnum
CREATE TYPE "CampaignTypeEnum" AS ENUM ('UGC', 'SPONSORED', 'AFFILIATE', 'AMBASSADOR');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "platforms" "Platform"[],
DROP COLUMN "campaignType",
ADD COLUMN     "campaignType" "CampaignTypeEnum" NOT NULL,
DROP COLUMN "badge",
ADD COLUMN     "badge" "BadgeType" NOT NULL;
