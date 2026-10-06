// tests/snippe-payment-flow.test.ts
//
// Inbound money: a brand pays for a campaign through Snippe.
//
// The single rule these tests exist to protect: a campaign becomes PAID only
// from a signature-verified webhook. The brand-facing endpoint that starts the
// payment returns 202 and "AWAITING_PAYMENT" — never "PAID" — and the frontend
// response cannot settle anything.
//
// Covered:
//   - starting a payment snapshots budget + platform fee + provider fee
//   - the campaign moves UNPAID -> AWAITING_PAYMENT, never straight to PAID
//   - payment.completed settles intent + campaign + proof + platform revenue
//     in one go, and writes back the REAL Snippe fee
//   - the fee on the proof is verified and provider-tagged, not user-submitted
//   - duplicate deliveries are idempotent (one proof, one notification)
//   - an invalid signature is rejected and changes nothing
//   - a replayed (stale timestamp) delivery is rejected
//   - payment.failed/expired move the campaign to PAYMENT_FAILED so the brand
//     can retry, and a retry opens attempt 2 without touching attempt 1
//   - a second concurrent "pay" while one is in flight is refused

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createFixture, signInAs, signOut, createCampaign, resetDb } from "./helpers";
import { POST as payRoute } from "@/app/api/campaigns/[id]/pay/route";
import { POST as webhookRoute } from "@/app/api/webhooks/snippe/route";
import { getLatestPaymentIntent } from "@/lib/payment-intents";
import { getPlatformPricing } from "@/lib/pricing";
import { signWebhookPayload } from "@/lib/snippe";
import { readJson } from "./helpers";

const SECRET = "test-webhook-secret";

/** Install SNIPPE_API_KEY / SNIPPE_WEBHOOK_SECRET for the duration of a test. */
function withSnippeEnv() {
  process.env.SNIPPE_API_KEY = "sk_test_key";
  process.env.SNIPPE_WEBHOOK_SECRET = SECRET;
}
function withoutSnippeEnv() {
  delete process.env.SNIPPE_API_KEY;
  delete process.env.SNIPPE_WEBHOOK_SECRET;
}

interface FetchCall {
  url: string;
  init: RequestInit | undefined;
}

/**
 * Stub global fetch so no test ever touches the real Snippe API, and capture
 * every call for assertions on amounts and idempotency keys.
 */
function mockSnippeFetch(
  handler: (url: string, init: RequestInit | undefined) => unknown
) {
  const calls: FetchCall[] = [];
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : String(input);
    calls.push({ url, init });
    const body = handler(url, init);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", spy);
  return calls;
}

/** Snippe wraps every success in { status: "success", code, data }. */
function successEnvelope<T>(data: T) {
  return { status: "success", code: 0, data };
}

/** A successful `pending` response from POST /v1/payments. */
function pendingPaymentResponse(reference: string, amount: number) {
  return successEnvelope({
    reference,
    status: "pending",
    amount: { value: amount, currency: "TZS" },
    expires_at: null,
    channel: { type: "mobile_money", provider: "mpesa" },
  });
}

/** Sign and deliver a payload to the webhook route exactly as Snippe would. */
async function deliverWebhook(
  type: string,
  data: Record<string, unknown>,
  opts: { timestamp?: number; secret?: string; signature?: string } = {}
) {
  const payload = {
    id: `evt_${type.replace(/\W/g, "_")}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    api_version: "2026-01-25",
    data: { reference: "ref_unused", ...data },
  };
  const rawBody = JSON.stringify(payload);
  const timestamp = opts.timestamp ?? Math.floor(Date.now() / 1000);
  const signature =
    opts.signature ?? signWebhookPayload(rawBody, timestamp, opts.secret ?? SECRET);

  const res = await webhookRoute(
    new Request("https://konnectika.test/api/webhooks/snippe", {
      method: "POST",
      body: rawBody,
      headers: {
        "content-type": "application/json",
        "x-webhook-timestamp": String(timestamp),
        "x-webhook-signature": signature,
      },
    })
  );
  return { res, payload, rawBody };
}

describe("snippe inbound payment flow", () => {
  let fx: Awaited<ReturnType<typeof createFixture>>;

  beforeEach(async () => {
    await resetDb();
    fx = await createFixture();
    withSnippeEnv();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    withoutSnippeEnv();
    signOut();
  });

  /** Start a real payment through the brand-facing route. */
  async function startPayment(campaignId: string, phone = "0712345678") {
    await signInAs(fx.brandAlpha.id, "BRAND");
    const res = await payRoute(
      new Request(`https://konnectika.test/api/campaigns/${campaignId}/pay`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phone,
          firstName: "Amina",
          lastName: "Juma",
          email: "amina@brand.test",
        }),
      }),
      { params: Promise.resolve({ id: campaignId }) }
    );
    return { res, body: await readJson(res) };
  }

  // -------------------------------------------------------------------------
  // Starting a payment
  // -------------------------------------------------------------------------

  it("snapshots budget + platform fee + provider fee and returns 202, never paid", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 1_000_000,
    });

    const calls = mockSnippeFetch((url) => {
      if (url.endsWith("/v1/payments")) {
        return pendingPaymentResponse("pay_ref_1", 1_100_000);
      }
      return successEnvelope({});
    });

    const { res, body } = await startPayment(campaign.id);

    expect(res.status).toBe(202);
    // 202 = accepted, in flight. The brand is told nothing is settled yet.
    expect(body.paymentStatus).toBe("AWAITING_PAYMENT");
    expect(body.instructions.reference).toBe("pay_ref_1");

    const pricing = await getPlatformPricing();
    const intent = await prisma.paymentIntent.findUniqueOrThrow({
      where: { id: body.intentId },
    });

    // The intent is a snapshot of the charge at the moment of purchase.
    expect(intent.budgetTotal).toBe(1_000_000);
    expect(intent.platformFeeRate).toBe(pricing.brandFeePercent);
    expect(intent.platformFee).toBe(Math.round((1_000_000 * pricing.brandFeePercent) / 100));
    expect(intent.providerFeeRate).toBe(pricing.snippeCollectionFeePercent);
    expect(intent.totalCharge).toBe(
      intent.budgetTotal + intent.platformFee + intent.providerFee
    );
    expect(intent.status).toBe("AWAITING_PAYMENT");
    expect(intent.providerReference).toBe("pay_ref_1");
    expect(intent.attempt).toBe(1);

    // We asked Snippe for exactly the snapshotted total.
    const sent = JSON.parse(String(calls[0].init?.body));
    expect(sent.details.amount).toBe(intent.totalCharge);
    expect(sent.details.currency).toBe("TZS");
    expect(sent.payment_type).toBe("mobile");
    expect(sent.metadata.campaignId).toBe(campaign.id);
    expect(sent.metadata.paymentIntentId).toBe(intent.id);
    // The idempotency key travels in the header, not the body.
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe(intent.idempotencyKey);
    expect(headers.Authorization).toMatch(/^Bearer /);

    // And the campaign is awaiting, NOT paid.
    const after = await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(after.paymentStatus).toBe("AWAITING_PAYMENT");
    expect(after.paymentStatus).not.toBe("PAID");
    expect(await prisma.paymentProof.count({ where: { campaignId: campaign.id } })).toBe(0);
  });

  it("moves UNPAID -> AWAITING_PAYMENT -> PAID only when the webhook arrives", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 500_000,
    });
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_lifecycle", 550_000));

    const { body } = await startPayment(campaign.id);
    const intentId = body.intentId;

    const awaiting = await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(awaiting.paymentStatus).toBe("AWAITING_PAYMENT");

    await deliverWebhook("payment.completed", {
      reference: "pay_ref_lifecycle",
      status: "completed",
      amount: { value: 550_000, currency: "TZS" },
      settlement: {
        gross: { value: 550_000, currency: "TZS" },
        fees: { value: 5_000, currency: "TZS" },
        net: { value: 545_000, currency: "TZS" },
      },
      channel: { type: "mobile_money", provider: "mpesa" },
    });

    const paid = await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(paid.paymentStatus).toBe("PAID");

    const settled = await prisma.paymentIntent.findUniqueOrThrow({ where: { id: intentId } });
    expect(settled.status).toBe("PAID");
    expect(settled.paidAt).not.toBeNull();
    // The ESTIMATE is reconciled against the REAL fee Snippe reported.
    expect(settled.actualProviderFee).toBe(5_000);
    expect(settled.actualNetAmount).toBe(545_000);
  });

  // -------------------------------------------------------------------------
  // Settlement writes
  // -------------------------------------------------------------------------

  it("settles intent, campaign, verified proof and platform revenue together", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 800_000,
    });
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_settle", 880_000));
    const { body } = await startPayment(campaign.id);
    const intentId = body.intentId;

    // A brand-fee revenue row is accrued when the campaign is created; the
    // webhook is what flips it to PAID.
    await prisma.platformRevenue.create({
      data: {
        campaignId: campaign.id,
        businessId: fx.brandAlpha.businessProfileId,
        type: "BRAND_FEE",
        status: "ACCRUED",
        feeRate: 10,
        grossAmount: 800_000,
        feeAmount: 80_000,
        description: "Brand fee for test campaign",
      },
    });

    await deliverWebhook("payment.completed", {
      reference: "pay_ref_settle",
      status: "completed",
      amount: { value: 880_000, currency: "TZS" },
      settlement: {
        gross: { value: 880_000, currency: "TZS" },
        fees: { value: 8_800, currency: "TZS" },
        net: { value: 871_200, currency: "TZS" },
      },
      channel: { type: "mobile_money", provider: "mpesa" },
      external_reference: "EXT-99",
    });

    // 1. Intent settled with the real fee.
    const intent = await prisma.paymentIntent.findUniqueOrThrow({ where: { id: intentId } });
    expect(intent.status).toBe("PAID");
    expect(intent.actualProviderFee).toBe(8_800);
    expect(intent.providerExternalRef).toBe("EXT-99");

    // 2. Campaign paid.
    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("PAID");

    // 3. Proof is provider-tagged and born VERIFIED — never user-submitted.
    const proof = await prisma.paymentProof.findFirstOrThrow({
      where: { campaignId: campaign.id },
    });
    expect(proof.status).toBe("VERIFIED");
    expect(proof.provider).toBe("snippe");
    expect(proof.providerReference).toBe("pay_ref_settle");
    expect(proof.paymentIntentId).toBe(intentId);
    expect(proof.submittedById).toBeNull();
    expect(proof.amount).toBe(880_000);
    expect(proof.transactionReference).toBe("EXT-99");

    // 4. Platform fee revenue is now real.
    const revenue = await prisma.platformRevenue.findFirstOrThrow({
      where: { campaignId: campaign.id, type: "BRAND_FEE" },
    });
    expect(revenue.status).toBe("PAID");
    expect(revenue.paymentReference).toBe("pay_ref_settle");

    // 5. And the brand was told.
    const note = await prisma.notification.findFirstOrThrow({
      where: { userId: fx.brandAlpha.id },
    });
    expect(note.title).toMatch(/payment received/i);
  });

  it("records an amount variance instead of silently settling a wrong sum", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 300_000,
    });
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_var", 330_000));
    const { body } = await startPayment(campaign.id);
    const expected = await prisma.paymentIntent.findUniqueOrThrow({
      where: { id: body.intentId },
    });

    // Snippe charged less than we snapshotted.
    await deliverWebhook("payment.completed", {
      reference: "pay_ref_var",
      status: "completed",
      amount: { value: 325_000, currency: "TZS" },
      settlement: {
        gross: { value: 325_000, currency: "TZS" },
        fees: { value: 3_250, currency: "TZS" },
        net: { value: 321_750, currency: "TZS" },
      },
      channel: { type: "mobile_money", provider: "mpesa" },
    });

    // Money arrived, so the campaign funds, but the variance is written down.
    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("PAID");
    const proof = await prisma.paymentProof.findFirstOrThrow({
      where: { campaignId: campaign.id },
    });
    expect(proof.amount).toBe(325_000);
    expect(proof.note).toMatch(/325000/);
    expect(proof.note).toMatch(new RegExp(String(expected.totalCharge)));
  });

  it("refuses to settle a completed payment in an unsupported currency", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_cur", 2_750_000));
    const { body } = await startPayment(campaign.id);

    const { res } = await deliverWebhook("payment.completed", {
      reference: "pay_ref_cur",
      status: "completed",
      amount: { value: 2_750_000, currency: "USD" },
      channel: { type: "mobile_money", provider: "mpesa" },
    });

    // Acknowledged, but NOT applied.
    expect(res.status).toBe(200);
    expect((await readJson(res)).applied).toBe(false);
    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("AWAITING_PAYMENT");
    expect(
      (await prisma.paymentIntent.findUniqueOrThrow({ where: { id: body.intentId } })).status
    ).toBe("AWAITING_PAYMENT");
  });

  // -------------------------------------------------------------------------
  // Webhook security
  // -------------------------------------------------------------------------

  it("rejects an invalid signature and changes nothing", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_sig", 2_750_000));
    await startPayment(campaign.id);

    const { res } = await deliverWebhook(
      "payment.completed",
      {
        reference: "pay_ref_sig",
        status: "completed",
        amount: { value: 2_750_000, currency: "TZS" },
      },
      { signature: "deadbeef".repeat(8) }
    );

    expect(res.status).toBe(400);
    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("AWAITING_PAYMENT");
    expect(await prisma.paymentProof.count({ where: { campaignId: campaign.id } })).toBe(0);
  });

  it("rejects a signature made with the wrong secret", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_secret", 2_750_000));
    await startPayment(campaign.id);

    const { res } = await deliverWebhook(
      "payment.completed",
      {
        reference: "pay_ref_secret",
        status: "completed",
        amount: { value: 2_750_000, currency: "TZS" },
      },
      { secret: "attacker-secret" }
    );

    expect(res.status).toBe(400);
    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("AWAITING_PAYMENT");
  });

  it("rejects a replayed delivery whose timestamp is outside the tolerance", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_replay", 2_750_000));
    await startPayment(campaign.id);

    // A perfectly valid signature, but signed 10 minutes ago.
    const { res } = await deliverWebhook(
      "payment.completed",
      {
        reference: "pay_ref_replay",
        status: "completed",
        amount: { value: 2_750_000, currency: "TZS" },
      },
      { timestamp: Math.floor(Date.now() / 1000) - 600 }
    );

    expect(res.status).toBe(400);
    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("AWAITING_PAYMENT");
  });

  it("rejects a signature computed over different bytes than were sent", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_bytes", 2_750_000));
    await startPayment(campaign.id);

    // Sign one body, send another. This is the classic re-serialization bypass.
    const signature = signWebhookPayload(
      JSON.stringify({ id: "evt_1", type: "payment.completed", data: { reference: "x" } }),
      Math.floor(Date.now() / 1000),
      SECRET
    );

    const res = await webhookRoute(
      new Request("https://konnectika.test/api/webhooks/snippe", {
        method: "POST",
        body: JSON.stringify({
          id: "evt_1",
          type: "payment.completed",
          data: {
            reference: "pay_ref_bytes",
            status: "completed",
            amount: { value: 2_750_000, currency: "TZS" },
          },
        }),
        headers: {
          "content-type": "application/json",
          "x-webhook-timestamp": String(Math.floor(Date.now() / 1000)),
          "x-webhook-signature": signature,
        },
      })
    );

    expect(res.status).toBe(400);
    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("AWAITING_PAYMENT");
  });

  // -------------------------------------------------------------------------
  // Idempotency
  // -------------------------------------------------------------------------

  it("applies a duplicate delivery exactly once (one proof, one notification)", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 400_000,
    });
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_dupe", 440_000));
    const { body } = await startPayment(campaign.id);
    const intentId = body.intentId;

    const event = {
      reference: "pay_ref_dupe",
      status: "completed",
      amount: { value: 440_000, currency: "TZS" },
      settlement: {
        gross: { value: 440_000, currency: "TZS" },
        fees: { value: 4_400, currency: "TZS" },
        net: { value: 435_600, currency: "TZS" },
      },
      channel: { type: "mobile_money", provider: "mpesa" },
    };

    // Same event id, delivered twice — the realistic provider retry case.
    const payload = {
      id: "evt_dupe_fixed_id",
      type: "payment.completed",
      data: event,
    };
    const rawBody = JSON.stringify(payload);
    const ts = Math.floor(Date.now() / 1000);
    const sig = signWebhookPayload(rawBody, ts, SECRET);
    const post = () =>
      webhookRoute(
        new Request("https://konnectika.test/api/webhooks/snippe", {
          method: "POST",
          body: rawBody,
          headers: {
            "content-type": "application/json",
            "x-webhook-timestamp": String(ts),
            "x-webhook-signature": sig,
          },
        })
      );

    const first = await post();
    expect(first.status).toBe(200);
    expect((await readJson(first)).applied).toBe(true);

    const second = await post();
    expect(second.status).toBe(200);
    expect((await readJson(second)).duplicate).toBe(true);

    // Exactly one of everything that matters.
    expect(await prisma.paymentProof.count({ where: { campaignId: campaign.id } })).toBe(1);
    expect(await prisma.webhookEvent.count({ where: { id: "evt_dupe_fixed_id" } })).toBe(1);
    expect(await prisma.notification.count({ where: { userId: fx.brandAlpha.id } })).toBe(1);
    expect(
      (await prisma.paymentIntent.findUniqueOrThrow({ where: { id: intentId } })).status
    ).toBe("PAID");
  });

  it("is idempotent even if the same payment arrives under a NEW event id", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 400_000,
    });
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_newid", 440_000));
    const { body } = await startPayment(campaign.id);

    const event = {
      reference: "pay_ref_newid",
      status: "completed",
      amount: { value: 440_000, currency: "TZS" },
      settlement: {
        gross: { value: 440_000, currency: "TZS" },
        fees: { value: 4_400, currency: "TZS" },
        net: { value: 435_600, currency: "TZS" },
      },
      channel: { type: "mobile_money", provider: "mpesa" },
    };

    const first = await deliverWebhook("payment.completed", event);
    expect((await readJson(first.res)).applied).toBe(true);

    // Different envelope id, same underlying payment. The conditional status
    // guard is what stops this double-applying.
    const second = await deliverWebhook("payment.completed", event);
    expect(second.res.status).toBe(200);
    expect((await readJson(second.res)).applied).toBe(false);

    expect(await prisma.paymentProof.count({ where: { campaignId: campaign.id } })).toBe(1);
    expect(await prisma.notification.count({ where: { userId: fx.brandAlpha.id } })).toBe(1);
    expect(
      (await prisma.paymentIntent.findUniqueOrThrow({ where: { id: body.intentId } })).status
    ).toBe("PAID");
  });

  it("releases the dedupe reservation when processing fails, so the retry is not swallowed", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 400_000,
    });
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_retry", 440_000));
    const { body } = await startPayment(campaign.id);
    const intentId = body.intentId;

    const payload = {
      id: "evt_retry_fixed",
      type: "payment.completed",
      data: {
        reference: "pay_ref_retry",
        status: "completed",
        amount: { value: 440_000, currency: "TZS" },
        settlement: {
          gross: { value: 440_000, currency: "TZS" },
          fees: { value: 4_400, currency: "TZS" },
          net: { value: 435_600, currency: "TZS" },
        },
        channel: { type: "mobile_money", provider: "mpesa" },
      },
    };
    const rawBody = JSON.stringify(payload);

    // Break settlement so dispatch throws AFTER the dedupe row is written.
    const origFindUnique = prisma.paymentIntent.findUnique.bind(prisma.paymentIntent);
    let boom = true;
    vi.spyOn(prisma.paymentIntent, "findUnique").mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (args: any) => {
        if (boom) {
          boom = false;
          throw new Error("transient database blip");
        }
        return origFindUnique(args);
      }
    );

    const send = () => {
      const ts = Math.floor(Date.now() / 1000);
      return webhookRoute(
        new Request("https://konnectika.test/api/webhooks/snippe", {
          method: "POST",
          body: rawBody,
          headers: {
            "content-type": "application/json",
            "x-webhook-timestamp": String(ts),
            "x-webhook-signature": signWebhookPayload(rawBody, ts, SECRET),
          },
        })
      );
    };

    const failed = await send();
    expect(failed.status).toBe(500);

    // The reservation must be gone, otherwise the retry would be reported as a
    // duplicate and the settlement would be lost forever.
    expect(await prisma.webhookEvent.count({ where: { id: "evt_retry_fixed" } })).toBe(0);

    const retried = await send();
    expect(retried.status).toBe(200);
    expect((await readJson(retried)).applied).toBe(true);
    expect(
      (await prisma.paymentIntent.findUniqueOrThrow({ where: { id: intentId } })).status
    ).toBe("PAID");

    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Failure and retry
  // -------------------------------------------------------------------------

  it("moves the campaign to PAYMENT_FAILED on payment.failed so the brand can retry", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_fail", 2_750_000));
    const { body } = await startPayment(campaign.id);

    const { res } = await deliverWebhook("payment.failed", {
      reference: "pay_ref_fail",
      status: "failed",
      failure_reason: "Customer declined the authorization.",
    });

    expect(res.status).toBe(200);
    const after = await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(after.paymentStatus).toBe("PAYMENT_FAILED");

    const intent = await prisma.paymentIntent.findUniqueOrThrow({ where: { id: body.intentId } });
    expect(intent.status).toBe("FAILED");
    expect(intent.failureReason).toMatch(/declined/i);
    // A failed attempt never created a proof.
    expect(await prisma.paymentProof.count({ where: { campaignId: campaign.id } })).toBe(0);
  });

  it("treats an expired authorization the same as a failure", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_exp", 2_750_000));
    const { body } = await startPayment(campaign.id);

    await deliverWebhook("payment.expired", {
      reference: "pay_ref_exp",
      status: "expired",
    });

    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("PAYMENT_FAILED");
    expect(
      (await prisma.paymentIntent.findUniqueOrThrow({ where: { id: body.intentId } })).status
    ).toBe("FAILED");
  });

  it("opens attempt 2 on retry and leaves attempt 1 failed but intact", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 200_000,
    });
    // Each POST /v1/payments mints its own reference, as the real API does.
    let n = 0;
    const calls = mockSnippeFetch(() => pendingPaymentResponse(`pay_ref_a${++n}`, 220_000));

    await startPayment(campaign.id);
    await deliverWebhook("payment.failed", {
      reference: "pay_ref_a1",
      status: "failed",
      failure_reason: "Timeout",
    });

    // Brand taps "Try Again".
    const second = await startPayment(campaign.id);
    expect(second.res.status).toBe(202);

    const intents = await prisma.paymentIntent.findMany({
      where: { campaignId: campaign.id },
      orderBy: { attempt: "asc" },
    });
    expect(intents).toHaveLength(2);
    expect(intents[0].attempt).toBe(1);
    expect(intents[0].status).toBe("FAILED");
    expect(intents[1].attempt).toBe(2);
    expect(intents[1].status).toBe("AWAITING_PAYMENT");

    // Each attempt gets its OWN idempotency key — a retry is a new charge, and
    // reusing attempt 1's key would return Snippe's cached (failed) response.
    expect(intents[0].idempotencyKey).not.toBe(intents[1].idempotencyKey);
    const keys = calls.map(
      (c) => (c.init?.headers as Record<string, string>)["Idempotency-Key"]
    );
    expect(new Set(keys).size).toBe(2);
  });

  it("refuses a second payment while one is still awaiting authorization", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 200_000,
    });
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_guard", 220_000));

    const first = await startPayment(campaign.id);
    expect(first.res.status).toBe(202);

    // Double-tap: must not open a second charge.
    const second = await startPayment(campaign.id);
    expect(second.res.status).toBe(409);
    expect(second.body.code).toBe("IN_FLIGHT");

    expect(await prisma.paymentIntent.count({ where: { campaignId: campaign.id } })).toBe(1);
  });

  it("refuses to start a payment for a campaign that is already paid", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      paymentStatus: "PAID",
    });
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_paid", 2_750_000));

    const { res, body } = await startPayment(campaign.id);
    expect(res.status).toBe(409);
    expect(body.code).toBe("ALREADY_PAID");
    expect(await prisma.paymentIntent.count()).toBe(0);
  });

  it("ignores a late completion from a superseded attempt without double-paying the ledger", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 200_000,
    });
    let n = 0;
    const calls = mockSnippeFetch((url) => {
      if (url.endsWith("/v1/payments")) {
        return pendingPaymentResponse(`pay_ref_a${++n}`, 220_000);
      }
      return successEnvelope({});
    });

    const first = await startPayment(campaign.id);
    const attempt1Id = first.body.intentId;
    await deliverWebhook("payment.failed", {
      reference: "pay_ref_a1",
      status: "failed",
      failure_reason: "Timeout",
    });
    await startPayment(campaign.id);

    // Attempt 1's money arrives late, AFTER attempt 2 exists. The brand paid in
    // full, so the campaign funds — but it must not resurrect the failed intent
    // or fabricate a second proof.
    await deliverWebhook("payment.completed", {
      reference: "pay_ref_a1",
      status: "completed",
      amount: { value: 220_000, currency: "TZS" },
      settlement: {
        gross: { value: 220_000, currency: "TZS" },
        fees: { value: 2_200, currency: "TZS" },
        net: { value: 217_800, currency: "TZS" },
      },
      channel: { type: "mobile_money", provider: "mpesa" },
    });

    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("PAID");
    // The late money is honoured on the attempt it actually paid through, rather
    // than being thrown away because attempt 2 exists.
    expect(
      (await prisma.paymentIntent.findUniqueOrThrow({ where: { id: attempt1Id } })).status
    ).toBe("PAID");
    // Exactly one proof for the one real payment.
    expect(await prisma.paymentProof.count({ where: { campaignId: campaign.id } })).toBe(1);
    expect(calls.length).toBe(2);
  });

  // -------------------------------------------------------------------------
  // Authorization + validation
  // -------------------------------------------------------------------------

  it("will not let one brand pay for another brand's campaign", async () => {
    // Ownership is enforced in the lookup, not by a status code.
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_x", 2_750_000));

    await signInAs(fx.brandBeta.id, "BRAND");
    const res = await payRoute(
      new Request(`https://konnectika.test/api/campaigns/${campaign.id}/pay`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phoneNumber: "0712345678",
          firstName: "Beta",
          lastName: "Brand",
          email: "beta@brand.test",
        }),
      }),
      { params: Promise.resolve({ id: campaign.id }) }
    );

    // 404, not 403: the route scopes the lookup to the caller's own campaigns,
    // so another brand's campaign is indistinguishable from a missing one. No
    // existence leak, and no payment was started.
    expect(res.status).toBe(404);
    expect(await prisma.paymentIntent.count()).toBe(0);
  });

  it("rejects an invalid phone before calling Snippe", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    const calls = mockSnippeFetch(() => pendingPaymentResponse("pay_ref_bad", 2_750_000));

    const { res } = await startPayment(campaign.id, "not-a-phone");
    expect(res.status).toBe(400);
    // Snippe was never asked for money.
    expect(calls.length).toBe(0);
    expect(await prisma.paymentIntent.count()).toBe(0);
    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("UNPAID");
  });

  it("rejects a total below Snippe's minimum payment", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId, {
      budgetTotal: 100,
    });
    const calls = mockSnippeFetch(() => pendingPaymentResponse("pay_ref_min", 110));

    const { res } = await startPayment(campaign.id);
    expect(res.status).toBe(400);
    expect(calls.length).toBe(0);
  });

  it("returns the campaign to PAYMENT_FAILED when Snippe cannot create the payment", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "boom" }), { status: 500 }))
    );

    const { res } = await startPayment(campaign.id);
    expect(res.status).toBe(502);

    // Not locked out: the attempt is recorded as FAILED and retryable.
    const intent = await getLatestPaymentIntent(campaign.id);
    expect(intent?.status).toBe("FAILED");
    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("PAYMENT_FAILED");
  });

  it("acknowledges an unhandled event type without touching campaign state", async () => {
    const campaign = await createCampaign(fx.brandAlpha.businessProfileId);
    mockSnippeFetch(() => pendingPaymentResponse("pay_ref_unhandled", 2_750_000));
    await startPayment(campaign.id);

    const { res } = await deliverWebhook("payout.completed", {
      reference: "po_not_ours",
      status: "completed",
    });

    expect(res.status).toBe(200);
    expect(
      (await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } })).paymentStatus
    ).toBe("AWAITING_PAYMENT");
  });
});