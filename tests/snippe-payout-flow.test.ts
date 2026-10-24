// tests/snippe-payout-flow.test.ts
//
// Outbound money: a creator's payout is transferred by Snippe.
//
// The rule under test: Konnectika never marks a payout PAID from its own
// request. `sendPayoutToSnippe` moves APPROVED -> PROCESSING and stops; only a
// signature-verified `payout.completed` webhook moves PROCESSING -> PAID.
//
// Covered:
//   - the real fee is quoted from GET /v1/payouts/fee and never hardcoded
//   - the fee is ABSORBED: the creator's receipt stays gross, and
//     total = amount + feeAmount
//   - the balance is preflighted before funds are reserved
//   - insufficient balance leaves the payout APPROVED and untouched
//   - a successful send records the provider reference and PROCESSING
//   - the webhook settles earnings + creator-fee revenue + audit proof
//   - duplicate completion webhooks apply once
//   - payout.failed returns the frozen earnings to the creator
//   - a payout below Snippe's minimum, with a bad number, or on a non-mobile
//     method is refused BEFORE any money moves
//   - sending is idempotent: a second send does not transfer again
//   - the webhook still settles when it beats our reference write-back

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  sendPayoutToSnippe,
  settleCompletedPayout,
  failPayout,
  approvePayout,
  createPayout,
  markPayoutPaid,
} from "@/lib/payout";
import { createEarningForApprovedApplication, approveContentForEarning, approveEarningAvailable } from "@/lib/payment-flow";
import { getCreatorWallet } from "@/lib/wallet";
import { signWebhookPayload, SNIPPE_MIN_PAYOUT } from "@/lib/snippe";
import { POST as webhookRoute } from "@/app/api/webhooks/snippe/route";
import { POST as sendRoute } from "@/app/api/payouts/[id]/send/route";
import {
  createFixture,
  signInAs,
  signOut,
  readJson,
  createCampaign,
  createApplication,
  resetDb,
} from "./helpers";

const SECRET = "test-webhook-secret";
const WEBHOOK_URL = "https://konnectika.test/api/webhooks/snippe";

function successEnvelope<T>(data: T) {
  return { status: "success", code: 0, data };
}

interface FetchCall {
  url: string;
  init: RequestInit | undefined;
}

function mockSnippeFetch(
  handler: (url: string, init: RequestInit | undefined) => unknown
) {
  const calls: FetchCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : String(input);
      calls.push({ url, init });
      return new Response(JSON.stringify(handler(url, init)), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    })
  );
  return calls;
}

/** Fee + balance + send, all quoted at 1% with a 1,000 TZS floor. */
function happyPath(reference = "po_ref_1") {
  return (url: string) => {
    if (url.includes("/v1/payouts/fee")) {
      return successEnvelope({
        amount: 225_000,
        fee_amount: 2_250,
        total_amount: 227_250,
        currency: "TZS",
      });
    }
    if (url.includes("/v1/payments/balance")) {
      return successEnvelope({
        available: { value: 10_000_000, currency: "TZS" },
        balance: { value: 10_000_000, currency: "TZS" },
      });
    }
    if (url.includes("/v1/payouts/send")) {
      return successEnvelope({
        reference,
        status: "pending",
        amount: { value: 225_000, currency: "TZS" },
        fees: { value: 2_250, currency: "TZS" },
        total: { value: 227_250, currency: "TZS" },
        channel: { type: "mobile", provider: "mpesa" },
        recipient: { name: "Creator Alpha", phone: "255712345678" },
      });
    }
    return successEnvelope({});
  };
}

async function deliverPayoutWebhook(
  type: string,
  data: Record<string, unknown>,
  opts: { signature?: string } = {}
) {
  const payload = { id: `evt_${type}_${Math.random().toString(36).slice(2, 8)}`, type, data };
  const rawBody = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000);
  const res = await webhookRoute(
    new Request(WEBHOOK_URL, {
      method: "POST",
      body: rawBody,
      headers: {
        "content-type": "application/json",
        "x-webhook-timestamp": String(ts),
        "x-webhook-signature":
          opts.signature ?? signWebhookPayload(rawBody, ts, SECRET),
      },
    })
  );
  return { res, json: await res.json().catch(() => ({})) };
}

describe("snippe outbound payout flow", () => {
  let fx: Awaited<ReturnType<typeof createFixture>>;

  beforeEach(async () => {
    await resetDb();
    fx = await createFixture();
    process.env.SNIPPE_API_KEY = "sk_test_key";
    process.env.SNIPPE_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.SNIPPE_API_KEY;
    delete process.env.SNIPPE_WEBHOOK_SECRET;
    signOut();
  });

  /**
   * Build an APPROVED, APPROVED-for-payout state: an AVAILABLE earning of
   * paymentRate (net 225,000 at the default 10% creator fee), pooled into an
   * admin-approved payout for a mobile money creator.
   */
  async function approvedPayout(
    opts: {
      paymentRate?: number;
      method?: string;
      phone?: string | null;
    } = {}
  ) {
    const paymentRate = opts.paymentRate ?? 250_000;
    const method = opts.method ?? "M-PESA";

    await prisma.payoutAccount.upsert({
      where: { creatorId: fx.creatorAlpha.creatorProfileId },
      create: {
        creatorId: fx.creatorAlpha.creatorProfileId,
        method,
        phone: opts.phone === undefined ? "0712345678" : opts.phone,
        accountName: "Creator Alpha",
      },
      update: {},
    });

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
        screenshots: ["https://example.com/snippe.png"],
        postLinks: ["https://tiktok.com/@x/snippe"],
        status: "PENDING_REVIEW",
      },
    });
    await prisma.$transaction((tx) =>
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
    await prisma.$transaction((tx) => approveEarningAvailable(tx, earning.id));

    const created = await createPayout(fx.creatorAlpha.creatorProfileId);
    const payoutId = created.payout!.id;
    await approvePayout(payoutId, fx.admin.id);

    const payout = await prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
    return { payout, earningId: earning.id, campaignId: campaign.id };
  }

  // -------------------------------------------------------------------------
  // Quoting the real fee
  // -------------------------------------------------------------------------

  it("quotes the real fee from Snippe and absorbs it (creator receives gross)", async () => {
    const { payout } = await approvedPayout();
    const calls = mockSnippeFetch(happyPath());

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // The fee came from the provider, not from a constant in our code.
    expect(calls.some((c) => c.url.includes("/v1/payouts/fee"))).toBe(true);
    expect(result.fee.fee_amount).toBe(2_250);
    expect(result.fee.total_amount).toBe(227_250);

    const after = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    // amount stays the creator's receipt...
    expect(after.amount).toBe(225_000);
    // ...the fee is recorded separately...
    expect(after.feeAmount).toBe(2_250);
    // ...and total = amount + fee.
    expect(after.totalAmount).toBe(after.amount! + after.feeAmount!);
    // The creator is not charged the fee; Konnectika is.
    expect(after.amount).toBe(225_000);
  });

  it("asks Snippe to transfer the gross, not the gross-plus-fee", async () => {
    const { payout } = await approvedPayout();
    const calls = mockSnippeFetch(happyPath());

    await sendPayoutToSnippe(payout.id, WEBHOOK_URL);

    const send = calls.find((c) => c.url.includes("/v1/payouts/send"));
    expect(send).toBeDefined();
    const body = JSON.parse(String(send!.init?.body));
    expect(body.amount).toBe(225_000);
    expect(body.channel).toBe("mobile");
    expect(body.recipient_phone).toBe("255712345678");
    expect(body.webhook_url).toBe(WEBHOOK_URL);
  });

  it("preflights the balance and refuses without reserving anything", async () => {
    const { payout } = await approvedPayout();
    mockSnippeFetch((url) => {
      if (url.includes("/v1/payments/balance")) {
        return successEnvelope({
          available: { value: 100_000, currency: "TZS" },
          balance: { value: 100_000, currency: "TZS" },
        });
      }
      return happyPath()(url);
    });

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INSUFFICIENT_BALANCE");
    // The message quotes the real numbers the admin needs.
    expect(result.error).toMatch(/100,000/);
    expect(result.error).toMatch(/227,250/);

    // Nothing moved: still APPROVED, no reference, earnings still frozen.
    const after = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(after.status).toBe("APPROVED");
    expect(after.providerReference).toBeNull();
    // No fee was recorded — nothing was quoted for a payout that never ran.
    expect(after.feeAmount ?? 0).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Send + PROCESSING
  // -------------------------------------------------------------------------

  it("records the provider reference and stops at PROCESSING, never PAID", async () => {
    const { payout } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_pending"));

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(true);

    const after = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(after.status).toBe("PROCESSING");
    expect(after.provider).toBe("snippe");
    expect(after.providerReference).toBe("po_ref_pending");
    expect(after.sentAt).not.toBeNull();
    expect(after.paidAt).toBeNull();

    // The creator has NOT been credited yet.
    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.paid).toBe(0);
    expect(wallet.available).toBe(0);
  });

  it("does not send a payout that is not APPROVED", async () => {
    const { payout } = await approvedPayout();
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: "PENDING" },
    });
    const calls = mockSnippeFetch(happyPath());

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_STATE");
    // Not even a fee quote was requested.
    expect(calls.length).toBe(0);
  });

  it("refuses a second send of the same payout", async () => {
    const { payout } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_once"));
    await sendPayoutToSnippe(payout.id, WEBHOOK_URL);

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_STATE");
    // Reported as "not approved" because it is already PROCESSING.
    expect(result.error).toMatch(/approved/i);
    expect(result.error).toMatch(/PROCESSING/);
  });

  it("refuses a payout below Snippe's minimum before contacting the provider", async () => {
    // Our own 50,000 floor would mask the provider's 5,000 one, so lower it.
    await prisma.platformSetting.upsert({
      where: { key: "payout.minimumAmount" },
      create: { key: "payout.minimumAmount", value: "1000" },
      update: { value: "1000" },
    });
    const { payout } = await approvedPayout({ paymentRate: 6_000 });
    await prisma.payout.update({
      where: { id: payout.id },
      data: { amount: SNIPPE_MIN_PAYOUT - 1 },
    });
    const calls = mockSnippeFetch(happyPath());

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("BELOW_MINIMUM");
    expect(calls.length).toBe(0);
  });

  it("refuses a creator with no usable mobile money number", async () => {
    const { payout } = await approvedPayout({ phone: "not-a-number" });
    const calls = mockSnippeFetch(happyPath());

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NO_DESTINATION");
    expect(calls.length).toBe(0);
  });

  it("refuses a non-mobile payout method (bank transfer stays manual)", async () => {
    const { payout } = await approvedPayout({ method: "CRDB Bank" });
    const calls = mockSnippeFetch(happyPath());

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("UNSUPPORTED_METHOD");
    expect(result.error).toMatch(/mobile money only/i);
    expect(calls.length).toBe(0);
  });

  it("releases the claim and returns to APPROVED when Snippe refuses the send", async () => {
    const { payout } = await approvedPayout();
    mockSnippeFetch((url) => {
      if (url.includes("/v1/payouts/send")) {
        throw new Error("Could not reach Snippe: connection reset");
      }
      return happyPath()(url);
    });

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("PROVIDER_ERROR");

    // No money is in flight, so an admin must be able to simply retry.
    const after = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(after.status).toBe("APPROVED");
    expect(after.providerReference).toBeNull();
    expect(after.failureReason).toMatch(/connection reset/i);

    // And the retry works.
    mockSnippeFetch(happyPath("po_ref_retry_ok"));
    const retry = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(retry.ok).toBe(true);
    expect(
      (await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } })).status
    ).toBe("PROCESSING");
  });

  // -------------------------------------------------------------------------
  // Webhook settlement
  // -------------------------------------------------------------------------

  it("settles earnings, creator-fee revenue and an audit proof on payout.completed", async () => {
    const { payout, earningId } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_done"));
    await sendPayoutToSnippe(payout.id, WEBHOOK_URL);

    const { res, json } = await deliverPayoutWebhook("payout.completed", {
      reference: "po_ref_done",
      status: "completed",
      amount: { value: 225_000, currency: "TZS" },
      fees: { value: 2_250, currency: "TZS" },
      total: { value: 227_250, currency: "TZS" },
      metadata: { payoutId: payout.id },
    });
    expect(res.status).toBe(200);
    expect(json.applied).toBe(true);

    const settled = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(settled.status).toBe("PAID");
    expect(settled.paidAt).not.toBeNull();

    // Earnings that were frozen into the payout are now paid.
    expect(
      (await prisma.earning.findUniqueOrThrow({ where: { id: earningId } })).status
    ).toBe("PAID");

    // Creator-fee revenue settles with the payout it was deducted from.
    const fee = await prisma.platformRevenue.findFirstOrThrow({
      where: { earningId, type: "CREATOR_FEE" },
    });
    expect(fee.status).toBe("PAID");

    // Automated, provider-tagged audit row — no admin typed a reference.
    const proof = await prisma.paymentProof.findFirstOrThrow({
      where: { payoutId: payout.id },
    });
    expect(proof.status).toBe("VERIFIED");
    expect(proof.provider).toBe("snippe");
    expect(proof.submittedById).toBeNull();
    expect(proof.amount).toBe(225_000);

    // Wallet reflects the delivery exactly once.
    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.paid).toBe(225_000);
    expect(wallet.available).toBe(0);
  });

  it("applies a duplicate completion exactly once", async () => {
    const { payout, earningId } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_dupe"));
    await sendPayoutToSnippe(payout.id, WEBHOOK_URL);

    const event = {
      reference: "po_ref_dupe",
      status: "completed",
      amount: { value: 225_000, currency: "TZS" },
      metadata: { payoutId: payout.id },
    };
    const first = await deliverPayoutWebhook("payout.completed", event);
    expect(first.json.applied).toBe(true);
    const second = await deliverPayoutWebhook("payout.completed", event);
    expect(second.json.applied).toBe(false);

    expect(await prisma.paymentProof.count({ where: { payoutId: payout.id } })).toBe(1);
    expect(
      (await prisma.earning.findUniqueOrThrow({ where: { id: earningId } })).status
    ).toBe("PAID");
    expect(
      (await prisma.notification.count({
        where: { userId: fx.creatorAlpha.id, title: "Payout Paid" },
      }))
    ).toBe(1);
  });

  it("rejects a completion webhook with an invalid signature", async () => {
    const { payout } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_sig"));
    await sendPayoutToSnippe(payout.id, WEBHOOK_URL);

    const { res } = await deliverPayoutWebhook(
      "payout.completed",
      {
        reference: "po_ref_sig",
        status: "completed",
        amount: { value: 225_000, currency: "TZS" },
        metadata: { payoutId: payout.id },
      },
      { signature: "00".repeat(32) }
    );

    expect(res.status).toBe(400);
    expect(
      (await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } })).status
    ).toBe("PROCESSING");
  });

  it("still settles when the webhook beats our reference write-back", async () => {
    const { payout, earningId } = await approvedPayout();
    // Snippe answers the send, then the webhook lands before we attach the
    // reference — the metadata fallback has to carry the settlement.
    const calls = mockSnippeFetch((url) => {
      if (url.includes("/v1/payouts/send")) {
        // Deliver the completion from inside the send call, before the
        // reference write-back can happen.
        void deliverPayoutWebhook("payout.completed", {
          reference: "po_ref_race",
          status: "completed",
          amount: { value: 225_000, currency: "TZS" },
          metadata: { payoutId: payout.id },
        });
        return successEnvelope({
          reference: "po_ref_race",
          status: "pending",
          amount: { value: 225_000, currency: "TZS" },
          fees: { value: 2_250, currency: "TZS" },
          total: { value: 227_250, currency: "TZS" },
        });
      }
      return happyPath()(url);
    });

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(true);
    expect(calls.length).toBeGreaterThan(0);

    // Give the in-flight webhook a tick to land.
    await new Promise((r) => setTimeout(r, 50));

    const settled = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(settled.status).toBe("PAID");
    expect(
      (await prisma.earning.findUniqueOrThrow({ where: { id: earningId } })).status
    ).toBe("PAID");
  });

  it("returns the frozen earnings to the creator on payout.failed", async () => {
    const { payout, earningId } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_fail"));
    await sendPayoutToSnippe(payout.id, WEBHOOK_URL);

    const { json } = await deliverPayoutWebhook("payout.failed", {
      reference: "po_ref_fail",
      status: "failed",
      failure_reason: "Recipient number is not registered.",
      metadata: { payoutId: payout.id },
    });
    expect(json.applied).toBe(true);

    const failed = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(failed.status).toBe("FAILED");
    expect(failed.failureReason).toMatch(/not registered/i);

    // The money never left, so the earning is unfrozen and can be paid again.
    const earning = await prisma.earning.findUniqueOrThrow({ where: { id: earningId } });
    expect(earning.status).toBe("AVAILABLE");
    expect(earning.payoutId).toBeNull();

    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.available).toBe(225_000);
    expect(wallet.paid).toBe(0);
  });

  it("treats a reversal like a failure", async () => {
    const { payout, earningId } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_rev"));
    await sendPayoutToSnippe(payout.id, WEBHOOK_URL);

    const { json } = await deliverPayoutWebhook("payout.reversed", {
      reference: "po_ref_rev",
      status: "reversed",
      failure_reason: "Reversed by the provider.",
      metadata: { payoutId: payout.id },
    });
    expect(json.applied).toBe(true);
    expect(
      (await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } })).status
    ).toBe("FAILED");
    expect(
      (await prisma.earning.findUniqueOrThrow({ where: { id: earningId } })).payoutId
    ).toBeNull();
  });

  it("reverses an already PAID payout and returns earnings to AVAILABLE", async () => {
    const { payout, earningId } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_rev_paid"));
    await sendPayoutToSnippe(payout.id, WEBHOOK_URL);

    // First, complete the payout
    await deliverPayoutWebhook("payout.completed", {
      reference: "po_ref_rev_paid",
      status: "completed",
      amount: { value: 225_000, currency: "TZS" },
      metadata: { payoutId: payout.id },
    });
    expect((await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } })).status).toBe("PAID");
    expect((await prisma.earning.findUniqueOrThrow({ where: { id: earningId } })).status).toBe("PAID");

    // Later, the provider sends a reversal
    const { json } = await deliverPayoutWebhook("payout.reversed", {
      reference: "po_ref_rev_paid",
      status: "reversed",
      failure_reason: "Reversed by upstream operator.",
      metadata: { payoutId: payout.id },
    });
    expect(json.applied).toBe(true);
    expect((await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } })).status).toBe("FAILED");
    const earning = await prisma.earning.findUniqueOrThrow({ where: { id: earningId } });
    expect(earning.status).toBe("AVAILABLE");
    expect(earning.payoutId).toBeNull();
    expect(earning.paidAt).toBeNull();

    const wallet = await getCreatorWallet(fx.creatorAlpha.creatorProfileId);
    expect(wallet.available).toBe(225_000);
    expect(wallet.paid).toBe(0);
  });

  it("guards against double-pay on timeout by keeping status in PROCESSING", async () => {
    const { payout } = await approvedPayout();
    mockSnippeFetch((url) => {
      if (url.includes("/v1/payouts/send")) {
        throw new Error("Request timed out connecting to Snippe");
      }
      return happyPath()(url);
    });

    const result = await sendPayoutToSnippe(payout.id, WEBHOOK_URL);
    expect(result.ok).toBe(false);
    if (result.ok) return; // narrow type
    expect(result.code).toBe("PROVIDER_ERROR");

    // Status MUST remain PROCESSING to prevent an admin from double-paying
    const after = await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    expect(after.status).toBe("PROCESSING");
    expect(after.failureReason).toMatch(/timed out/i);
  });

  // -------------------------------------------------------------------------
  // Send route access control
  // -------------------------------------------------------------------------

  it("only lets an admin (or cron secret) trigger a send", async () => {
    const { payout } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_acl"));

    // A creator cannot send their own payout.
    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const asCreator = await sendRoute(
      new Request(`https://konnectika.test/api/payouts/${payout.id}/send`, {
        method: "POST",
      }),
      { params: Promise.resolve({ id: payout.id }) }
    );
    expect(asCreator.status).toBe(403);

    // A brand cannot either.
    await signInAs(fx.brandAlpha.id, "BRAND");
    const asBrand = await sendRoute(
      new Request(`https://konnectika.test/api/payouts/${payout.id}/send`, {
        method: "POST",
      }),
      { params: Promise.resolve({ id: payout.id }) }
    );
    expect(asBrand.status).toBe(403);

    // An admin can.
    await signInAs(fx.admin.id, "ADMIN");
    const asAdmin = await sendRoute(
      new Request(`https://konnectika.test/api/payouts/${payout.id}/send`, {
        method: "POST",
      }),
      { params: Promise.resolve({ id: payout.id }) }
    );
    expect(asAdmin.status).toBe(202);
    expect((await readJson(asAdmin)).status).toBe("PROCESSING");
  });

  it("accepts the cron secret and refuses a wrong one", async () => {
    const { payout } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_cron"));
    process.env.CRON_SECRET = "cron-secret-value";
    signOut();

    const post = (auth?: string) =>
      sendRoute(
        new Request(`https://konnectika.test/api/payouts/${payout.id}/send`, {
          method: "POST",
          headers: auth ? { authorization: auth } : undefined,
        }),
        { params: Promise.resolve({ id: payout.id }) }
      );

    expect((await post()).status).toBe(401);
    expect((await post("Bearer wrong")).status).toBe(401);

    const ok = await post("Bearer cron-secret-value");
    expect(ok.status).toBe(202);
    expect((await readJson(ok)).via).toBe("cron");

    delete process.env.CRON_SECRET;
  });

  it("returns 404 for a payout that does not exist", async () => {
    mockSnippeFetch(happyPath());
    await signInAs(fx.admin.id, "ADMIN");

    const res = await sendRoute(
      new Request("https://konnectika.test/api/payouts/nope/send", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "nope" }) }
    );
    expect(res.status).toBe(404);
  });

  it("cannot be manually marked paid once it has been sent to Snippe", async () => {
    const { payout } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_nomanual"));
    await sendPayoutToSnippe(payout.id, WEBHOOK_URL);

    // The payout is PROCESSING, not APPROVED, so the manual settlement path is
    // closed. Only the webhook can finish it — that is the whole point.
    const result = await markPayoutPaid({
      payoutId: payout.id,
      adminUserId: fx.admin.id,
      role: "ADMIN",
      paymentReference: "MANUAL-123",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_STATE");

    expect(
      (await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } })).status
    ).toBe("PROCESSING");
  });

  it("cannot be manually marked paid by a non-admin", async () => {
    const { payout } = await approvedPayout();

    const result = await markPayoutPaid({
      payoutId: payout.id,
      adminUserId: fx.creatorAlpha.id,
      role: "CREATOR" as "ADMIN",
      paymentReference: "NOPE",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("FORBIDDEN");
    expect(
      (await prisma.payout.findUniqueOrThrow({ where: { id: payout.id } })).status
    ).toBe("APPROVED");
  });

  it("reports NOT_FOUND for a reference we never issued", async () => {
    const result = await settleCompletedPayout("po_does_not_exist");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("NOT_FOUND");

    const failed = await failPayout("po_does_not_exist", "nope");
    expect(failed.ok).toBe(false);
  });

  it("does not create a second payout when an APPROVED payout is failed twice", async () => {
    const { payout, earningId } = await approvedPayout();
    mockSnippeFetch(happyPath("po_ref_twice"));
    await sendPayoutToSnippe(payout.id, WEBHOOK_URL);

    const event = {
      reference: "po_ref_twice",
      status: "failed",
      failure_reason: "Timeout",
      metadata: { payoutId: payout.id },
    };
    expect((await deliverPayoutWebhook("payout.failed", event)).json.applied).toBe(true);
    expect((await deliverPayoutWebhook("payout.failed", event)).json.applied).toBe(false);

    // Still one unfreeze, and the payout count is unchanged.
    expect(
      (await prisma.earning.findUniqueOrThrow({ where: { id: earningId } })).payoutId
    ).toBeNull();
    expect(
      await prisma.payout.count({ where: { creatorId: fx.creatorAlpha.creatorProfileId } })
    ).toBe(1);
  });
});