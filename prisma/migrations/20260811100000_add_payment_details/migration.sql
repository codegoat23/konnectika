-- Add payment phone for creator withdrawals (mobile-money payouts) and
-- payment method + phone for brand campaign payments (mobile-money transfers).

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN "paymentPhone" TEXT;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "paymentPhone" TEXT;
