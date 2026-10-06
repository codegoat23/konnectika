// app/api/payouts/[id]/send/route.ts
//
// POST /api/payouts/:id/send -> hand an APPROVED payout to Snippe.
//
//   PENDING -> APPROVED (admin approves, existing route)
//   APPROVED -> PROCESSING (this route: fee quoted + funds sent)
//   PROCESSING -> PAID | FAILED (verified Snippe webhook)
//
// ADMIN only. The approval stays a human gate; only the money movement and the
// reference recording are automated.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { sendPayoutToSnippe } from "@/lib/payout";

function resolveWebhookUrl(req: Request): string {
  const configured = process.env.SNIPPE_WEBHOOK_URL?.trim();
  if (configured) return configured;

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    `https://${req.headers.get("host") ?? ""}`;
  return `${origin.replace(/\/$/, "")}/api/webhooks/snippe`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Same gate as the scheduler: either an authenticated admin, or the shared
  // cron secret for unattended runs. Requires an explicit signal either way —
  // an absent Authorization header must never be read as an admin session.
  const authHeader = req.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET?.trim();
  const isCron = Boolean(
    cronSecret && authHeader === `Bearer ${cronSecret}`
  );

  let isAdmin = false;
  if (!isCron) {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: only an admin can send payouts" },
        { status: 403 }
      );
    }
    isAdmin = true;
  }

  const { id } = await params;
  const result = await sendPayoutToSnippe(id, resolveWebhookUrl(req));

  if (!result.ok) {
    const status =
      result.code === "NOT_FOUND"
        ? 404
        : result.code === "INVALID_STATE"
          ? 409
          : result.code === "PROVIDER_ERROR"
            ? 502
            : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  // 202: funds reserved at Snippe, delivery pending. PAID only on webhook.
  return NextResponse.json(
    {
      payout: result.payout,
      fee: result.fee,
      status: "PROCESSING",
      via: isAdmin ? "admin" : "cron",
    },
    { status: 202 }
  );
}