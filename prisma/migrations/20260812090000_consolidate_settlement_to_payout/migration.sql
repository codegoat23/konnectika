-- Consolidate settlement to the scheduled payout as the ONLY channel.
--
-- 1) Data fix FIRST: any legacy WITHDRAWN earnings are folded into the payout
--    flow as PAID so no creator money is lost, and no row still uses the
--    WITHDRAWN enum variant by the time EarningStatus is recreated below.
UPDATE "Earning"
SET status = 'PAID',
    "paidAt" = COALESCE("paidAt", "withdrawnAt")
WHERE status = 'WITHDRAWN';

-- AlterEnum
BEGIN;
CREATE TYPE "EarningStatus_new" AS ENUM ('PENDING', 'APPROVED', 'AVAILABLE', 'PAID', 'REJECTED');
ALTER TABLE "public"."Earning" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Earning" ALTER COLUMN "status" TYPE "EarningStatus_new" USING ("status"::text::"EarningStatus_new");
ALTER TYPE "EarningStatus" RENAME TO "EarningStatus_old";
ALTER TYPE "EarningStatus_new" RENAME TO "EarningStatus";
DROP TYPE "public"."EarningStatus_old";
ALTER TABLE "Earning" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Earning" DROP CONSTRAINT "Earning_withdrawalId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_earningId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_paidBy_fkey";

-- DropForeignKey
ALTER TABLE "Withdrawal" DROP CONSTRAINT "Withdrawal_creatorId_fkey";

-- DropIndex
DROP INDEX "Earning_withdrawalId_idx";

-- AlterTable
ALTER TABLE "Earning" DROP COLUMN "withdrawalId",
DROP COLUMN "withdrawnAt";

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentPhone" TEXT;

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Withdrawal";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "WithdrawalStatus";
