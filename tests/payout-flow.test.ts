// tests/payout-flow.test.ts
//
// The scheduled creator payout system:
//   - platform settings (minimum amount + payout day) defaults / update
//   - payout date math (next 25th, payout-day gate)
//   - threshold: below minimum -> no payout (earnings roll over); crossing the
//     threshold -> a PENDING payout for the full available balance
//   - no duplicate active payouts, no over-payment, no negative balances
//   - scheduled generation on the payout day
//   - admin approve / reject (earnings roll over) / mark PAID
//   - admin-only guard (brands/creators get 403; only ADMIN marks paid)
//   - the payout is the ONLY settlement channel — no Payment / Withdrawal rows
//     are ever created, and destination details (method/phone) are captured

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getPlatformPayoutSettings,
  updatePlatformPayoutSettings,
  getNextPayoutDate,
  isPayoutDay,
  createPayout,
  runScheduledPayouts,
  approvePayout,
  rejectPayout,
  markPayoutPaid,
  getCreatorPayouts,
  getPayoutEligibility,
  PAYOUT_SETTING_MINIMUM,
  PAYOUT_SETTING_DAY,
} from "@/lib/payout";
import { getCreatorWallet } from "@/lib/wallet";
import { createEarningForApprovedApplication, approveContentForEarning, approveEarningAvailable } from "@/lib/payment-flow";
import {
  createFixture,
  signInAs,
  signOut,
  callRoute,
  readJson,
  createCampaign,
  createApplication,
  resetDb,
} from "./helpers";
import { GET as payoutsListRoute, POST as payoutsCreateRoute } from "@/app/api/payouts/route";
import { PATCH as payoutStatusRoute } from "@/app/api/payouts/[id]/status/route";
import { POST as generateRoute } from "@/app/api/payouts/generate/route";
import {
  GET as settingsGetRoute,
  PATCH as settingsPatchRoute,
} from "@/app/api/payouts/settings/route";

const URL = "http://localhost/api";

/** Build a settled AVAILABLE earning for a creator (content approved via the
 *  real flow, then the admin makes it AVAILABLE). */
async function buildAvailableEarning(
  fx: Awaited<ReturnType<typeof createFixture>>,
  opts: {
    creatorProfileId: string;
    businessProfileId: string;
    paymentRate: number;
  }
) {
  const { paymentRate } = opts;
  const campaign = await createCampaign(opts.businessProfileId, {
    paymentRate,
    budgetTotal: paymentRate * 20,
  });
  const application = await createApplication(
    opts.creatorProfileId,
    campaign.id,
    "APPROVED"
  );

  await prisma.$transaction((tx) =>
    createEarningForApprovedApplication(tx, {
      applicationId: application.id,
      campaignId: campaign.id,
      creatorId: opts.creatorProfileId,
      paymentRate,
    })
  );

  const submission = await prisma.submission.create({
    data: {
      applicationId: application.id,
      creatorId: opts.creatorProfileId,
      campaignId: campaign.id,
      screenshots: ["https://example.com/payout.png"],
      postLinks: ["https://instagram.com/@x/payout"],
      status: "PENDING_REVIEW",
    },
  });

  await prisma.$transaction((tx) =>
    approveContentForEarning(tx, {
      submissionId: submission.id,
      applicationId: application.id,
      creatorId: opts.creatorProfileId,
      campaignId: campaign.id,
      paymentRate,
    })
  );

  // Admin makes the earning AVAILABLE (the only settlement path).
  const earning = await prisma.earning.findUniqueOrThrow({
    where: { applicationId: application.id },
  });
  await prisma.$transaction((tx) => approveEarningAvailable(tx, earning.id));

  const availableEarning = await prisma.earning.findUniqueOrThrow({
    where: { applicationId: application.id },
  });
  return { campaign, application, earning: availableEarning };
}

describe("scheduled payouts", () => {
  let fx: Awaited<ReturnType<typeof createFixture>>;

  beforeEach(async () => {
    await resetDb();
    fx = await createFixture();
    // Reset the platform settings back to defaults so tests are deterministic.
    await prisma.platformSetting.deleteMany({
      where: { key: { in: [PAYOUT_SETTING_MINIMUM, PAYOUT_SETTING_DAY] } },
    });
  });

  afterEach(() => {
    signOut();
  });

  // -------------------------------------------------------------------------
  // Settings + date math
  // -------------------------------------------------------------------------

  it("defaults to a 50,000 TZS minimum and the 25th of each month", async () => {
    const settings = await getPlatformPayoutSettings();
    expect(settings.minimumPayoutAmount).toBe(50000);
    expect(settings.payoutDay).toBe(25);
  });

  it("persists admin-changed settings and rejects invalid values", async () => {
    const ok = await updatePlatformPayoutSettings({
      minimumPayoutAmount: 75000,
      payoutDay: 10,
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.settings.minimumPayoutAmount).toBe(75000);
      expect(ok.settings.payoutDay).toBe(10);
    }

    const loaded = await getPlatformPayoutSettings();
    expect(loaded.minimumPayoutAmount).toBe(75000);
    expect(loaded.payoutDay).toBe(10);

    const bad1 = await updatePlatformPayoutSettings({ minimumPayoutAmount: 0 });
    expect(bad1.ok).toBe(false);

    const bad2 = await updatePlatformPayoutSettings({ payoutDay: 32 });
    expect(bad2.ok).toBe(false);
  });

  it("computes the next payout date and the payout-day gate", () => {
    const jan12 = new Date(2026, 0, 12);
    const jan25 = new Date(2026, 0, 25);
    const jan26 = new Date(2026, 0, 26);

    expect(getNextPayoutDate(jan12, 25).getDate()).toBe(25);
    expect(getNextPayoutDate(jan12, 25).getMonth()).toBe(0);
    expect(getNextPayoutDate(jan26, 25).getMonth()).toBe(1); // rolls to Feb
    expect(getNextPayoutDate(jan25, 25).getDate()).toBe(25); // today = payout day

    expect(isPayoutDay(jan25, 25)).toBe(true);
    expect(isPayoutDay(jan26, 25)).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Threshold / rollover
  // -------------------------------------------------------------------------

  it("blocks a payout below the minimum threshold (earnings roll over)", async () => {
    // 30,000 gross -> 27,000 net, below the 50,000 threshold.
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });

    const eligibility = await getPayoutEligibility(fx.creatorAlpha.creatorProfileId);
    expect(eligibility.availableBalance).toBe(27000);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.remainingToEligible).toBe(23000);

    const result = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(result.payout).toBeUndefined();
    expect(result.code).toBe("INVALID_STATE");

    // No payout row, earnings NOT frozen, balance still available.
    const payouts = await getCreatorPayouts(fx.creatorAlpha.creatorProfileId);
    expect(payouts).toHaveLength(0);

    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.available).toBe(27000);
  });

  it("creates a payout for the full available balance once the threshold is crossed", async () => {
    // Two earnings of 27,000 net = 54,000 available -> eligible.
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });

    const eligibility = await getPayoutEligibility(fx.creatorAlpha.creatorProfileId);
    expect(eligibility.availableBalance).toBe(54000);
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.remainingToEligible).toBe(0);

    const result = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(result.payout).toBeDefined();
    expect(result.payout!.amount).toBe(54000);
    expect(result.payout!.status).toBe("PENDING");

    // Earnings are frozen into the payout -> wallet available is now 0.
    const frozenCount = await prisma.earning.count({
      where: { creatorId: fx.creatorAlpha.creatorProfileId, payoutId: result.payout!.id },
    });
    expect(frozenCount).toBe(2);

    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.available).toBe(0);
    // The frozen money is visible as "processing" (in review with an admin).
    expect(wallet.processing).toBe(54000);
    expect(wallet.lifetime).toBe(54000);
  });

  it("rejects a second active payout for the same creator", async () => {
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });

    const first = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(first.payout).toBeDefined();

    const second = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(second.payout).toBeUndefined();
    expect(second.code).toBe("INVALID_STATE");

    const active = await prisma.payout.count({
      where: { creatorId: fx.creatorAlpha.creatorProfileId, status: "PENDING" },
    });
    expect(active).toBe(1);
  });

  it("generates scheduled payouts only on the payout day", async () => {
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });

    const offDay = new Date(2026, 0, 10);
    expect(await runScheduledPayouts(offDay)).toEqual({ generated: 0 });

    const payoutDay = new Date(2026, 0, 25);
    const result = await runScheduledPayouts(payoutDay);
    expect(result.generated).toBe(1);

    const payouts = await getCreatorPayouts(fx.creatorAlpha.creatorProfileId);
    expect(payouts).toHaveLength(1);
    expect(payouts[0].amount).toBe(54000);
  });

  // -------------------------------------------------------------------------
  // Admin actions
  // -------------------------------------------------------------------------

  it("captures the creator's destination method and phone on a payout", async () => {
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });

    const created = await createPayout(fx.creatorAlpha.creatorProfileId, new Date(), {
      paymentMethod: "M-PESA",
      paymentPhone: "+255712345678",
    });
    expect(created.payout).toBeDefined();
    expect(created.payout!.paymentMethod).toBe("M-PESA");
    expect(created.payout!.paymentPhone).toBe("+255712345678");
  });

  it("approves a payout, then rejects it and returns the funds (rollover)", async () => {
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    const created = await createPayout(fx.creatorAlpha.creatorProfileId);
    const payoutId = created.payout!.id;

    const approved = await approvePayout(payoutId, fx.admin.id);
    expect(approved.payout!.status).toBe("APPROVED");
    expect(approved.payout!.approvedAt).not.toBeNull();
    expect(approved.payout!.reviewedBy).toBe(fx.admin.id);

    // Cannot approve twice.
    const doubleApprove = await approvePayout(payoutId, fx.admin.id);
    expect(doubleApprove.payout).toBeUndefined();
    expect(doubleApprove.code).toBe("INVALID_STATE");

    // Rejecting an APPROVED payout unfreezes the earnings.
    const rejected = await rejectPayout(payoutId, fx.admin.id, "Wrong payment details");
    expect(rejected.payout!.status).toBe("REJECTED");
    expect(rejected.payout!.rejectionReason).toBe("Wrong payment details");

    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.available).toBe(54000);

    const frozenCount = await prisma.earning.count({
      where: { payoutId },
    });
    expect(frozenCount).toBe(0);

    // Creator got notified about the rejection.
    const notifications = await prisma.notification.findMany({
      where: { userId: fx.creatorAlpha.id, title: "Payout Rejected" },
    });
    expect(notifications).toHaveLength(1);
  });

  it("marks an APPROVED payout as PAID: earnings paid and revenue collected", async () => {
    const built = await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });

    const created = await createPayout(fx.creatorAlpha.creatorProfileId);
    await approvePayout(created.payout!.id, fx.admin.id);

    const paid = await markPayoutPaid({
      payoutId: created.payout!.id,
      adminUserId: fx.admin.id,
      role: "ADMIN",
      paymentReference: "MPESA-PAYOUT-001",
    });
    expect(paid.ok).toBe(true);
    if (!paid.ok) return;
    expect(paid.payout.status).toBe("PAID");
    expect(paid.payout.paidAt).not.toBeNull();
    expect(paid.payout.paymentReference).toBe("MPESA-PAYOUT-001");

    // Earnings became PAID; wallet moved available -> paid.
    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.available).toBe(0);
    expect(wallet.paid).toBe(54000);

    // Platform CREATOR_FEE rows for the paid earnings are now collected.
    const fees = await prisma.platformRevenue.findMany({
      where: { earningId: built.earning.id, type: "CREATOR_FEE" },
    });
    expect(fees.length).toBe(1);
    expect(fees[0].status).toBe("PAID");
    expect(fees[0].paymentReference).toBe("MPESA-PAYOUT-001");

    // Creator was notified.
    const notifications = await prisma.notification.findMany({
      where: { userId: fx.creatorAlpha.id, title: "Payout Paid" },
    });
    expect(notifications).toHaveLength(1);
  });

  it("blocks a second/concurrent markPayoutPaid (no double payout)", async () => {
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    const created = await createPayout(fx.creatorAlpha.creatorProfileId);
    await approvePayout(created.payout!.id, fx.admin.id);

    const results = await Promise.allSettled([
      markPayoutPaid({
        payoutId: created.payout!.id,
        adminUserId: fx.admin.id,
        role: "ADMIN",
      }),
      markPayoutPaid({
        payoutId: created.payout!.id,
        adminUserId: fx.admin.id,
        role: "ADMIN",
      }),
    ]);

    const ok = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok === true
    );
    const notOk = results.filter(
      (r) =>
        r.status === "fulfilled" &&
        r.value.ok === false &&
        r.value.code === "ALREADY_PAID"
    );
    expect(ok).toHaveLength(1);
    expect(notOk).toHaveLength(1);

    const notifications = await prisma.notification.findMany({
      where: { userId: fx.creatorAlpha.id, title: "Payout Paid" },
    });
    expect(notifications).toHaveLength(1);
  });

  it("refuses to pay a PENDING payout (must be approved first)", async () => {
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    const created = await createPayout(fx.creatorAlpha.creatorProfileId);

    const result = await markPayoutPaid({
      payoutId: created.payout!.id,
      adminUserId: fx.admin.id,
      role: "ADMIN",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_STATE");
  });

  it("never lets a payout exceed the available balance", async () => {
    // Add earnings until we cross the 50,000 threshold.
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });

    const created = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(created.payout!.amount).toBe(54000);

    const payout = await prisma.payout.findUniqueOrThrow({
      where: { id: created.payout!.id },
    });
    expect(payout.amount).toBeLessThanOrEqual(54000);
    expect(payout.amount).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Admin-only guard
  // -------------------------------------------------------------------------

  it("only lets an admin manage payouts (brands/creators get 403)", async () => {
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    const created = await createPayout(fx.creatorAlpha.creatorProfileId);
    const payoutId = created.payout!.id;

    // Library-level: a non-admin caller is FORBIDDEN.
    const asBrand = await markPayoutPaid({
      payoutId,
      adminUserId: fx.brandAlpha.id,
      role: "BRAND" as unknown as "ADMIN",
    });
    expect(asBrand.ok).toBe(false);
    if (!asBrand.ok) expect(asBrand.code).toBe("FORBIDDEN");

    // Route-level: brand cannot approve / reject / pay.
    await signInAs(fx.brandAlpha.id, "BRAND");
    const brandApprove = await callRoute(
      { PATCH: payoutStatusRoute },
      {
        method: "PATCH",
        url: `${URL}/payouts/${payoutId}/status`,
        params: { id: payoutId },
        body: { status: "APPROVE" },
      }
    );
    expect(brandApprove.status).toBe(403);

    // Route-level: creator cannot either.
    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const creatorPay = await callRoute(
      { PATCH: payoutStatusRoute },
      {
        method: "PATCH",
        url: `${URL}/payouts/${payoutId}/status`,
        params: { id: payoutId },
        body: { status: "PAID" },
      }
    );
    expect(creatorPay.status).toBe(403);

    // The payout is still untouched.
    const untouched = await prisma.payout.findUniqueOrThrow({
      where: { id: payoutId },
    });
    expect(untouched.status).toBe("PENDING");

    // Only an admin can approve AND pay.
    signOut();
    await signInAs(fx.admin.id, "ADMIN");
    const adminApprove = await callRoute(
      { PATCH: payoutStatusRoute },
      {
        method: "PATCH",
        url: `${URL}/payouts/${payoutId}/status`,
        params: { id: payoutId },
        body: { status: "APPROVE" },
      }
    );
    expect(adminApprove.status).toBe(200);

    const adminPay = await callRoute(
      { PATCH: payoutStatusRoute },
      {
        method: "PATCH",
        url: `${URL}/payouts/${payoutId}/status`,
        params: { id: payoutId },
        body: { status: "PAID", paymentReference: "REF-ADMIN-001" },
      }
    );
    expect(adminPay.status).toBe(200);
  });

  it("scopes the payout ledger by role via the API", async () => {
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await createPayout(fx.creatorAlpha.creatorProfileId);

    // Admin sees the payout.
    await signInAs(fx.admin.id, "ADMIN");
    const adminList = await callRoute(
      { GET: payoutsListRoute },
      { method: "GET", url: `${URL}/payouts` }
    );
    expect(adminList.status).toBe(200);
    const adminBody = await readJson(adminList);
    expect(adminBody.payouts.length).toBe(1);
    expect(adminBody.payouts[0].currentBalance).toBe(0);

    // Creator sees their own payout.
    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const creatorList = await callRoute(
      { GET: payoutsListRoute },
      { method: "GET", url: `${URL}/payouts` }
    );
    expect(creatorList.status).toBe(200);
    const creatorBody = await readJson(creatorList);
    expect(creatorBody.payouts.length).toBe(1);

    // Brand has no payout view.
    await signInAs(fx.brandAlpha.id, "BRAND");
    const brandList = await callRoute(
      { GET: payoutsListRoute },
      { method: "GET", url: `${URL}/payouts` }
    );
    expect(brandList.status).toBe(403);
  });

  it("enforces the threshold via the creator request API", async () => {
    await signInAs(fx.creatorAlpha.id, "CREATOR");

    // Below threshold -> 400.
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    const below = await callRoute(
      { POST: payoutsCreateRoute },
      { method: "POST", url: `${URL}/payouts`, body: {} }
    );
    expect(below.status).toBe(400);

    // Cross the threshold -> 201.
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    const created = await callRoute(
      { POST: payoutsCreateRoute },
      { method: "POST", url: `${URL}/payouts`, body: {} }
    );
    expect(created.status).toBe(201);

    // A brand cannot request a payout.
    await signInAs(fx.brandAlpha.id, "BRAND");
    const brandRequest = await callRoute(
      { POST: payoutsCreateRoute },
      { method: "POST", url: `${URL}/payouts`, body: {} }
    );
    expect(brandRequest.status).toBe(403);
  });

  it("only lets an admin read or change the payout settings", async () => {
    await signInAs(fx.brandAlpha.id, "BRAND");
    const brandGet = await callRoute(
      { GET: settingsGetRoute },
      { method: "GET", url: `${URL}/payouts/settings` }
    );
    expect(brandGet.status).toBe(403);
    const brandPatch = await callRoute(
      { PATCH: settingsPatchRoute },
      {
        method: "PATCH",
        url: `${URL}/payouts/settings`,
        body: { minimumPayoutAmount: 60000 },
      }
    );
    expect(brandPatch.status).toBe(403);

    await signInAs(fx.admin.id, "ADMIN");
    const adminGet = await callRoute(
      { GET: settingsGetRoute },
      { method: "GET", url: `${URL}/payouts/settings` }
    );
    expect(adminGet.status).toBe(200);
    const body = await readJson(adminGet);
    expect(body.settings.minimumPayoutAmount).toBe(50000);

    const adminPatch = await callRoute(
      { PATCH: settingsPatchRoute },
      {
        method: "PATCH",
        url: `${URL}/payouts/settings`,
        body: { minimumPayoutAmount: 60000, payoutDay: 5 },
      }
    );
    expect(adminPatch.status).toBe(200);
    const patched = await readJson(adminPatch);
    expect(patched.settings.minimumPayoutAmount).toBe(60000);
    expect(patched.settings.payoutDay).toBe(5);

    const invalidPatch = await callRoute(
      { PATCH: settingsPatchRoute },
      {
        method: "PATCH",
        url: `${URL}/payouts/settings`,
        body: { payoutDay: 40 },
      }
    );
    expect(invalidPatch.status).toBe(400);
  });

  it("scheduled generation via the admin API is admin-only", async () => {
    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const creatorGenerate = await callRoute(
      { POST: generateRoute },
      { method: "POST", url: `${URL}/payouts/generate` }
    );
    expect(creatorGenerate.status).toBe(403);

    // Admin can run it (no-op off the payout day unless today is the 25th).
    await signInAs(fx.admin.id, "ADMIN");
    const adminGenerate = await callRoute(
      { POST: generateRoute },
      { method: "POST", url: `${URL}/payouts/generate` }
    );
    expect(adminGenerate.status).toBe(200);
  });

  it("does not count earnings frozen into a payout as available", async () => {
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await buildAvailableEarning(fx, {
      creatorProfileId: fx.creatorAlpha.creatorProfileId,
      businessProfileId: fx.brandAlpha.businessProfileId,
      paymentRate: 30000,
    });
    await createPayout(fx.creatorAlpha.creatorProfileId);

    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.available).toBe(0);
    expect(wallet.processing).toBe(54000);
    // Frozen earnings are still lifetime earnings even though not withdrawable.
    expect(wallet.lifetime).toBe(54000);
  });
});