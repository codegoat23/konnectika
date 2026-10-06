// tests/snippe-pricing.test.ts
//
// Fee configuration and the admin controls over it.
//
// Two properties matter:
//   1. An admin can change a fee percentage, and the change takes effect for
//      NEW transactions.
//   2. It does NOT retroactively rewrite existing records. Every campaign,
//      earning, revenue row and payment intent snapshots the rate it was
//      created with, so a rate change cannot silently move money that was
//      already agreed.
//
// Also covers the brand charge breakdown: budget + platform fee + estimated
// collection fee = total, and why the collection fee is an estimate.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getPlatformPricing,
  updatePlatformPricing,
  computeBrandCharge,
  PRICING_SETTING_BRAND_FEE,
  PRICING_SETTING_CREATOR_FEE,
  PRICING_SETTING_COLLECTION_FEE,
} from "@/lib/pricing";
import * as createCampaignRoute from "@/app/api/campaigns/route";
import * as pricingRoute from "@/app/api/platform/pricing/route";
import {
  createFixture,
  signInAs,
  signOut,
  callRoute,
  readJson,
  resetDb,
} from "./helpers";

const PRICING_KEYS = [
  PRICING_SETTING_BRAND_FEE,
  PRICING_SETTING_CREATOR_FEE,
  PRICING_SETTING_COLLECTION_FEE,
];

/** A minimal valid campaign body. */
function campaignBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Pricing Test Campaign",
    description: "Fee configuration test.",
    category: "Lifestyle",
    campaignType: "UGC",
    badge: "new",
    paymentRate: 250000,
    budgetTotal: 1_000_000,
    daysLeft: 30,
    contentFormat: "Video (15s - 60s)",
    duration: "30 days",
    applicationsClose: new Date(Date.now() + 30 * 864e5).toISOString(),
    thumbnailColor: "#18181b",
    ...overrides,
  };
}

describe("platform pricing", () => {
  let fx: Awaited<ReturnType<typeof createFixture>>;

  beforeEach(async () => {
    await resetDb();
    fx = await createFixture();
    await prisma.platformSetting.deleteMany({ where: { key: { in: PRICING_KEYS } } });
  });

  afterEach(() => {
    signOut();
  });

  // -------------------------------------------------------------------------
  // Defaults
  // -------------------------------------------------------------------------

  it("falls back to env/defaults when an admin has saved nothing", async () => {
    const pricing = await getPlatformPricing();
    expect(pricing.brandFeePercent).toBe(
      Number(process.env.PLATFORM_BRAND_FEE_PERCENT ?? 10)
    );
    expect(pricing.creatorFeePercent).toBe(
      Number(process.env.PLATFORM_CREATOR_FEE_PERCENT ?? 10)
    );
    // Snippe has no collection-fee quote endpoint, so the default is 0: the
    // platform absorbs collection fees until an admin decides otherwise.
    expect(pricing.snippeCollectionFeePercent).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Admin updates
  // -------------------------------------------------------------------------

  it("persists an admin's changed percentages", async () => {
    const result = await updatePlatformPricing({
      brandFeePercent: 15,
      creatorFeePercent: 12,
      snippeCollectionFeePercent: 2,
    });
    expect(result.ok).toBe(true);

    const stored = await getPlatformPricing();
    expect(stored.brandFeePercent).toBe(15);
    expect(stored.creatorFeePercent).toBe(12);
    expect(stored.snippeCollectionFeePercent).toBe(2);

    // Stored as settings rows, so they survive a restart and outrank env.
    const row = await prisma.platformSetting.findUniqueOrThrow({
      where: { key: PRICING_SETTING_BRAND_FEE },
    });
    expect(row.value).toBe("15");
  });

  it("leaves untouched percentages alone on a partial update", async () => {
    await updatePlatformPricing({ brandFeePercent: 15, creatorFeePercent: 12 });
    await updatePlatformPricing({ brandFeePercent: 20 });

    const stored = await getPlatformPricing();
    expect(stored.brandFeePercent).toBe(20);
    expect(stored.creatorFeePercent).toBe(12);
  });

  it("rejects a fee outside 0-100", async () => {
    for (const bad of [-1, 101, Number.NaN, Infinity]) {
      const result = await updatePlatformPricing({ brandFeePercent: bad });
      expect(result.ok).toBe(false);
    }
    // Nothing was written.
    expect(await prisma.platformSetting.count({ where: { key: { in: PRICING_KEYS } } })).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Route access control
  // -------------------------------------------------------------------------

  it("exposes the effective pricing to any signed-in user", async () => {
    await signInAs(fx.brandAlpha.id, "BRAND");
    const res = await callRoute(pricingRoute, { method: "GET" });
    expect(res.status).toBe(200);

    const body = await readJson(res);
    expect(typeof body.brandFeePercent).toBe("number");
    expect(typeof body.creatorFeePercent).toBe("number");
    expect(typeof body.snippeCollectionFeePercent).toBe("number");
  });

  it("refuses to expose pricing to an anonymous visitor", async () => {
    signOut();
    const res = await callRoute(pricingRoute, { method: "GET" });
    expect(res.status).toBe(401);
  });

  it("lets only an admin change pricing", async () => {
    await signInAs(fx.brandAlpha.id, "BRAND");
    const asBrand = await callRoute(pricingRoute, {
      method: "PATCH",
      body: { brandFeePercent: 99 },
    });
    expect(asBrand.status).toBe(403);

    await signInAs(fx.admin.id, "ADMIN");
    const asAdmin = await callRoute(pricingRoute, {
      method: "PATCH",
      body: { brandFeePercent: 15 },
    });
    expect(asAdmin.status).toBe(200);
    expect((await readJson(asAdmin)).brandFeePercent).toBe(15);

    // A brand's rejected request changed nothing.
    expect((await getPlatformPricing()).brandFeePercent).toBe(15);
  });

  it("rejects a junk percentage instead of silently ignoring it", async () => {
    await signInAs(fx.admin.id, "ADMIN");
    const res = await callRoute(pricingRoute, {
      method: "PATCH",
      body: { brandFeePercent: "ten" },
    });
    expect(res.status).toBe(400);
    expect((await readJson(res)).error).toMatch(/must be a number/i);

    const empty = await callRoute(pricingRoute, { method: "PATCH", body: {} });
    expect(empty.status).toBe(400);
  });

  // -------------------------------------------------------------------------
  // The brand charge breakdown
  // -------------------------------------------------------------------------

  it("builds budget + platform fee + provider fee = total", async () => {
    const breakdown = computeBrandCharge(1_000_000, {
      brandFeePercent: 10,
      creatorFeePercent: 10,
      snippeCollectionFeePercent: 2,
    });

    expect(breakdown.budget).toBe(1_000_000);
    expect(breakdown.platformFee).toBe(100_000);
    expect(breakdown.totalCharge).toBe(
      breakdown.budget + breakdown.platformFee + breakdown.providerFee
    );
    // The provider fee is charged on what the brand is billed, fees included.
    expect(breakdown.providerFee).toBe(22_000); // 2% of 1,100,000
  });

  it("charges no provider fee when the estimate is 0", async () => {
    const breakdown = computeBrandCharge(500_000, {
      brandFeePercent: 10,
      creatorFeePercent: 10,
      snippeCollectionFeePercent: 0,
    });
    expect(breakdown.providerFee).toBe(0);
    expect(breakdown.totalCharge).toBe(550_000);
  });

  // -------------------------------------------------------------------------
  // Snapshot semantics
  // -------------------------------------------------------------------------

  it("applies a new rate to NEW campaigns without rewriting old ones", async () => {
    await signInAs(fx.brandAlpha.id, "BRAND");

    // Campaign 1 at the default rate.
    const first = await callRoute(createCampaignRoute, {
      method: "POST",
      body: campaignBody({ name: "Before rate change" }),
    });
    expect(first.status).toBe(201);
    const before = await readJson(first);
    expect(before.platformFeeRate).toBe(10);
    expect(before.platformFee).toBe(100_000);

    // Admin raises the fee.
    await signInAs(fx.admin.id, "ADMIN");
    await callRoute(pricingRoute, { method: "PATCH", body: { brandFeePercent: 20 } });

    // Campaign 2 picks up the new rate.
    await signInAs(fx.brandAlpha.id, "BRAND");
    const second = await callRoute(createCampaignRoute, {
      method: "POST",
      body: campaignBody({ name: "After rate change" }),
    });
    expect(second.status).toBe(201);
    const after = await readJson(second);
    expect(after.platformFeeRate).toBe(20);
    expect(after.platformFee).toBe(200_000);

    // Campaign 1 keeps the rate it was agreed at — its creator budgets and
    // the brand's invoice must not move retroactively.
    const persisted = await prisma.campaign.findUniqueOrThrow({
      where: { id: before.id },
    });
    expect(persisted.platformFeeRate).toBe(10);
    expect(persisted.platformFee).toBe(100_000);
    expect(persisted.totalCharge).toBe(1_100_000);

    // And so does its revenue row.
    const revenue = await prisma.platformRevenue.findFirstOrThrow({
      where: { campaignId: before.id, type: "BRAND_FEE" },
    });
    expect(revenue.feeRate).toBe(10);
    expect(revenue.feeAmount).toBe(100_000);
  });
});