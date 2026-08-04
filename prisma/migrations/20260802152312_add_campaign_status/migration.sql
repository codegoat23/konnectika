-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PENDING_REVIEW', 'FUNDED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "status" "CampaignStatus" NOT NULL DEFAULT 'PENDING_REVIEW';

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
