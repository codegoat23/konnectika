-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "thumbnailColor" TEXT NOT NULL,
    "thumbnailPic" TEXT NOT NULL,
    "thumbnailInitials" TEXT NOT NULL,
    "paymentRate" INTEGER NOT NULL,
    "budgetFunded" INTEGER NOT NULL DEFAULT 0,
    "budgetTotal" INTEGER NOT NULL,
    "daysLeft" INTEGER NOT NULL,
    "contentFormat" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "isOpenToAll" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "applicationsClose" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessProfileId" TEXT NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_businessProfileId_idx" ON "Campaign"("businessProfileId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
