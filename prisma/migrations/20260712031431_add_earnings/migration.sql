-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID');

-- CreateTable
CREATE TABLE "Earning" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Earning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Earning_submissionId_key" ON "Earning"("submissionId");

-- CreateIndex
CREATE INDEX "Earning_creatorId_idx" ON "Earning"("creatorId");

-- CreateIndex
CREATE INDEX "Earning_status_idx" ON "Earning"("status");

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
