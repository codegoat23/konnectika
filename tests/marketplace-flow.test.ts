// tests/marketplace-flow.test.ts
//
// The full Konnectika marketplace lifecycle, end to end through the real API
// routes:
//
//   brand creates campaign -> admin approves (funds received, budget funded)
//   -> creator applies -> brand approves application (Earning PENDING)
//   -> creator submits content -> brand approves content (Earning APPROVED,
//      admin notified) -> the ADMIN approves the earning per campaign (Earning
//      AVAILABLE) -> the creator requests a payout -> the admin approves the
//      payout and marks it PAID -> the creator's wallet reflects the PAID net.
//
// Also verified: a brand can never create/approve a payout or settle an
// earning — even the owning brand gets an admin-only 403 at the API boundary.
//
// Plus the campaign budget guard: a campaign can never approve more creators
// than budgetTotal / paymentRate, and the rejected approval must roll back
// atomically (application stays PENDING, no Earning row).

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getCreatorWallet } from "@/lib/wallet";
import { createFixture, signInAs, signOut, callRoute, readJson } from "./helpers";
import { POST as createCampaignRoute } from "@/app/api/campaigns/route";
import { PATCH as adminCampaignStatusRoute } from "@/app/api/admin/campaign/[campaignId]/status/route";
import { POST as applyRoute } from "@/app/api/applications/route";
import { PATCH as applicationStatusRoute } from "@/app/api/applications/[id]/status/route";
import { POST as createSubmissionRoute } from "@/app/api/submissions/route";
import { PATCH as reviewSubmissionRoute } from "@/app/api/submissions/[id]/route";
import { POST as payoutsCreateRoute } from "@/app/api/payouts/route";
import { PATCH as payoutStatusRoute } from "@/app/api/payouts/[id]/status/route";
import { GET as campaignDetailsRoute } from "@/app/api/campaign/[id]/details/route";
import { PATCH as adminApproveEarningRoute } from "@/app/api/admin/campaign/[campaignId]/earnings/[earningId]/route";
import { createCampaign, createApplication, createCreatorUser, resetDb } from "./helpers";

const URL = "http://localhost/api";

function campaignCreateBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Summer UGC Campaign",
    description: "Show off the product in the summer sun.",
    category: "Lifestyle",
    campaignType: "UGC",
    badge: "new",
    thumbnailColor: "#18181b",
    thumbnailPic: "",
    paymentRate: 250000,
    budgetTotal: 2500000,
    applicationsClose: new Date(Date.now() + 30 * 86400000).toISOString(),
    daysLeft: 30,
    contentFormat: "Video (15s - 60s)",
    duration: "30 days",
    isOpenToAll: true,
    isFeatured: false,
    tags: ["Summer", "UGC"],
    requirements: ["Be authentic"],
    brand: "Alpha Test Co",
    platforms: ["instagram", "tiktok"],
    ...overrides,
  };
}

describe("marketplace lifecycle", () => {
  let fx: Awaited<ReturnType<typeof createFixture>>;
  let campaignId = "";
  let applicationId = "";
  let earningId = "";

  beforeEach(async () => {
    await resetDb();
    fx = await createFixture();
  });

  afterEach(async () => {
    signOut();
  });

  it("runs the full lifecycle and the creator wallet reflects the PAID payout", async () => {
    // 1. Brand creates the campaign -> PENDING_REVIEW, UNPAID, fee snapshotted.
    await signInAs(fx.brandAlpha.id, "BRAND");
    const created = await callRoute({ POST: createCampaignRoute }, {
      method: "POST",
      url: `${URL}/campaigns`,
      body: campaignCreateBody(),
    });
    expect(created.status).toBe(201);
    const createdBody = await readJson(created);
    campaignId = createdBody.id;
    expect(createdBody.status).toBe("PENDING_REVIEW");
    expect(createdBody.paymentStatus).toBe("UNPAID");
    expect(createdBody.platformFee).toBe(250000); // 10% of 2,500,000
    expect(createdBody.totalCharge).toBe(2750000);

    const brandFeeRow = await prisma.platformRevenue.findFirst({
      where: { campaignId, type: "BRAND_FEE" },
    });
    expect(brandFeeRow?.status).toBe("ACCRUED");
    expect(brandFeeRow?.feeAmount).toBe(250000);

    // 2. Admin approves the campaign (review decision only, payment stays UNPAID).
    await signInAs(fx.admin.id, "ADMIN");
    const approved = await callRoute({ PATCH: adminCampaignStatusRoute }, {
      method: "PATCH",
      url: `${URL}/admin/campaign/${campaignId}/status`,
      params: { campaignId },
      body: { status: "APPROVED" },
    });
    expect(approved.status).toBe(200);
    const approvedBody = await readJson(approved);
    expect(approvedBody.status).toBe("APPROVED");
    expect(approvedBody.paymentStatus).toBe("UNPAID");
    // Approval funds nothing to creators yet — budgetFunded is the real
    // gross paid-out total, so it stays 0 until a payout is actually paid.
    expect(approvedBody.budgetFunded).toBe(0);
    const accruedBrandFee = await prisma.platformRevenue.findFirst({
      where: { campaignId, type: "BRAND_FEE" },
    });
    expect(accruedBrandFee?.status).toBe("ACCRUED");

    // 3. Creator applies.
    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const applied = await callRoute({ POST: applyRoute }, {
      method: "POST",
      url: `${URL}/applications`,
      body: { campaignId, message: "I'd love to create for you!" },
    });
    expect(applied.status).toBe(200);
    const appliedBody = await readJson(applied);
    applicationId = appliedBody.id;
    expect(appliedBody.status).toBe("PENDING");

    // The campaign's join counter tracks live applications.
    const joinedAfterApply = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: { creatorsJoined: true },
    });
    expect(joinedAfterApply.creatorsJoined).toBe(1);

    // 4. Duplicate application is rejected.
    const dup = await callRoute({ POST: applyRoute }, {
      method: "POST",
      url: `${URL}/applications`,
      body: { campaignId, message: "again" },
    });
    expect(dup.status).toBe(400);
    expect((await readJson(dup)).error).toMatch(/already applied/i);

    // Brand cannot approve application while campaign is unpaid.
    await signInAs(fx.brandAlpha.id, "BRAND");
    const blockedApproval = await callRoute({ PATCH: applicationStatusRoute }, {
      method: "PATCH",
      url: `${URL}/applications/${applicationId}/status`,
      params: { id: applicationId },
      body: { status: "APPROVED" },
    });
    expect(blockedApproval.status).toBe(400);
    expect((await readJson(blockedApproval)).error).toMatch(/payment pending/i);

    // Brand pays for campaign -> paymentStatus flips to PAID.
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { paymentStatus: "PAID" },
    });
    await prisma.platformRevenue.updateMany({
      where: { campaignId, type: "BRAND_FEE" },
      data: { status: "PAID" },
    });

    // 5. Brand approves the application -> Earning created (PENDING).
    const appApproved = await callRoute({ PATCH: applicationStatusRoute }, {
      method: "PATCH",
      url: `${URL}/applications/${applicationId}/status`,
      params: { id: applicationId },
      body: { status: "APPROVED" },
    });
    expect(appApproved.status).toBe(200);
    const earning = await prisma.earning.findUniqueOrThrow({
      where: { applicationId },
    });
    earningId = earning.id;
    expect(earning.status).toBe("PENDING");
    expect(earning.amount).toBe(250000);
    expect(earning.platformFee).toBe(25000); // 10% creator fee
    expect(earning.creatorAmount).toBe(225000);

    // 6. Creator submits proof.
    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const submitted = await callRoute({ POST: createSubmissionRoute }, {
      method: "POST",
      url: `${URL}/submissions`,
      body: {
        applicationId,
        screenshots: ["https://example.com/photo.png"],
        postLinks: ["https://tiktok.com/@creator-alpha/video/1"],
        caption: "My summer content!",
      },
    });
    expect(submitted.status).toBe(201);
    const submittedBody = await readJson(submitted);
    expect(submittedBody.submission.status).toBe("PENDING_REVIEW");

    // 7. Brand approves the content -> Earning APPROVED, admin notified.
    await signInAs(fx.brandAlpha.id, "BRAND");
    const reviewed = await callRoute({ PATCH: reviewSubmissionRoute }, {
      method: "PATCH",
      url: `${URL}/submissions/${submittedBody.submission.id}`,
      params: { id: submittedBody.submission.id },
      body: { status: "APPROVED", reviewNote: "Great work!" },
    });
    expect(reviewed.status).toBe(200);

    const earningAfter = await prisma.earning.findUniqueOrThrow({
      where: { id: earningId },
    });
    expect(earningAfter.status).toBe("APPROVED");
    expect(earningAfter.approvedAt).not.toBeNull();

    const creatorFee = await prisma.platformRevenue.findFirst({
      where: { earningId, type: "CREATOR_FEE" },
    });
    expect(creatorFee?.status).toBe("ACCRUED");
    expect(creatorFee?.feeAmount).toBe(25000);

    // The brand's approval only flags the earning for settlement — the admin
    // is notified once (idempotent re-approval would not re-notify).
    const adminNotifs = await prisma.notification.findMany({
      where: { userId: fx.admin.id, title: "Creator Content Approved" },
    });
    expect(adminNotifs).toHaveLength(1);

    // 8. A brand CANNOT create or process a payout for the creator: 403 even
    // for the owning brand at the API boundary.
    await signInAs(fx.brandAlpha.id, "BRAND");
    const brandRequested = await callRoute({ POST: payoutsCreateRoute }, {
      method: "POST",
      url: `${URL}/payouts`,
      body: { paymentMethod: "M-PESA", paymentPhone: "+255712345678" },
    });
    expect(brandRequested.status).toBe(403);

    // 9. A BRAND can never settle a creator's earning — admin-only 403 — and
    //    only the ADMIN making the earning AVAILABLE unlocks the payout. The
    //    creator then requests a payout.
    await signInAs(fx.brandAlpha.id, "BRAND");
    const brandEarningSettle = await callRoute(
      { PATCH: adminApproveEarningRoute },
      {
        method: "PATCH",
        url: `${URL}/admin/campaign/${campaignId}/earnings/${earningId}`,
        params: { campaignId, earningId },
        body: { status: "AVAILABLE" },
      }
    );
    expect(brandEarningSettle.status).toBe(403);

    await signInAs(fx.admin.id, "ADMIN");
    const adminEarningSettle = await callRoute(
      { PATCH: adminApproveEarningRoute },
      {
        method: "PATCH",
        url: `${URL}/admin/campaign/${campaignId}/earnings/${earningId}`,
        params: { campaignId, earningId },
        body: { status: "AVAILABLE" },
      }
    );
    expect(adminEarningSettle.status).toBe(200);

    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const payoutReq = await callRoute({ POST: payoutsCreateRoute }, {
      method: "POST",
      url: `${URL}/payouts`,
      body: { paymentMethod: "M-PESA", paymentPhone: "+255712345678" },
    });
    expect(payoutReq.status).toBe(201);
    const payoutBody = await readJson(payoutReq);
    expect(payoutBody.payout.amount).toBe(225000);
    expect(payoutBody.payout.status).toBe("PENDING");
    expect(payoutBody.payout.paymentMethod).toBe("M-PESA");
    expect(payoutBody.payout.paymentPhone).toBe("+255712345678");

    // The creator cannot pay themselves out.
    const selfPay = await callRoute({ PATCH: payoutStatusRoute }, {
      method: "PATCH",
      url: `${URL}/payouts/${payoutBody.payout.id}/status`,
      params: { id: payoutBody.payout.id },
      body: { status: "PAID", paymentReference: "TXN-001" },
    });
    expect(selfPay.status).toBe(403);

    // 10. The ADMIN approves and marks the payout PAID.
    await signInAs(fx.admin.id, "ADMIN");
    const adminApprove = await callRoute({ PATCH: payoutStatusRoute }, {
      method: "PATCH",
      url: `${URL}/payouts/${payoutBody.payout.id}/status`,
      params: { id: payoutBody.payout.id },
      body: { status: "APPROVE" },
    });
    expect(adminApprove.status).toBe(200);

    const adminPaid = await callRoute({ PATCH: payoutStatusRoute }, {
      method: "PATCH",
      url: `${URL}/payouts/${payoutBody.payout.id}/status`,
      params: { id: payoutBody.payout.id },
      body: { status: "PAID", paymentReference: "TXN-001" },
    });
    expect(adminPaid.status).toBe(200);

    // 11. Wallet + revenue reflect the PAID net payout.
    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.pending).toBe(0);
    expect(wallet.approved).toBe(0);
    expect(wallet.available).toBe(0);
    expect(wallet.paid).toBe(225000);
    expect(wallet.lifetime).toBe(225000);

    // The campaign's REAL budgetFunded = gross amount funded for creators so far.
    const fundedCampaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
    });
    expect(fundedCampaign.budgetFunded).toBe(0); // stored column is legacy

    const adminCampaign = await callRoute(
      { GET: campaignDetailsRoute },
      {
        method: "GET",
        url: `${URL}/campaign/${campaignId}/details`,
        params: { id: campaignId },
      }
    );
    expect(adminCampaign.status).toBe(200);
    const adminCampaignBody = await readJson(adminCampaign);
    expect(adminCampaignBody.campaign.budgetFunded).toBe(250000); // live gross value

    const paidCreatorFee = await prisma.platformRevenue.findFirst({
      where: { earningId, type: "CREATOR_FEE" },
    });
    expect(paidCreatorFee?.status).toBe("PAID");
    expect(paidCreatorFee?.paymentReference).toBe("TXN-001");

    const notifications = await prisma.notification.findMany({
      where: { userId: fx.creatorAlpha.id },
    });
    expect(
      notifications.some((n) => n.title === "Payout Paid")
    ).toBe(true);
  });

  it("enforces the campaign budget and rolls back an over-limit approval", async () => {
    const paymentRate = 100000;
    const budgetTotal = 1000000; // exactly 10 creators
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      paymentRate,
      budgetTotal,
      paymentStatus: "PAID",
    });

    // 10 creators apply and get approved -> campaign is full.
    const creators = [];
    for (let i = 1; i <= 10; i++) {
      const email = `creator-0${i}@test.konnectika.local`;
      const username = `creator-0${i}`;
      const creator = await createCreatorUser(email, username);
      const app = await createApplication(creator.creatorProfile!.id, campaign.id, "PENDING");
      creators.push(app);

      await signInAs(fx.brandAlpha.id, "BRAND");
      const res = await callRoute({ PATCH: applicationStatusRoute }, {
        method: "PATCH",
        url: `${URL}/applications/${app.id}/status`,
        params: { id: app.id },
        body: { status: "APPROVED" },
      });
      expect(res.status).toBe(200);
    }

    const committed = await prisma.earning.count({
      where: { campaignId: campaign.id, status: { not: "REJECTED" } },
    });
    expect(committed).toBe(10);

    // 11th creator: approval must be rejected with a 400 AND rolled back.
    const extra = await createCreatorUser(
      "creator-11@test.konnectika.local",
      "creator-11"
    );
    const app11 = await createApplication(extra.creatorProfile!.id, campaign.id, "PENDING");

    await signInAs(fx.brandAlpha.id, "BRAND");
    const denied = await callRoute({ PATCH: applicationStatusRoute }, {
      method: "PATCH",
      url: `${URL}/applications/${app11.id}/status`,
      params: { id: app11.id },
      body: { status: "APPROVED" },
    });
    expect(denied.status).toBe(400);
    expect((await readJson(denied)).error).toMatch(/creator limit/i);

    // Rollback: application untouched, no earning, budget not consumed.
    const after = await prisma.campaignApplication.findUniqueOrThrow({
      where: { id: app11.id },
    });
    expect(after.status).toBe("PENDING");
    const rollbackEarning = await prisma.earning.findFirst({
      where: { applicationId: app11.id },
    });
    expect(rollbackEarning).toBeNull();
    const stillCommitted = await prisma.earning.count({
      where: { campaignId: campaign.id, status: { not: "REJECTED" } },
    });
    expect(stillCommitted).toBe(10);
  });
});