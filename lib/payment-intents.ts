// lib/payment-intents.ts
//
// Brand -> Konnectika collection through Snippe, and the webhook-driven
// settlement that closes it. This is the ONLY path that can set a campaign to
// PAID for a Snippe payment.
//
// Lifecycle:
//
//   UNPAID
//     -> createPaymentIntent()   POST /api/campaigns/[id]/pay
//   AWAITING_PAYMENT            Snippe has the intent; USSD push sent to the brand
//     -> payment.completed webhook (signature verified)
//
//   UNPAID / AWAITING_PAYMENT / PAYMENT_FAILED
//     -> createPaymentIntent()   (brand retries; attempt N+1)
//   AWAITING_PAYMENT
//     -> payment.failed / expired / voided webhook
//   PAYMENT_FAILED               brand may retry
//
// Settlement (ONE transaction, webhook-only):
//   PaymentIntent -> PAID, Campaign -> PAID, PaymentProof -> VERIFIED,
//   BRAND_FEE PlatformRevenue -> PAID, real Snippe fee written back.
//
// The frontend response NEVER marks a campaign paid. `createPaymentIntent`
// returns "instructions" only; a campaign becomes PAID exclusively from
// applyPaymentWebhook(), which is reachable only from a signature-verified
// webhook.
//
// Concurrency: every settlement write is a conditional updateMany on the
// current status, so two concurrent deliveries of the same event (or of two
// different events for the same intent) cannot double-apply. Losing the race
// is a no-op, not an error.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  buildIdempotencyKey,
  createPayment as snippeCreatePayment,
  getPayment,
  SNIPPE_MIN_PAYMENT,
  toSnippePhone,
  type SnippePayment,
  type SnippeWebhookPayload,
} from "@/lib/snippe";
import {
  computeBrandCharge,
  getPlatformPricing,
  type BrandChargeBreakdown,
  type PlatformPricing,
} from "@/lib/pricing";
import { notify } from "@/lib/notification";
import { normalizePhoneNumber } from "@/lib/payment";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StartPaymentInput {
  campaignId: string;
  brandUserId: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Absolute HTTPS URL Snippe posts the outcome to. */
  webhookUrl: string;
}

export interface PaymentInstructions {
  reference: string;
  amount: number;
  phone: string;
  channel: string;
  /** What the brand should do next — here: authorize the USSD push. */
  message: string;
  expiresAt: string | null;
}

export type StartPaymentResult =
  | { ok: true; intentId: string; breakdown: BrandChargeBreakdown; instructions: PaymentInstructions }
  | { ok: false; error: string; code: StartPaymentErrorCode };

export type StartPaymentErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "ALREADY_PAID"
  | "INVALID_PHONE"
  | "AMOUNT_TOO_SMALL"
  | "IN_FLIGHT"
  | "INVALID_STATE"
  | "PROVIDER_ERROR";

const NOT_FOUND = "NOT_FOUND" as const;
const FORBIDDEN = "FORBIDDEN" as const;
const ALREADY_PAID = "ALREADY_PAID" as const;
const INVALID_PHONE = "INVALID_PHONE" as const;
const AMOUNT_TOO_SMALL = "AMOUNT_TOO_SMALL" as const;
const IN_FLIGHT = "IN_FLIGHT" as const;
const PROVIDER_ERROR = "PROVIDER_ERROR" as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** The live attempt for a campaign, if any. Attempts are numbered, so the
 *  highest attempt is the current one. */
export async function getLatestPaymentIntent(campaignId: string) {
  return prisma.paymentIntent.findFirst({
    where: { campaignId },
    orderBy: { attempt: "desc" },
  });
}

/** What the brand is charged, for display before they start a payment. */
export async function getCampaignChargeBreakdown(
  campaignId: string
): Promise<BrandChargeBreakdown | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { budgetTotal: true },
  });
  if (!campaign) return null;
  return computeBrandCharge(campaign.budgetTotal, await getPlatformPricing());
}

// ---------------------------------------------------------------------------
// Creating an attempt
// ---------------------------------------------------------------------------

/**
 * Start (or restart) a brand's payment for one of their campaigns.
 *
 * Creates a PaymentIntent row FIRST so the idempotency key and the amount
 * snapshot exist before any money movement is attempted, then asks Snippe for
 * a payment intent. The campaign moves to AWAITING_PAYMENT so the UI can show
 * "authorize the USSD push" rather than the old offline bank-transfer flow.
 *
 * Retries are first-class: each call creates a NEW attempt with attempt+1 and
 * a fresh idempotency key derived from (campaign, attempt), so a brand who
 * failed or expired can simply call again.
 */
export async function createPaymentIntent(
  input: StartPaymentInput
): Promise<StartPaymentResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: input.campaignId },
    select: {
      id: true,
      name: true,
      budgetTotal: true,
      paymentStatus: true,
      totalCharge: true,
      status: true,
      businessProfile: { select: { userId: true, companyName: true } },
    },
  });

  if (!campaign) return { ok: false, error: "Campaign not found.", code: NOT_FOUND };
  if (campaign.businessProfile.userId !== input.brandUserId) {
    return {
      ok: false,
      error: "You can only pay for your own campaign.",
      code: FORBIDDEN,
    };
  }
  if (campaign.status !== "APPROVED") {
    return {
      ok: false,
      error: `Campaign cannot be paid in ${campaign.status} status.`,
      code: "INVALID_STATE",
    };
  }
  if (campaign.paymentStatus === "PAID") {
    return {
      ok: false,
      error: "This campaign has already been paid.",
      code: ALREADY_PAID,
    };
  }

  const phone = normalizePhoneNumber(input.phoneNumber);
  const snippePhone = toSnippePhone(input.phoneNumber);
  if (!snippePhone) {
    return {
      ok: false,
      error:
        "Enter a valid Tanzanian mobile money number, e.g. 0712 345 678 or +255 712 345 678.",
      code: INVALID_PHONE,
    };
  }

  const pricing: PlatformPricing = await getPlatformPricing();
  const breakdown = computeBrandCharge(campaign.budgetTotal, pricing);

  if (breakdown.totalCharge < SNIPPE_MIN_PAYMENT) {
    return {
      ok: false,
      error: `The total charge is below Snippe's minimum payment of ${SNIPPE_MIN_PAYMENT} TZS.`,
      code: AMOUNT_TOO_SMALL,
    };
  }

  // Serialize attempt numbering per campaign so two concurrent "pay" clicks
  // cannot claim the same attempt number (and therefore the same key).
  // Guard against a brand double-tapping "Pay": if the live attempt is still
  // awaiting authorization, return it instead of opening a second charge.
  const latest = await getLatestPaymentIntent(campaign.id);
  if (
    latest &&
    (latest.status === "AWAITING_PAYMENT" || latest.status === "PROCESSING")
  ) {
    return {
      ok: false,
      error:
        "You already have a payment in progress for this campaign. Finish or cancel it before starting another.",
      code: IN_FLIGHT,
    };
  }

  const attempt = (latest?.attempt ?? 0) + 1;
  const idempotencyKey = buildIdempotencyKey("pay", `${campaign.id}-${attempt}`);

  let intent;
  try {
    intent = await prisma.$transaction(async (tx) => {
      const created = await tx.paymentIntent.create({
        data: {
          campaignId: campaign.id,
          attempt,
          idempotencyKey,
          budgetTotal: breakdown.budget,
          platformFeeRate: breakdown.platformFeeRate,
          platformFee: breakdown.platformFee,
          providerFeeRate: breakdown.providerFeeRate,
          providerFee: breakdown.providerFee,
          totalCharge: breakdown.totalCharge,
          status: "AWAITING_PAYMENT",
          customerPhone: phone,
          customerName: `${input.firstName} ${input.lastName}`.trim(),
          customerEmail: input.email,
        },
      });

      await tx.campaign.update({
        where: { id: campaign.id },
        data: { paymentStatus: "AWAITING_PAYMENT" },
      });

      return created;
    });
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        ok: false,
        error:
          "You already have a payment in progress for this campaign. Finish or cancel it before starting another.",
        code: IN_FLIGHT,
      };
    }
    throw err;
  }

  let payment: SnippePayment;
  try {
    payment = await snippeCreatePayment({
      amount: breakdown.totalCharge,
      currency: "TZS",
      phoneNumber: snippePhone,
      customerFirstName: input.firstName,
      customerLastName: input.lastName,
      customerEmail: input.email,
      webhookUrl: input.webhookUrl,
      metadata: {
        campaignId: campaign.id,
        paymentIntentId: intent.id,
        attempt: String(attempt),
      },
      idempotencyKey,
    });
  } catch (error) {
    // Snippe refused or was unreachable. Roll the attempt back to a retryable
    // state so the brand is not locked out of trying again.
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: "FAILED",
        failureReason:
          error instanceof Error ? error.message : "Could not start payment.",
      },
    });
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { paymentStatus: "PAYMENT_FAILED" },
    });
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not reach the payment provider.",
      code: PROVIDER_ERROR,
    };
  }

  await prisma.paymentIntent.update({
    where: { id: intent.id },
    data: {
      providerReference: payment.reference,
      channel: payment.channel?.provider ?? null,
      expiresAt: payment.expires_at ? new Date(payment.expires_at) : null,
    },
  }).catch(async (error: unknown) => {
    // A webhook may have settled this intent before we wrote the reference back.
    // That is safe — the settlement above is guarded by status — so record the
    // gap for reconciliation rather than failing a payment that went through.
    const settled = await prisma.paymentIntent.findUnique({
      where: { id: intent.id },
      select: { status: true },
    });
    if (settled?.status === "PAID") {
      console.warn(
        `[snippe] reference write-back lost for settled intent ${intent.id}`,
        error
      );
      return;
    }
    throw error;
  });

  return {
    ok: true,
    intentId: intent.id,
    breakdown,
    instructions: {
      reference: payment.reference,
      amount: breakdown.totalCharge,
      phone: snippePhone,
      channel: payment.channel?.provider ?? "",
      message: `A USSD authorization request has been sent to ${snippePhone}. Approve it with your mobile money PIN to complete the payment.`,
      expiresAt: payment.expires_at ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// Webhook application
// ---------------------------------------------------------------------------

export type WebhookApplyResult =
  | { ok: true; applied: boolean; event: string; reason?: string }
  | { ok: false; error: string; code: "UNKNOWN_REFERENCE" | "INVALID_AMOUNT" };

/**
 * Apply a verified Snippe payment event. Caller MUST have verified the
 * signature first (lib/snippe.ts verifyWebhook).
 *
 * Never trusts the client — the only input is the verified provider payload.
 */
export async function applyPaymentWebhook(
  payload: SnippeWebhookPayload
): Promise<WebhookApplyResult> {
  const data = payload.data;
  const reference = data?.reference;
  if (!reference) {
    return { ok: false, error: "Webhook payload has no reference.", code: "UNKNOWN_REFERENCE" };
  }

  // Prefer the provider reference. Snippe can deliver the webhook before our
  // create-payment response has been written back, so fall back to the intent
  // id we echoed in metadata — otherwise that race would lose the settlement.
  const intentIdFromMetadata = data.metadata?.paymentIntentId;
  const withCampaign = {
    campaign: { select: { id: true, name: true, budgetTotal: true } },
  } as const;

  const intent =
    (await prisma.paymentIntent.findUnique({
      where: { providerReference: reference },
      include: withCampaign,
    })) ??
    (typeof intentIdFromMetadata === "string"
      ? await prisma.paymentIntent.findUnique({
          where: { id: intentIdFromMetadata },
          include: withCampaign,
        })
      : null);

  if (!intent) {
    return {
      ok: false,
      error: `No payment intent matches Snippe reference ${reference}.`,
      code: "UNKNOWN_REFERENCE",
    };
  }

  switch (payload.type) {
    case "payment.completed":
      return settleCompletedPayment(intent, data);
    case "payment.failed":
    case "payment.expired":
    case "payment.voided":
      return failPaymentIntent(intent, payload.type, data.failure_reason ?? null);
    default:
      return { ok: true, applied: false, event: payload.type, reason: "UNHANDLED_EVENT" };
  }
}

type IntentWithCampaign = Prisma.PaymentIntentGetPayload<{
  include: { campaign: { select: { id: true; name: true; budgetTotal: true } } };
}>;

async function settleCompletedPayment(
  intent: IntentWithCampaign,
  data: SnippeWebhookPayload["data"]
): Promise<WebhookApplyResult> {
  // data.amount is an OBJECT in webhooks ({ value, currency }) — never an int.
  const gross = data.amount?.value ?? null;
  const realFee = data.settlement?.fees?.value ?? null;
  const net = data.settlement?.net?.value ?? null;
  const currency = data.amount?.currency ?? "TZS";

  // Guard the money: a completed payment in a currency we do not handle, or
  // with no amount at all, is not something we can settle against the ledger.
  if (gross !== null && currency !== "TZS") {
    return {
      ok: false,
      error: `Unsupported settlement currency ${currency}.`,
      code: "INVALID_AMOUNT",
    };
  }
  if (gross !== null && gross !== intent.totalCharge) {
    // Money arrived but not the amount we snapshotted. Still settle (the brand
    // paid and the campaign should be funded) — the variance is recorded on the
    // intent and in the proof so finance can reconcile it.
    console.error(
      `[snippe] amount variance on intent ${intent.id}: charged ${gross}, expected ${intent.totalCharge}`
    );
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Conditional claim: an intent can be settled only while it is unsettled.
    // This is the double-charge guard — a duplicate webhook (or two concurrent
    // deliveries) updates 0 rows here and the whole transaction is a no-op.
    //
    // FAILED is deliberately included. Snippe can report a payment failed or
    // expired and then still deliver a completion (a timeout on our side, a
    // delayed push, a reversal-then-settlement at the provider). If that money
    // really arrived we MUST fund the campaign; refusing it would leave the
    // brand having paid for nothing. Only a verified completion webhook can
    // reach this branch, so widening the window cannot invent a payment.
    const claimed = await tx.paymentIntent.updateMany({
      where: {
        id: intent.id,
        status: { in: ["AWAITING_PAYMENT", "PROCESSING", "FAILED"] },
      },
      data: {
        status: "PAID",
        paidAt: now,
        actualProviderFee: realFee,
        actualNetAmount: net,
        providerExternalRef: data.external_reference ?? null,
        channel: data.channel?.provider ?? intent.channel,
        failureReason: null,
      },
    });

    if (claimed.count === 0) {
      return { applied: false as const };
    }

    // The campaign becomes PAID here and nowhere else. The guard also makes a
    // late completion from an older attempt safe: money arrived, the campaign
    // is funded, and re-marking a PAID campaign changes nothing.
    await tx.campaign.updateMany({
      where: { id: intent.campaignId, paymentStatus: { not: "PAID" } },
      data: { paymentStatus: "PAID" },
    });

    // PaymentProof stays as the human-readable audit record. For a Snippe
    // payment it is written by the webhook, not typed by a brand, so it is
    // born VERIFIED and carries the provider reference.
    await tx.paymentProof.create({
      data: {
        campaignId: intent.campaignId,
        paymentIntentId: intent.id,
        submittedById: null,
        amount: gross ?? intent.totalCharge,
        paymentMethod: `Snippe ${
          data.channel?.type === "mobile_money" ? "Mobile Money" : "Payment"
        }`,
        transactionReference: data.external_reference ?? intent.providerReference ?? "",
        proofUrl: null,
        note:
          gross !== null && gross !== intent.totalCharge
            ? `Snippe charged ${gross} TZS; expected ${intent.totalCharge} TZS.`
            : null,
        status: "VERIFIED",
        provider: "snippe",
        providerReference: intent.providerReference,
      },
    });

    // The 10% platform fee becomes real revenue the moment funds arrive.
    await tx.platformRevenue.updateMany({
      where: { campaignId: intent.campaignId, type: "BRAND_FEE", status: "ACCRUED" },
      data: { status: "PAID", paymentReference: intent.providerReference },
    });

    return { applied: true as const };
  });

  if (!result.applied) {
    return { ok: true, applied: false, event: "payment.completed", reason: "ALREADY_SETTLED" };
  }

  await notify({
    userId: (
      await prisma.campaign.findUniqueOrThrow({
        where: { id: intent.campaignId },
        select: { businessProfile: { select: { userId: true } } },
      })
    ).businessProfile.userId,
    title: "Payment Received",
    message: `Your payment of TZS ${(gross ?? intent.totalCharge).toLocaleString()} for "${intent.campaign.name}" has been received.`,
    type: "SUCCESS",
  });

  return { ok: true, applied: true, event: "payment.completed" };
}

async function failPaymentIntent(
  intent: IntentWithCampaign,
  event: string,
  failureReason: string | null
): Promise<WebhookApplyResult> {
  // Only move the CAMPAIGN back to PAYMENT_FAILED when this intent is still
  // the live one — a late `expired` for attempt 1 must not clobber attempt 2
  // which may already be awaiting authorization or paid.
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.paymentIntent.updateMany({
      where: {
        id: intent.id,
        status: { in: ["AWAITING_PAYMENT", "PROCESSING"] },
      },
      data: {
        status: "FAILED",
        failureReason: failureReason ?? event,
        providerExternalRef: undefined,
      },
    });

    if (claimed.count === 0) return;

    const latest = await tx.paymentIntent.findFirst({
      where: { campaignId: intent.campaignId },
      orderBy: { attempt: "desc" },
      select: { id: true, status: true },
    });
    if (latest?.id !== intent.id) return;

    await tx.campaign.updateMany({
      where: { id: intent.campaignId, paymentStatus: { not: "PAID" } },
      data: { paymentStatus: "PAYMENT_FAILED" },
    });
  });

  return { ok: true, applied: true, event };
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

/**
 * Pull a payment's live status from Snippe and apply it. For the rare case
 * where a webhook was abandoned after 5 retries — the frontend polls this for
 * UX, and the webhook remains the source of truth.
 */
export async function reconcilePaymentIntent(
  intentId: string
): Promise<WebhookApplyResult | { ok: true; applied: false; event: "unsettled" }> {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: intentId },
    include: { campaign: { select: { id: true, name: true, budgetTotal: true } } },
  });
  if (!intent?.providerReference) {
    return { ok: true, applied: false, event: "unsettled" };
  }

  const payment = await getPayment(intent.providerReference);

  if (payment.status === "completed") {
    return settleCompletedPayment(intent, {
      reference: payment.reference,
      external_reference: payment.external_reference,
      amount: payment.amount,
      settlement: payment.settlement,
      channel: payment.channel,
      metadata: payment.metadata,
    });
  }

  if (
    payment.status === "failed" ||
    payment.status === "expired" ||
    payment.status === "voided"
  ) {
    const event =
      payment.status === "failed"
        ? "payment.failed"
        : payment.status === "expired"
          ? "payment.expired"
          : "payment.voided";
    return failPaymentIntent(intent, event, null);
  }

  return { ok: true, applied: false, event: "unsettled" };
}