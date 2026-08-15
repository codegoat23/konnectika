-- Payment flow: complete creator payout lifecycle.
--
-- 1) Earning gains a direct campaign + application link (created at
--    application approval, before any content exists) and two new statuses
--    (APPROVED, PAID, REJECTED).
-- 2) A Payment row is created per approved earning and can be marked PAID
--    by the owning brand or an admin. One payment per earning (unique
--    earningId) guarantees double-payment is impossible at the DB level.
-- 3) SubmissionStatus gains PENDING_REVIEW (the initial status a creator's
--    proof is created with).

-- Extend EarningStatus. Postgres 12+ allows ADD VALUE inside a migration
-- transaction, but the new values may not be *used* in the same migration —
-- nothing below inserts rows referencing them.
ALTER TYPE "EarningStatus" ADD VALUE 'APPROVED';
ALTER TYPE "EarningStatus" ADD VALUE 'PAID';
ALTER TYPE "EarningStatus" ADD VALUE 'REJECTED';

-- New initial submission status (legacy SUBMITTED value is kept).
ALTER TYPE "SubmissionStatus" ADD VALUE 'PENDING_REVIEW';

-- Payment status enum + table.
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "earningId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "providerRef" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "paidBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- Earning additions.
ALTER TABLE "Earning" ADD COLUMN "campaignId" TEXT;
ALTER TABLE "Earning" ADD COLUMN "applicationId" TEXT;
ALTER TABLE "Earning" ALTER COLUMN "submissionId" DROP NOT NULL;
ALTER TABLE "Earning" ADD COLUMN "requestedAt" TIMESTAMP(3);

-- Backfill existing earnings from their submission.
UPDATE "Earning" e
SET "campaignId" = s."campaignId",
    "applicationId" = s."applicationId",
    "requestedAt" = e."createdAt"
FROM "Submission" s
WHERE e."submissionId" = s."id";

ALTER TABLE "Earning" ALTER COLUMN "campaignId" SET NOT NULL;

-- Unique indexes (idempotency / double-payment guards).
CREATE UNIQUE INDEX "Earning_applicationId_key" ON "Earning"("applicationId");
CREATE UNIQUE INDEX "Payment_earningId_key" ON "Payment"("earningId");

-- Foreign keys.
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CampaignApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_earningId_fkey" FOREIGN KEY ("earningId") REFERENCES "Earning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paidBy_fkey" FOREIGN KEY ("paidBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes.
CREATE INDEX "Earning_campaignId_idx" ON "Earning"("campaignId");
CREATE INDEX "Payment_campaignId_idx" ON "Payment"("campaignId");
CREATE INDEX "Payment_creatorId_idx" ON "Payment"("creatorId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
