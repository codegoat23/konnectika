-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('AWAITING_PAYMENT', 'PROCESSING', 'PAID', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CampaignPaymentStatus" ADD VALUE 'AWAITING_PAYMENT';
ALTER TYPE "CampaignPaymentStatus" ADD VALUE 'PAYMENT_FAILED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PayoutStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "PayoutStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "PaymentProof" ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerReference" TEXT;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "feeAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "narration" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerExternalRef" TEXT,
ADD COLUMN     "providerReference" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "totalAmount" INTEGER;

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT NOT NULL,
    "budgetTotal" INTEGER NOT NULL,
    "platformFeeRate" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "providerFeeRate" INTEGER NOT NULL,
    "providerFee" INTEGER NOT NULL,
    "totalCharge" INTEGER NOT NULL,
    "actualProviderFee" INTEGER,
    "actualNetAmount" INTEGER,
    "provider" TEXT NOT NULL DEFAULT 'snippe',
    "providerReference" TEXT,
    "providerExternalRef" TEXT,
    "channel" TEXT,
    "customerPhone" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "failureReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'snippe',
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_idempotencyKey_key" ON "PaymentIntent"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_providerReference_key" ON "PaymentIntent"("providerReference");

-- CreateIndex
CREATE INDEX "PaymentIntent_campaignId_attempt_idx" ON "PaymentIntent"("campaignId", "attempt");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_idx" ON "PaymentIntent"("status");

-- CreateIndex
CREATE INDEX "WebhookEvent_type_idx" ON "WebhookEvent"("type");

-- CreateIndex
CREATE INDEX "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");

-- AddForeignKey
ALTER TABLE "PaymentProof" ADD CONSTRAINT "PaymentProof_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
