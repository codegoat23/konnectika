-- CreateEnum
CREATE TYPE "PlatformRevenueType" AS ENUM ('CREATOR_FEE', 'BRAND_FEE');

-- CreateEnum
CREATE TYPE "PlatformRevenueStatus" AS ENUM ('ACCRUED', 'PAID');

-- CreateTable
CREATE TABLE "PlatformRevenue" (
    "id" TEXT NOT NULL,
    "type" "PlatformRevenueType" NOT NULL,
    "status" "PlatformRevenueStatus" NOT NULL DEFAULT 'ACCRUED',
    "feeRate" INTEGER NOT NULL,
    "grossAmount" INTEGER NOT NULL,
    "feeAmount" INTEGER NOT NULL,
    "paymentReference" TEXT,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT,
    "businessId" TEXT,
    "earningId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformRevenue_earningId_key" ON "PlatformRevenue"("earningId");

-- CreateIndex
CREATE INDEX "PlatformRevenue_campaignId_idx" ON "PlatformRevenue"("campaignId");

-- CreateIndex
CREATE INDEX "PlatformRevenue_creatorId_idx" ON "PlatformRevenue"("creatorId");

-- CreateIndex
CREATE INDEX "PlatformRevenue_businessId_idx" ON "PlatformRevenue"("businessId");

-- CreateIndex
CREATE INDEX "PlatformRevenue_type_idx" ON "PlatformRevenue"("type");

-- CreateIndex
CREATE INDEX "PlatformRevenue_status_idx" ON "PlatformRevenue"("status");

-- CreateIndex
CREATE INDEX "PlatformRevenue_createdAt_idx" ON "PlatformRevenue"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformRevenue_campaignId_type_key" ON "PlatformRevenue"("campaignId", "type");

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_earningId_fkey" FOREIGN KEY ("earningId") REFERENCES "Earning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
