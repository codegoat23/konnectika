// app/api/payouts/generate/route.ts
//
// POST /api/payouts/generate -> run the monthly payout schedule.
//
// This is the ONLY trigger for scheduled payout generation. It used to also
// fire from the admin payouts page render (a GET with a write side-effect), so
// simply opening the dashboard could create payout rows; that is gone — see
// getAdminPayouts() in lib/payout.ts.
//
// Two ways to authenticate, because a scheduler and an admin are different
// callers:
//   - CRON_SECRET (bearer token) — for Vercel Cron / GitHub Actions / any
//     external scheduler. Preferred for unattended runs.
//   - an ADMIN session — for a deliberate manual trigger from the dashboard.
//
// Point your scheduler at this route on the payout day. It is a no-op on any
// other day (runScheduledPayouts checks isPayoutDay), so a daily cron is fine.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { runScheduledPayouts } from "@/lib/payout";

function isValidCronToken(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  // Accept the raw secret too — most schedulers can set an arbitrary header.
  return bearer === secret || req.headers.get("x-cron-secret") === secret;
}

export async function POST(req: Request) {
  const authorizedByToken = isValidCronToken(req);

  if (!authorizedByToken) {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { generated } = await runScheduledPayouts();
  return NextResponse.json({ generated });
}