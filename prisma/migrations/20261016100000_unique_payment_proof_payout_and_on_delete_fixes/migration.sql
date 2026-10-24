-- DropForeignKey
ALTER TABLE "Earning" DROP CONSTRAINT "Earning_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "Earning" DROP CONSTRAINT "Earning_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentProof" DROP CONSTRAINT "PaymentProof_payoutId_fkey";

-- DropForeignKey
ALTER TABLE "PlatformRevenue" DROP CONSTRAINT "PlatformRevenue_businessId_fkey";

-- DropForeignKey
ALTER TABLE "PlatformRevenue" DROP CONSTRAINT "PlatformRevenue_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "PlatformRevenue" DROP CONSTRAINT "PlatformRevenue_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "PlatformRevenue" DROP CONSTRAINT "PlatformRevenue_earningId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProof_payoutId_key" ON "PaymentProof"("payoutId");

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_earningId_fkey" FOREIGN KEY ("earningId") REFERENCES "Earning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
