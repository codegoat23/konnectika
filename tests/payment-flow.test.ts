// tests/payment-flow.test.ts
//
// The earning lifecycle, exercised at the library level so every guard can be
// hit precisely. Settlement runs through the scheduled PAYOUT flow only — the
// Payment / Withdrawal sidebar no longer exists:
//   - earning / fee math and wallet totals (250,000 example)
//   - application approval creates exactly one PENDING earning
//   - content approval flips it to APPROVED (idempotent, one fee row)
//   - approving/creating a payment is impossible outside the payout flow
//   - content rejection means the earning can never be settled
//   - admin approval is the only settlement: APPROVED -> AVAILABLE
//   - the creator's PAID state only ever comes from a payout

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createEarningForApprovedApplication,
  approveContentForEarning,
  rejectContentForEarning,
  approveEarningAvailable,
} from "@/lib/payment-flow";
import { getCreatorWallet } from "@/lib/wallet";
import { createPayout, approvePayout, markPayoutPaid } from "@/lib/payout";
import {
  createFixture,
  signOut,
  createCampaign,
  createApplication,
  resetDb,
} from "./helpers";

describe("payment flow", () => {
  let fx: Awaited<ReturnType<typeof createFixture>>;

  beforeEach(async () => {
    await resetDb();
    fx = await createFixture();
  });

  afterEach(() => {
    signOut();
  });

  /** Build an APPROVED earning (application approved + content approved). */
  async function buildApprovedEarning(paymentRate = 250000) {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      paymentRate,
      budgetTotal: paymentRate * 20,
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
        paymentRate,
      })
    );

    const submission = await prisma.submission.create({
      data: {
        applicationId: application.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: campaign.id,
        screenshots: ["https://example.com/a.png"],
        postLinks: ["https://tiktok.com/@x/1"],
        status: "PENDING_REVIEW",
      },
    });

    const result = await prisma.$transaction((tx) =>
      approveContentForEarning(tx, {
        submissionId: submission.id,
        applicationId: application.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: campaign.id,
        paymentRate,
      })
    );

    const earning = await prisma.earning.findUniqueOrThrow({
      where: { applicationId: application.id },
    });

    return { campaign, application, earning, approval: result };
  }

  it("applies the 10% creator fee and tracks wallet totals through PAID (250,000 example)", async () => {
    const built = await buildApprovedEarning(250000);

    // Earning math: gross 250,000 -> platform fee 25,000 -> net 225,000.
    expect(built.earning.amount).toBe(250000);
    expect(built.earning.platformFee).toBe(25000);
    expect(built.earning.creatorAmount).toBe(225000);

    // Before the payout the net is parked as APPROVED.
    const walletBefore = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(walletBefore.approved).toBe(225000);
    expect(walletBefore.paid).toBe(0);
    expect(walletBefore.pending).toBe(0);

    // Money can only move through the payout flow — the admin first makes the
    // earning AVAILABLE, then it is pooled into a payout.
    await prisma.$transaction((tx) =>
      approveEarningAvailable(tx, built.earning.id)
    );
    const created = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(created.payout).toBeDefined();
    await approvePayout(created.payout!.id, fx.admin.id);
    const paid = await markPayoutPaid({
      payoutId: created.payout!.id,
      adminUserId: fx.admin.id,
      role: "ADMIN",
      paymentReference: "TXN-225000",
    });
    expect(paid.ok).toBe(true);

    const walletAfter = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(walletAfter.approved).toBe(0);
    expect(walletAfter.available).toBe(0);
    expect(walletAfter.paid).toBe(225000);
    expect(walletAfter.lifetime).toBe(225000);

    const earning = await prisma.earning.findUniqueOrThrow({
      where: { id: built.earning.id },
    });
    expect(earning.status).toBe("PAID");
    expect(earning.paidAt).not.toBeNull();

    const fee = await prisma.platformRevenue.findFirst({
      where: { earningId: built.earning.id, type: "CREATOR_FEE" },
    });
    expect(fee?.status).toBe("PAID");
  });

  it("never creates a Payment or Withdrawal row anywhere in the earning lifecycle", async () => {
    const built = await buildApprovedEarning(250000);

    const payoutCount = await prisma.payout.count({
      where: { creatorId: fx.creatorAlpha.creatorProfileId },
    });
    expect(payoutCount).toBe(0);

    // The schema has no Payment / Withdrawal models — approving content and
    // settling must never reference them (would be a compile error anyway).
    expect(built.earning.status).toBe("APPROVED");
    expect(built.earning.payoutId).toBeNull();
  });

  it("re-approving already-approved content is idempotent (one fee row, no state flip)", async () => {
    const built = await buildApprovedEarning(100000);

    const again = await prisma.$transaction((tx) =>
      approveContentForEarning(tx, {
        submissionId: built.earning.submissionId!,
        applicationId: built.application.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: built.campaign.id,
        paymentRate: 100000,
      })
    );
    expect(again.contentApproved).toBe(false);

    const fees = await prisma.platformRevenue.findMany({
      where: { earningId: built.earning.id, type: "CREATOR_FEE" },
    });
    expect(fees).toHaveLength(1);

    const earning = await prisma.earning.findUniqueOrThrow({
      where: { id: built.earning.id },
    });
    expect(earning.status).toBe("APPROVED");
  });

  it("never un-settles an AVAILABLE/frozen earning on re-approval", async () => {
    const built = await buildApprovedEarning(60000); // 60,000 gross -> 54,000 net
    // Admin makes the earning AVAILABLE, then it is frozen into a payout.
    await prisma.$transaction((tx) =>
      approveEarningAvailable(tx, built.earning.id)
    );
    const created = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(created.payout).toBeDefined();

    // Re-approving the same content must leave the frozen earning AVAILABLE.
    // Flipping it back to APPROVED would break the payout (markPayoutPaid only
    // pays AVAILABLE earnings).
    const again = await prisma.$transaction((tx) =>
      approveContentForEarning(tx, {
        submissionId: built.earning.submissionId!,
        applicationId: built.application.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: built.campaign.id,
        paymentRate: 60000,
      })
    );
    expect(again.contentApproved).toBe(false);

    const earning = await prisma.earning.findUniqueOrThrow({
      where: { id: built.earning.id },
    });
    expect(earning.status).toBe("AVAILABLE");
    expect(earning.payoutId).toBe(created.payout!.id);

    // And the payout can still be paid out in full afterwards.
    await approvePayout(created.payout!.id, fx.admin.id);
    const paid = await markPayoutPaid({
      payoutId: created.payout!.id,
      adminUserId: fx.admin.id,
      role: "ADMIN",
      paymentReference: "REF-SETTLE",
    });
    expect(paid.ok).toBe(true);
    if (paid.ok) expect(paid.payout.status).toBe("PAID");

    const final = await prisma.earning.findUniqueOrThrow({
      where: { id: built.earning.id },
    });
    expect(final.status).toBe("PAID");
  });

  it("refuses to approve content once the earning has been settled as PAID", async () => {
    const built = await buildApprovedEarning(50000);
    await prisma.earning.update({
      where: { id: built.earning.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    await expect(
      prisma.$transaction((tx) =>
        approveContentForEarning(tx, {
          submissionId: built.earning.submissionId!,
          applicationId: built.application.id,
          creatorId: fx.creatorAlpha.creatorProfileId,
          campaignId: built.campaign.id,
          paymentRate: 50000,
        })
      )
    ).rejects.toThrow(/already paid/i);
  });

  it("rejected content can never be settled", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      paymentRate: 50000,
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
        paymentRate: 50000,
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

    // Rejected earnings are excluded from wallet totals and can never roll
    // into a payout.
    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.lifetime).toBe(0);

    // Even an admin approval cannot settle a REJECTED earning.
    await expect(
      prisma.$transaction((tx) => approveEarningAvailable(tx, earning.id))
    ).rejects.toThrow(/only an APPROVED earning/i);
    const result = await createPayout(fx.creatorAlpha.creatorProfileId);
    expect(result.payout).toBeUndefined();
  });

  it("admin approval makes an APPROVED earning AVAILABLE", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      paymentRate: 100000,
      budgetTotal: 100000 * 20,
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
        screenshots: ["https://example.com/b.png"],
        postLinks: ["https://instagram.com/@x/2"],
        status: "PENDING_REVIEW",
      },
    });
    await prisma.$transaction((tx) =>
      approveContentForEarning(tx, {
        submissionId: submission.id,
        applicationId: application.id,
        creatorId: fx.creatorAlpha.creatorProfileId,
        campaignId: campaign.id,
        paymentRate: 100000,
      })
    );

    // APPROVED earnings do NOT settle on their own — the wallet balance stays 0.
    const before = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(before.available).toBe(0);
    expect(before.approved).toBe(90000);

    // Only the admin approval flips it to AVAILABLE.
    const earningBefore = await prisma.earning.findUniqueOrThrow({
      where: { applicationId: application.id },
    });
    await prisma.$transaction((tx) =>
      approveEarningAvailable(tx, earningBefore.id)
    );

    const earning = await prisma.earning.findUniqueOrThrow({
      where: { applicationId: application.id },
    });
    expect(earning.status).toBe("AVAILABLE");
    expect(earning.availableAt).not.toBeNull();

    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.approved).toBe(0);
    expect(wallet.available).toBe(90000); // 100,000 - 10% fee
  });
});