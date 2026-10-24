// tests/campaign-flow.test.ts
//
// Campaign lifecycle: creation validation, fee snapshots, admin review
// (approval = funds received), and discovery privacy (public campaign list
// must never leak payment details or unreviewed campaigns).

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createFixture,
  signInAs,
  signOut,
  callRoute,
  readJson,
  createCampaign,
  resetDb,
} from "./helpers";
import { GET as campaignsListRoute, POST as createCampaignRoute } from "@/app/api/campaigns/route";
import { PATCH as adminCampaignStatusRoute } from "@/app/api/admin/campaign/[campaignId]/status/route";
import { POST as applyRoute } from "@/app/api/applications/route";

const URL = "http://localhost/api";

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Discovery Campaign",
    description: "A campaign for the discovery tests.",
    category: "Lifestyle",
    campaignType: "UGC",
    badge: "new",
    thumbnailColor: "#18181b",
    thumbnailPic: "",
    paymentRate: 150000,
    budgetTotal: 1500000,
    applicationsClose: new Date(Date.now() + 30 * 86400000).toISOString(),
    daysLeft: 30,
    contentFormat: "Video",
    duration: "30 days",
    isOpenToAll: true,
    isFeatured: false,
    tags: ["UGC"],
    requirements: [],
    brand: "Alpha Test Co",
    platforms: ["instagram"],
    ...overrides,
  };
}

describe("campaign flow", () => {
  let fx: Awaited<ReturnType<typeof createFixture>>;

  beforeEach(async () => {
    await resetDb();
    fx = await createFixture();
  });

  afterEach(() => {
    signOut();
  });

  it("rejects invalid campaign payloads", async () => {
    await signInAs(fx.brandAlpha.id, "BRAND");

    const cases: Array<[Record<string, unknown>, RegExp]> = [
      [{ ...validBody(), name: "   " }, /name/i],
      [{ ...validBody(), paymentRate: 0 }, /payment rate/i],
      [{ ...validBody(), paymentRate: -5 }, /payment rate/i],
      [{ ...validBody(), budgetTotal: 0 }, /budget/i],
      [{ ...validBody(), budgetTotal: "abc" }, /budget/i],
      [{ ...validBody(), applicationsClose: "not-a-date" }, /applications close/i],
      [
        { ...validBody(), paymentMethod: "M-PESA", paymentPhone: null },
        /phone/i,
      ],
    ];

    for (const [body, pattern] of cases) {
      const res = await callRoute({ POST: createCampaignRoute }, {
        method: "POST",
        url: `${URL}/campaigns`,
        body,
      });
      expect(res.status).toBe(400);
      expect((await readJson(res)).error).toMatch(pattern);
    }
  });

  it("snapshots the brand fee and records the BRAND_FEE revenue row", async () => {
    await signInAs(fx.brandAlpha.id, "BRAND");
    const res = await callRoute({ POST: createCampaignRoute }, {
      method: "POST",
      url: `${URL}/campaigns`,
      body: validBody({ budgetTotal: 2000000, paymentMethod: "Bank Transfer" }),
    });
    expect(res.status).toBe(201);

    const campaign = await readJson(res);
    expect(campaign.status).toBe("PENDING_REVIEW");
    expect(campaign.paymentStatus).toBe("UNPAID");
    // 10% — the default brand fee rate (PLATFORM_BRAND_FEE_PERCENT).
    expect(campaign.platformFeeRate).toBe(10);
    expect(campaign.platformFee).toBe(200000); // 10% of 2,000,000
    expect(campaign.totalCharge).toBe(2200000);
    expect(campaign.paymentMethod).toBe("Bank Transfer");

    const revenue = await prisma.platformRevenue.findFirst({
      where: { campaignId: campaign.id, type: "BRAND_FEE" },
    });
    expect(revenue?.feeRate).toBe(10);
    expect(revenue?.grossAmount).toBe(2000000);
    expect(revenue?.feeAmount).toBe(200000);
    expect(revenue?.status).toBe("ACCRUED");
  });

  it("approves a campaign (admin) — status becomes APPROVED, paymentStatus stays UNPAID", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      status: "PENDING_REVIEW",
      budgetTotal: 2000000,
    });
    await signInAs(fx.admin.id, "ADMIN");
    const res = await callRoute({ PATCH: adminCampaignStatusRoute }, {
      method: "PATCH",
      url: `${URL}/admin/campaign/${campaign.id}/status`,
      params: { campaignId: campaign.id },
      body: { status: "APPROVED" },
    });
    expect(res.status).toBe(200);

    const updated = await readJson(res);
    expect(updated.status).toBe("APPROVED");
    // Admin approval is decoupled from payment — the brand must pay separately.
    expect(updated.paymentStatus).toBe("UNPAID");
    // budgetFunded is the gross amount funded for creators — approval funds
    // nothing to creators, so it remains 0 here.
    expect(updated.budgetFunded).toBe(0);
  });

  it("rejects an invalid status in admin review", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      status: "PENDING_REVIEW",
    });
    await signInAs(fx.admin.id, "ADMIN");
    const res = await callRoute({ PATCH: adminCampaignStatusRoute }, {
      method: "PATCH",
      url: `${URL}/admin/campaign/${campaign.id}/status`,
      params: { campaignId: campaign.id },
      body: { status: "MAYBE" },
    });
    expect(res.status).toBe(400);
  });

  it("only lists APPROVED campaigns publicly and never leaks payment details", async () => {
    const approved = await createCampaign(fx.brandAlpha.businessProfileId, {
      status: "APPROVED",
      name: "Public Approved",
      paymentMethod: "M-PESA",
      paymentPhone: "+255712345678",
      paymentStatus: "PAID",
    });
    await createCampaign(fx.brandAlpha.businessProfileId, {
      status: "PENDING_REVIEW",
      name: "Hidden Pending",
    });
    await createCampaign(fx.brandAlpha.businessProfileId, {
      status: "REJECTED",
      name: "Hidden Rejected",
    });
    await createCampaign(fx.brandAlpha.businessProfileId, {
      status: "APPROVED",
      name: "Hidden Unpaid",
      paymentStatus: "UNPAID",
    });

    signOut();
    const res = await callRoute({ GET: campaignsListRoute }, {
      method: "GET",
      url: `${URL}/campaigns`,
    });
    expect(res.status).toBe(200);

    const campaigns = await readJson(res);
    const names = campaigns.map((c: { name: string }) => c.name);
    expect(names).toContain("Public Approved");
    expect(names).not.toContain("Hidden Pending");
    expect(names).not.toContain("Hidden Rejected");
    expect(names).not.toContain("Hidden Unpaid");

    const found = campaigns.find(
      (c: { id: string }) => c.id === approved.id
    );
    expect(found.paymentMethod).toBeUndefined();
    expect(found.paymentPhone).toBeUndefined();
    expect(found.paymentStatus).toBeUndefined();
    expect(found.platformFee).toBeUndefined();
    expect(found.platformFeeRate).toBeUndefined();
    expect(found.totalCharge).toBeUndefined();
    expect((found as Record<string, unknown>)._count).toBeUndefined();
    expect(found.creatorsJoined).toBe(0);
    expect(typeof found.daysLeft).toBe("number");
    expect(found.name).toBe("Public Approved");
  });

  it("blocks applications once the campaign closes", async () => {
    const closed = await createCampaign(fx.brandAlpha.businessProfileId, {
      status: "APPROVED",
      applicationsClose: new Date(Date.now() - 86400000), // yesterday
    });
    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const res = await callRoute({ POST: applyRoute }, {
      method: "POST",
      url: `${URL}/applications`,
      body: { campaignId: closed.id, message: "too late?" },
    });
    expect(res.status).toBe(400);
    expect((await readJson(res)).error).toMatch(/closed/i);
  });
});
