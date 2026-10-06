// app/api/webhooks/snippe/route.ts
//
// POST /api/webhooks/snippe
//
// The single source of truth for money settlement. Nothing here trusts the
// caller: the request is accepted only if it carries a valid HMAC-SHA256
// signature over its own raw bytes, and no status is ever derived from a client
// response.
//
// Security order of operations (none of these steps may be reordered):
//   1. read the RAW body as text — never `request.json()`, because the HMAC is
//      computed over the exact bytes sent and re-serialization breaks it
//   2. verify X-Webhook-Signature (constant-time) + reject timestamps older
//      than 5 minutes (replay protection)
//   3. only then parse the JSON and dispatch on the verified `type`
//
// Idempotency: the envelope `id` is inserted into WebhookEvent, whose primary
// key IS that id. A duplicate delivery hits a unique-violation and returns 200
// without re-applying anything. Every settlement write is additionally guarded
// by a conditional status update, so even a fresh event id for an already
// settled intent cannot double-apply.
//
// Retry safety: the event row is only a *reservation* while we process. If
// processing throws, the row is removed before the 5xx goes back, so Snippe's
// retry is processed instead of being swallowed as a duplicate. A delivery is
// therefore never acknowledged as done unless its work actually landed.
//
// This route is unauthenticated by design (Snippe has no session), so the
// signature check is the entire access control.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  verifyWebhook,
  SnippeSignatureError,
  type SnippeWebhookPayload,
} from "@/lib/snippe";
import { applyPaymentWebhook } from "@/lib/payment-intents";
import { failPayout, settleCompletedPayout } from "@/lib/payout";
import { prisma } from "@/lib/prisma";

/** Webhooks are not session-authenticated; always read the body as text. */
export const dynamic = "force-dynamic";

const SIGNATURE_HEADER_NAMES = {
  timestamp: "x-webhook-timestamp",
  signature: "x-webhook-signature",
} as const;

export async function POST(req: Request) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Could not read body" }, { status: 400 });
  }

  // 2. Verify BEFORE parsing or touching the database.
  let payload: SnippeWebhookPayload;
  try {
    payload = verifyWebhook(rawBody, {
      "x-webhook-timestamp": req.headers.get(SIGNATURE_HEADER_NAMES.timestamp),
      "x-webhook-signature": req.headers.get(SIGNATURE_HEADER_NAMES.signature),
    });
  } catch (error) {
    if (error instanceof SnippeSignatureError) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  if (!payload?.id || !payload?.type) {
    return NextResponse.json({ error: "Malformed webhook envelope" }, { status: 400 });
  }

  // 3. Deduplicate. The primary key on WebhookEvent.id makes a repeat delivery
  //    fail here, which is exactly the behaviour we want: acknowledge with 200
  //    and do nothing.
  try {
    await prisma.webhookEvent.create({
      data: {
        id: payload.id,
        provider: "snippe",
        type: payload.type,
        payload: JSON.parse(JSON.stringify(payload)),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  // 4. Apply, then stamp the event as processed.
  try {
    const outcome = await dispatch(payload);
    await prisma.webhookEvent.update({
      where: { id: payload.id },
      data: { processedAt: new Date() },
    });
    return NextResponse.json({ received: true, ...outcome });
  } catch (error) {
    console.error("[snippe] webhook processing failed", payload.id, error);

    // Release the dedupe reservation so Snippe's retry is actually processed
    // rather than being swallowed as a duplicate. Without this a transient
    // failure would permanently lose the settlement.
    await prisma.webhookEvent
      .delete({ where: { id: payload.id } })
      .catch((cleanupError) =>
        console.error(
          "[snippe] could not release webhook reservation",
          payload.id,
          cleanupError
        )
      );

    // Non-2xx so Snippe retries (3 → 6 → 12 → 24 min, abandoned after 5).
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/** The payout id we echoed into `metadata` on POST /v1/payouts/send. */
function payoutIdFromMetadata(payload: SnippeWebhookPayload): string | null {
  const raw = payload.data?.metadata?.payoutId;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

async function dispatch(
  payload: SnippeWebhookPayload
): Promise<Record<string, unknown>> {
  const reference = payload.data?.reference;

  switch (payload.type) {
    case "payment.completed":
    case "payment.failed":
    case "payment.expired":
    case "payment.voided": {
      const result = await applyPaymentWebhook(payload);
      if (!result.ok) {
        // An event we cannot match is not retryable — retrying will never make
        // the reference resolvable. Record and move on.
        console.error(`[snippe] ${payload.type} unapplied:`, result.error);
        return { applied: false, error: result.code };
      }
      return { applied: result.applied, event: result.event };
    }

    case "payout.completed": {
      const result = await settleCompletedPayout(reference, {
        paymentReference: payload.data.external_reference ?? null,
        payoutId: payoutIdFromMetadata(payload),
      });
      if (!result.ok) {
        console.error("[snippe] payout.completed unapplied:", result.error);
        return { applied: false, error: result.code };
      }
      return { applied: result.applied };
    }

    case "payout.failed":
    case "payout.reversed": {
      const result = await failPayout(
        reference,
        payload.data.failure_reason ?? null,
        { payoutId: payoutIdFromMetadata(payload) }
      );
      if (!result.ok) {
        console.error("[snippe] payout.failed unapplied:", result.error);
        return { applied: false, error: result.code };
      }
      return { applied: result.applied };
    }

    default:
      return { applied: false, reason: "UNHANDLED_EVENT" };
  }
}