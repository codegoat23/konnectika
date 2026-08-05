-- CreateEnum
CREATE TYPE "CampaignPaymentStatus" AS ENUM ('UNPAID', 'PAID');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "paymentStatus" "CampaignPaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "platformFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "platformFeeRate" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCharge" INTEGER NOT NULL DEFAULT 0;
