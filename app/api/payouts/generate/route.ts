// app/api/payouts/generate/route.ts
//
// POST /api/payouts/generate  -> admin runs the monthly payout schedule now
//
// In V1 there is no cron job. This gives the admin a manual trigger for
// runScheduledPayouts() (which itself only generates payouts on the
// configured payout day). It also runs automatically when the admin opens the
// payouts page.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { runScheduledPayouts } from "@/lib/payout";

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { generated } = await runScheduledPayouts();
  return NextResponse.json({ generated });
}
