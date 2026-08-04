/*
  Warnings:

  - A unique constraint covering the columns `[businessId,platform]` on the table `SocialAccount` will be added. If there are existing duplicate values, this will fail.
  - Made the column `followers` on table `SocialAccount` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "SocialAccount_platform_idx";

-- AlterTable
ALTER TABLE "SocialAccount" ADD COLUMN     "businessId" TEXT,
ALTER COLUMN "creatorId" DROP NOT NULL,
ALTER COLUMN "followers" SET NOT NULL;

-- CreateIndex
CREATE INDEX "SocialAccount_businessId_idx" ON "SocialAccount"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_businessId_platform_key" ON "SocialAccount"("businessId", "platform");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "BusinessProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
