// lib/snippe.ts
//
// The ONLY place that talks to Snippe (https://api.snippe.sh, API version
// 2026-01-25). Everything above this file deals in integers (TZS) and domain
// objects; everything provider-specific is contained here.
//
// Protocol facts encoded in this file (from the Snippe integration skill — do
// not change these without re-reading it):
//   - Base URL https://api.snippe.sh, `Authorization: Bearer snp_...`
//   - TZS only. Amounts are integers in the smallest unit; 500 means 500 TZS.
//   - Min payment 500 TZS, min payout 5,000 TZS.
//   - Idempotency-Key MUST be <= 30 characters. Longer keys fail with the
//     cryptic `PAY_001` error (this is the #1 cause of PAY_001, not downtime).
//   - Webhook `data.amount` is an OBJECT `{ value, currency }`, while request
//     bodies take a plain integer `details.amount`. Parsing them the same way
//     is a classic bug, hence two separate types below.
//   - Webhook signature = hex(HMAC-SHA256(secret, "{timestamp}.{rawBody}")),
//     verified against the RAW body with a constant-time compare, and the
//     timestamp must be within 5 minutes to block replays.

import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const SNIPPE_BASE_URL = "https://api.snippe.sh";
export const SNIPPE_API_VERSION = "2026-01-25";

/** Snippe rejects payments below 500 TZS and payouts below 5,000 TZS. */
export const SNIPPE_MIN_PAYMENT = 500;
export const SNIPPE_MIN_PAYOUT = 5000;

/** Hard API limit. `buildIdempotencyKey` enforces this at construction time so
 *  a too-long key can never reach the wire and come back as PAY_001. */
export const SNIPPE_MAX_IDEMPOTENCY_KEY = 30;

/** Webhooks older than this are rejected to prevent replay attacks. */
export const SNIPPE_WEBHOOK_TOLERANCE_SECONDS = 300;

export function getSnippeApiKey(): string {
  const key = process.env.SNIPPE_API_KEY?.trim();
  if (!key) {
    throw new Error("SNIPPE_API_KEY is not configured.");
  }
  return key;
}

export function getSnippeWebhookSecret(): string {
  const secret = process.env.SNIPPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("SNIPPE_WEBHOOK_SECRET is not configured.");
  }
  return secret;
}

export function isSnippeConfigured(): boolean {
  return Boolean(
    process.env.SNIPPE_API_KEY?.trim() && process.env.SNIPPE_WEBHOOK_SECRET?.trim()
  );
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/**
 * Konnectika's own provider names are the stable public vocabulary (they are
 * already stored on ReceivingAccount.provider, Campaign.paymentMethod and
 * Payout.paymentMethod). Snippe auto-detects the network from the phone number
 * and does NOT accept a provider on the request, so this map exists to
 * translate our names into Snippe's vocabulary for reporting/telemetry and to
 * validate that a chosen method is one Snippe can actually route.
 */
export const SNIPPE_PROVIDER_CODES = {
  "M-PESA": "mpesa",
  "AIRTEL MONEY": "airtel",
  "TIGO/Mixx by Yas": "mixx",
  HALOPESA: "halotel",
} as const;

export type InternalPaymentProvider = keyof typeof SNIPPE_PROVIDER_CODES;
export type SnippeProviderCode =
  (typeof SNIPPE_PROVIDER_CODES)[InternalPaymentProvider];

/** Canonical internal provider names, in display order. */
export const INTERNAL_PAYMENT_PROVIDERS = Object.keys(
  SNIPPE_PROVIDER_CODES
) as InternalPaymentProvider[];

/** Reverse map: a Snippe `channel.provider` value back to our name. */
const PROVIDER_CODE_TO_INTERNAL = new Map<string, InternalPaymentProvider>(
  (Object.entries(SNIPPE_PROVIDER_CODES) as [InternalPaymentProvider, string][])
    .map(([internal, code]) => [code, internal])
);

export function toSnippeProviderCode(
  provider: string | null | undefined
): SnippeProviderCode | null {
  if (!provider) return null;
  const key = provider.trim().toUpperCase() as InternalPaymentProvider;
  return SNIPPE_PROVIDER_CODES[key] ?? null;
}

export function fromSnippeProviderCode(
  code: string | null | undefined
): InternalPaymentProvider | null {
  if (!code) return null;
  return PROVIDER_CODE_TO_INTERNAL.get(code.trim().toLowerCase()) ?? null;
}

export function isSnippeProvider(
  provider: string | null | undefined
): provider is InternalPaymentProvider {
  return toSnippeProviderCode(provider) !== null;
}

// ---------------------------------------------------------------------------
// Phone numbers
// ---------------------------------------------------------------------------

/**
 * Normalize a Tanzanian number to Snippe's accepted form.
 *
 * Snippe accepts `255XXXXXXXXX` or `+255XXXXXXXXX` and rejects local formats
 * like `0781000000` with a validation_error. Internally we store `+255…`
 * (lib/payment.ts normalizePhoneNumber), so this converts that to the bare
 * `255…` form Snippe documents. Returns null when the input is not a valid
 * Tanzanian mobile number.
 */
export function toSnippePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[\s\-().]/g, "");
  if (/^\+?255[67]\d{8}$/.test(digits)) {
    return digits.replace(/^\+/, "");
  }
  if (/^0[67]\d{8}$/.test(digits)) {
    return `255${digits.slice(1)}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

/**
 * Build an idempotency key that is guaranteed <= 30 characters.
 *
 * A cuid is 25 chars, so the raw id is used when it fits and a
 * `<kind>-<12 char digest>` fallback keeps the key stable (same inputs ->
 * same key) while fitting the limit. Deterministic because the same logical
 * operation must always derive the same key — that is the whole point.
 */
export function buildIdempotencyKey(
  kind: "pay" | "po",
  seed: string
): string {
  const trimmed = seed.trim();
  if (trimmed.length > 0 && trimmed.length <= SNIPPE_MAX_IDEMPOTENCY_KEY) {
    return trimmed;
  }
  const digest = crypto.createHash("sha256").update(seed).digest("hex");
  return `${kind}-${digest.slice(0, SNIPPE_MAX_IDEMPOTENCY_KEY - kind.length - 1)}`;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Mirrors Snippe's error envelope: { status, code, error_code, message }. */
export class SnippeError extends Error {
  readonly httpStatus: number;
  readonly errorCode: string | null;

  constructor(
    message: string,
    httpStatus: number,
    errorCode: string | null = null
  ) {
    super(message);
    this.name = "SnippeError";
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
  }

  /**
   * 400/401/403/422 are permanent for this request shape — retrying is
   * pointless. 5xx, 429 and PAY_001 are transient.
   */
  get retryable(): boolean {
    return (
      this.httpStatus >= 500 ||
      this.httpStatus === 429 ||
      this.errorCode === "PAY_001"
    );
  }
}

interface SnippeErrorBody {
  status?: string;
  code?: number;
  error_code?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

interface SnippeSuccess<T> {
  status: "success";
  code: number;
  data: T;
}

/** Money as it appears in a webhook or a list/get response: an object. */
export interface SnippeMoney {
  currency: string;
  value: number;
}

/** Money as it appears in a request body: a plain integer + currency. */
export interface SnippeMoneyInput {
  amount: number;
  currency: string;
}

async function snippeFetch<T>(
  path: string,
  init: {
    method: "GET" | "POST";
    body?: unknown;
    idempotencyKey?: string;
    signal?: AbortSignal;
  }
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getSnippeApiKey()}`,
    Accept: "application/json",
  };
  if (init.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (init.idempotencyKey) {
    if (init.idempotencyKey.length > SNIPPE_MAX_IDEMPOTENCY_KEY) {
      // Fail loudly here rather than letting Snippe answer PAY_001.
      throw new SnippeError(
        `Idempotency key must be <= ${SNIPPE_MAX_IDEMPOTENCY_KEY} characters (got ${init.idempotencyKey.length}).`,
        400,
        "validation_error"
      );
    }
    headers["Idempotency-Key"] = init.idempotencyKey;
  }

  let response: Response;
  try {
    response = await fetch(`${SNIPPE_BASE_URL}${path}`, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
      cache: "no-store",
    });
  } catch (cause) {
    throw new SnippeError(
      `Could not reach Snippe: ${(cause as Error).message}`,
      503,
      "network_error"
    );
  }

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new SnippeError(
        `Snippe returned a non-JSON response (HTTP ${response.status}).`,
        response.status,
        "invalid_response"
      );
    }
  }

  if (!response.ok) {
    const body = (parsed ?? {}) as SnippeErrorBody;
    throw new SnippeError(
      body.message || `Snippe request failed (HTTP ${response.status}).`,
      response.status,
      body.error_code ?? null
    );
  }

  const envelope = parsed as SnippeSuccess<T> | null;
  if (!envelope || envelope.status !== "success") {
    throw new SnippeError(
      "Snippe returned an unexpected response envelope.",
      500,
      "invalid_response"
    );
  }
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Payments (collection)
// ---------------------------------------------------------------------------

export type SnippePaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "voided"
  | "expired";

export interface SnippePayment {
  reference: string;
  status: SnippePaymentStatus;
  payment_type?: string;
  amount?: SnippeMoney;
  channel?: { type: string; provider: string };
  customer?: { phone?: string; name?: string; email?: string };
  settlement?: {
    gross?: SnippeMoney;
    fees?: SnippeMoney;
    net?: SnippeMoney;
  };
  external_reference?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
  completed_at?: string | null;
}

export interface CreatePaymentInput {
  amount: number;
  currency: string;
  phoneNumber: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  webhookUrl: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}

/**
 * POST /v1/payments — create a mobile-money payment intent.
 *
 * Snippe pushes a USSD prompt to `phoneNumber`; the brand authorises with
 * their PIN and the outcome arrives on `webhookUrl`. The response is ALWAYS
 * `pending` — never treat this call as proof of payment.
 */
export async function createPayment(
  input: CreatePaymentInput
): Promise<SnippePayment> {
  return snippeFetch<SnippePayment>("/v1/payments", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: {
      payment_type: "mobile",
      details: { amount: input.amount, currency: input.currency },
      phone_number: input.phoneNumber,
      customer: {
        firstname: input.customerFirstName,
        lastname: input.customerLastName,
        email: input.customerEmail,
      },
      webhook_url: input.webhookUrl,
      metadata: input.metadata,
    },
  });
}

/** GET /v1/payments/{reference} — reconcile a payment we have no webhook for. */
export async function getPayment(
  reference: string
): Promise<SnippePayment> {
  return snippeFetch<SnippePayment>(
    `/v1/payments/${encodeURIComponent(reference)}`,
    { method: "GET" }
  );
}

/** POST /v1/payments/{reference}/push — re-send the USSD push. */
export async function retriggerPaymentPush(
  reference: string
): Promise<SnippePayment> {
  return snippeFetch<SnippePayment>(
    `/v1/payments/${encodeURIComponent(reference)}/push`,
    { method: "POST" }
  );
}

// ---------------------------------------------------------------------------
// Disbursements (payouts)
// ---------------------------------------------------------------------------

export interface SnippePayoutFee {
  amount: number;
  fee_amount: number;
  total_amount: number;
  currency: string;
}

export interface SnippePayout {
  reference: string;
  status: "pending" | "completed" | "failed" | "reversed";
  amount?: SnippeMoney;
  fees?: SnippeMoney;
  total?: SnippeMoney;
  channel?: { type: string; provider: string };
  recipient?: { name?: string; phone?: string };
  external_reference?: string;
  failure_reason?: string;
}

export interface SnippeBalance {
  available: SnippeMoney;
  balance: SnippeMoney;
}

/**
 * GET /v1/payouts/fee?amount=N — the REAL payout fee, straight from Snippe.
 *
 * This is the fee-quote endpoint that exists for disbursements. There is no
 * equivalent for collections — collection fees are only observable after the
 * fact in `settlement.fees` (see lib/pricing.ts for how the brand-side
 * estimate is handled).
 */
export async function getPayoutFee(amount: number): Promise<SnippePayoutFee> {
  return snippeFetch<SnippePayoutFee>(
    `/v1/payouts/fee?amount=${encodeURIComponent(String(amount))}`,
    { method: "GET" }
  );
}

/** GET /v1/payments/balance — `available` is what can fund a payout. */
export async function getBalance(): Promise<SnippeBalance> {
  return snippeFetch<SnippeBalance>("/v1/payments/balance", { method: "GET" });
}

export interface SendPayoutInput {
  amount: number;
  recipientPhone: string;
  recipientName: string;
  narration: string;
  webhookUrl: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}

/**
 * POST /v1/payouts/send — send money to a mobile wallet.
 *
 * Amount + fees are debited from the Snippe balance immediately; if the payout
 * later fails the funds are returned automatically. The response is ALWAYS
 * `pending` — settlement is confirmed by the `payout.completed` webhook.
 */
export async function sendPayout(
  input: SendPayoutInput
): Promise<SnippePayout> {
  return snippeFetch<SnippePayout>("/v1/payouts/send", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: {
      amount: input.amount,
      channel: "mobile",
      recipient_phone: input.recipientPhone,
      recipient_name: input.recipientName,
      narration: input.narration,
      webhook_url: input.webhookUrl,
      metadata: input.metadata,
    },
  });
}

/** GET /v1/payouts/{reference} — reconcile a payout we have no webhook for. */
export async function getPayout(reference: string): Promise<SnippePayout> {
  return snippeFetch<SnippePayout>(
    `/v1/payouts/${encodeURIComponent(reference)}`,
    { method: "GET" }
  );
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export type SnippeWebhookType =
  | "payment.completed"
  | "payment.failed"
  | "payment.voided"
  | "payment.expired"
  | "payout.completed"
  | "payout.failed"
  | "payout.reversed";

export interface SnippeWebhookPayload {
  id: string;
  type: SnippeWebhookType | string;
  api_version?: string;
  created_at?: string;
  data: {
    reference: string;
    external_reference?: string;
    status?: string;
    /** OBJECT in webhooks — never a bare integer. */
    amount?: SnippeMoney;
    settlement?: {
      gross?: SnippeMoney;
      fees?: SnippeMoney;
      net?: SnippeMoney;
    };
    channel?: { type?: string; provider?: string };
    customer?: { phone?: string; name?: string; email?: string };
    metadata?: Record<string, unknown>;
    failure_reason?: string;
    completed_at?: string;
    /** Present on payout events. */
    fees?: SnippeMoney;
    recipient?: { name?: string; phone?: string };
  };
}

export class SnippeSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnippeSignatureError";
  }
}

/**
 * Verify a Snippe webhook and return the parsed payload.
 *
 * Signature = hex(HMAC-SHA256(secret, "{timestamp}.{rawBody}")).
 *
 * `rawBody` MUST be the exact bytes received. Parsing and re-serializing the
 * JSON changes whitespace/key order and breaks the HMAC — the caller is
 * responsible for passing `await request.text()` before any JSON.parse.
 *
 * Replay protection: the timestamp must be within
 * SNIPPE_WEBHOOK_TOLERANCE_SECONDS. Comparison is constant-time.
 */
export function verifyWebhook(
  rawBody: string,
  headers: {
    "x-webhook-timestamp": string | null | undefined;
    "x-webhook-signature": string | null | undefined;
  },
  secret: string = getSnippeWebhookSecret()
): SnippeWebhookPayload {
  const timestamp = headers["x-webhook-timestamp"];
  const signature = headers["x-webhook-signature"];

  if (!timestamp || !signature) {
    throw new SnippeSignatureError("Missing webhook signature headers.");
  }

  const eventTime = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(eventTime)) {
    throw new SnippeSignatureError("Invalid webhook timestamp.");
  }

  // Reject both stale AND far-future timestamps. A negative age is as
  // suspicious as an old one, and honouring it would let a captured signature
  // be replayed indefinitely by just moving the clock forward.
  const age = Math.abs(Math.floor(Date.now() / 1000) - eventTime);
  if (age > SNIPPE_WEBHOOK_TOLERANCE_SECONDS) {
    throw new SnippeSignatureError(
      "Webhook timestamp is outside the accepted tolerance."
    );
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const provided = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (
    provided.length !== computed.length ||
    !crypto.timingSafeEqual(provided, computed)
  ) {
    throw new SnippeSignatureError("Invalid webhook signature.");
  }

  // Only now is it safe to parse.
  return JSON.parse(rawBody) as SnippeWebhookPayload;
}

/** Build the signed message for a payload — used by tests and local tooling. */
export function signWebhookPayload(
  rawBody: string,
  timestamp: number,
  secret: string = getSnippeWebhookSecret()
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}