-- Prevent two concurrent "pay" requests for the same campaign from claiming the
-- same attempt number (and therefore the same Snippe idempotency key), and keep
-- every Snippe payout reference globally unambiguous.

-- DropIndex
DROP INDEX "PaymentIntent_campaignId_attempt_idx";

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_campaignId_attempt_key" ON "PaymentIntent"("campaignId", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_providerReference_key" ON "Payout"("providerReference");