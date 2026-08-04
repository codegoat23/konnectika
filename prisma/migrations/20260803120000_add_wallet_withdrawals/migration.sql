-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'REJECTED');

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- AlterTable (add fee / settlement / withdrawal columns before changing the enum)
ALTER TABLE "Earning" ADD COLUMN "platformFeeRate" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Earning" ADD COLUMN "platformFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Earning" ADD COLUMN "creatorAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Earning" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Earning" ADD COLUMN "availableAt" TIMESTAMP(3);
ALTER TABLE "Earning" ADD COLUMN "withdrawnAt" TIMESTAMP(3);
ALTER TABLE "Earning" ADD COLUMN "withdrawalId" TEXT;

-- ChangeEnum (map old values via CASE so no data is lost)
ALTER TYPE "EarningStatus" RENAME TO "EarningStatus_old";
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'AVAILABLE', 'WITHDRAWN');
ALTER TABLE "Earning" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Earning" ALTER COLUMN "status" TYPE "EarningStatus" USING (
    CASE "status"::text
        WHEN 'APPROVED' THEN 'AVAILABLE'::"EarningStatus"
        WHEN 'PAID' THEN 'WITHDRAWN'::"EarningStatus"
        ELSE 'PENDING'::"EarningStatus"
    END
);
ALTER TABLE "Earning" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "EarningStatus_old";

-- Backfill legacy earnings (rows created before the fee split are treated as net)
UPDATE "Earning" SET "creatorAmount" = "amount" WHERE "creatorAmount" = 0;
UPDATE "Earning" SET "approvedAt" = "createdAt" WHERE "approvedAt" IS NULL AND "status" <> 'PENDING';
UPDATE "Earning" SET "availableAt" = "createdAt" WHERE "availableAt" IS NULL AND "status" = 'AVAILABLE';
UPDATE "Earning" SET "availableAt" = "createdAt" + INTERVAL '7 days' WHERE "availableAt" IS NULL AND "status" = 'PENDING';
UPDATE "Earning" SET "paidAt" = "createdAt", "withdrawnAt" = "createdAt" WHERE "status" = 'WITHDRAWN' AND "paidAt" IS NULL;

-- CreateIndex
CREATE INDEX "Earning_withdrawalId_idx" ON "Earning"("withdrawalId");

-- CreateIndex
CREATE INDEX "Withdrawal_creatorId_idx" ON "Withdrawal"("creatorId");

-- CreateIndex
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal"("status");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "Withdrawal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
