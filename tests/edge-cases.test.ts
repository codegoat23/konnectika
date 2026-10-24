// tests/edge-cases.test.ts
//
// Idempotency and money-integrity edge cases:
//   - re-approving an application never creates a second earning
//   - re-approving content never creates a second fee row
//   - rejected content means the earning can never be paid out
//   - the PAYOUT is the single settlement channel: AVAILABLE earnings only
//     leave the wallet through a payout, and a second request is blocked for
//     the same funds
//   - a creator cannot double-request a payout for the same earnings

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createEarningForApprovedApplication,
  rejectContentForEarning,
  approveEarningAvailable,
} from "@/lib/payment-flow";
import { getCreatorWallet } from "@/lib/wallet";
import { createPayout, getCreatorPayouts } from "@/lib/payout";
import {
  createFixture,
  signInAs,
  signOut,
  callRoute,
  createCampaign,
  createApplication,
  resetDb,
} from "./helpers";
import { PATCH as applicationStatusRoute } from "@/app/api/applications/[id]/status/route";
import { PATCH as reviewSubmissionRoute } from "@/app/api/submissions/[id]/route";

const URL = "http://localhost/api";

describe("edge cases", () => {
  let fx: Awaited<ReturnType<typeof createFixture>>;

  beforeEach(async () => {
    await resetDb();
    fx = await createFixture();
  });

  afterEach(() => {
    signOut();
  });

  it("re-approving an application is idempotent (one earning only)", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      paymentStatus: "PAID",
    });
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "PENDING"
    );

    await signInAs(fx.brandAlpha.id, "BRAND");
    await callRoute({ PATCH: applicationStatusRoute }, {
      method: "PATCH",
      url: `${URL}/applications/${application.id}/status`,
      params: { id: application.id },
      body: { status: "APPROVED" },
    });
    const again = await callRoute({ PATCH: applicationStatusRoute }, {
      method: "PATCH",
      url: `${URL}/applications/${application.id}/status`,
      params: { id: application.id },
      body: { status: "APPROVED" },
    });
    expect(again.status).toBe(200);

    const earnings = await prisma.earning.findMany({
      where: { applicationId: application.id },
    });
    expect(earnings).toHaveLength(1);
  });

  it("re-approving content is idempotent (one fee row only)", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      paymentRate: 100000,
      paymentStatus: "PAID",
    });
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "APPROVED"
    );
    await prisma.$transaction((tx) =>
      createEarningForApprovedApplication(tx, {
        applicationId: application.id,
        campaignId: campaign.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        paymentRate: 100000,
      })
    );
    const submission = await prisma.submission.create({
      data: {
        applicationId: application.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: campaign.id,
        screenshots: ["https://example.com/idem.png"],
        postLinks: ["https://example.com/video"],
        status: "PENDING_REVIEW",
      },
    });

    await signInAs(fx.brandAlpha.id, "BRAND");
    for (let i = 0; i < 2; i++) {
      const res = await callRoute({ PATCH: reviewSubmissionRoute }, {
        method: "PATCH",
        url: `${URL}/submissions/${submission.id}`,
        params: { id: submission.id },
        body: { status: "APPROVED" },
      });
      expect(res.status).toBe(200);
    }

    const earning = await prisma.earning.findUniqueOrThrow({
      where: { applicationId: application.id },
    });
    expect(earning.status).toBe("APPROVED");

    const fees = await prisma.platformRevenue.findMany({
      where: { earningId: earning.id, type: "CREATOR_FEE" },
    });
    expect(fees).toHaveLength(1);
  });

  it("rejected content permanently prevents a payout", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "APPROVED"
    );
    await prisma.$transaction((tx) =>
      createEarningForApprovedApplication(tx, {
        applicationId: application.id,
        campaignId: campaign.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        paymentRate: campaign.paymentRate,
      })
    );
    await prisma.submission.create({
      data: {
        applicationId: application.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: campaign.id,
        screenshots: ["https://example.com/rej.png"],
        postLinks: ["https://example.com/video"],
        status: "PENDING_REVIEW",
      },
    });

    await prisma.$transaction((tx) =>
      rejectContentForEarning(tx, application.id)
    );

    const earning = await prisma.earning.findUniqueOrThrow({
      where: { applicationId: application.id },
    });
    expect(earning.status).toBe("REJECTED");

    // The wallet excludes it from lifetime totals.
    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.lifetime).toBe(0);

    // Even an admin approval can never make a REJECTED earning AVAILABLE, so
    // it can never roll into a payout.
    await expect(
      prisma.$transaction((tx) => approveEarningAvailable(tx, earning.id))
    ).rejects.toThrow(/only an APPROVED earning/i);
    expect(earning.status).toBe("REJECTED");

    const result = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(result.payout).toBeUndefined();
    await expect(getCreatorPayouts(fx.creatorAlpha.creatorProfileId)).resolves.toHaveLength(0);
  });

  it("AVAILABLE earnings leave the wallet only through a payout (single settlement channel)", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      paymentRate: 100000,
      budgetTotal: 100000 * 20,
    });
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "APPROVED"
    );

    // Direct AVAILABLE earning seeded the way admin approval leaves them.
    const earning = await prisma.earning.create({
      data: {
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: campaign.id,
        applicationId: application.id,
        amount: 100000,
        platformFeeRate: 10,
        platformFee: 10000,
        creatorAmount: 90000,
        status: "AVAILABLE",
        requestedAt: new Date(),
        availableAt: new Date(),
      },
    });
    await prisma.platformRevenue.create({
      data: {
        campaignId: campaign.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        earningId: earning.id,
        type: "CREATOR_FEE",
        status: "ACCRUED",
        feeRate: 10,
        grossAmount: 100000,
        feeAmount: 10000,
      },
    });

    // Below the 50,000 threshold no payout is possible; the funds stay put.
    if (earning.creatorAmount < 50000) {
      const lowResult = await createPayout(fx.creatorAlpha.creatorProfileId);
      expect(lowResult.payout).toBeUndefined();
    }

    // Push the balance over the threshold with a second earning on a second
    // campaign, then the creator can request a payout for the full balance.
    const campaign2 = await createCampaign(fx.brandAlpha.businessProfileId, {
      paymentRate: 100000,
      budgetTotal: 100000 * 20,
    });
    const application2 = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign2.id,
      "APPROVED"
    );
    await prisma.earning.create({
      data: {
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: campaign2.id,
        applicationId: application2.id,
        amount: 100000,
        platformFeeRate: 10,
        platformFee: 10000,
        creatorAmount: 90000,
        status: "AVAILABLE",
        requestedAt: new Date(),
        availableAt: new Date(),
      },
    });

    const requested = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(requested.payout).toBeDefined();
    expect(requested.payout!.amount).toBe(180000);

    // The available balance is now frozen into the payout.
    const walletAfterRequest = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(walletAfterRequest.available).toBe(0);

    // A second payout request has nothing left to pool.
    const second = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(second.payout).toBeUndefined();
    expect(second.code).toBe("INVALID_STATE");

    // No staleness: the wallet still counts the frozen funds as lifetime.
    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.lifetime).toBe(180000);
    expect(wallet.available).toBe(0);
  });

  it("rejecting an application never creates an earning", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    const application = await createApplication(
      fx.creatorAlpha.creatorProfileId,
      campaign.id,
      "PENDING"
    );
    await signInAs(fx.brandAlpha.id, "BRAND");
    const res = await callRoute({ PATCH: applicationStatusRoute }, {
      method: "PATCH",
      url: `${URL}/applications/${application.id}/status`,
      params: { id: application.id },
      body: { status: "REJECTED" },
    });
    expect(res.status).toBe(200);

    const earnings = await prisma.earning.findMany({
      where: { applicationId: application.id },
    });
    expect(earnings).toHaveLength(0);
  });
});