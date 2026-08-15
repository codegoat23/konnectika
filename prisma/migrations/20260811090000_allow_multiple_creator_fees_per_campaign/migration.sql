-- A campaign can have many approved creators, each producing its own
-- CREATOR_FEE revenue row. The old [campaignId, type] unique index blocked
-- that (only the first approval per campaign could record a fee). The new
-- unique key discriminates on businessId: NULL for CREATOR_FEE (Postgres
-- treats NULLs as distinct, so many rows per campaign are allowed), set for
-- BRAND_FEE (stays unique per campaign+business).

-- DropIndex
DROP INDEX "PlatformRevenue_campaignId_type_key";

-- CreateIndex
CREATE UNIQUE INDEX "PlatformRevenue_campaignId_type_businessId_key" ON "PlatformRevenue"("campaignId", "type", "businessId");
