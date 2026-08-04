/*
  Warnings:

  - The values [ACTIVE,HOT,NEW,FEATURED] on the enum `BadgeType` will be removed. If these variants are still used in the database, this will fail.
  - The values [SPONSORED,AFFILIATE,AMBASSADOR] on the enum `CampaignTypeEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BadgeType_new" AS ENUM ('active', 'hot', 'new', 'featured');
ALTER TABLE "Campaign" ALTER COLUMN "badge" TYPE "BadgeType_new" USING ("badge"::text::"BadgeType_new");
ALTER TYPE "BadgeType" RENAME TO "BadgeType_old";
ALTER TYPE "BadgeType_new" RENAME TO "BadgeType";
DROP TYPE "public"."BadgeType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CampaignTypeEnum_new" AS ENUM ('UGC', 'Sponsored', 'Affiliate', 'Ambassador');
ALTER TABLE "Campaign" ALTER COLUMN "campaignType" TYPE "CampaignTypeEnum_new" USING ("campaignType"::text::"CampaignTypeEnum_new");
ALTER TYPE "CampaignTypeEnum" RENAME TO "CampaignTypeEnum_old";
ALTER TYPE "CampaignTypeEnum_new" RENAME TO "CampaignTypeEnum";
DROP TYPE "public"."CampaignTypeEnum_old";
COMMIT;
