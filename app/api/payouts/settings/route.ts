// app/api/payouts/settings/route.ts
//
// GET  /api/payouts/settings  -> current payout settings (admin page)
// PATCH /api/payouts/settings -> admin changes minimum payout amount / day
//
// Both are admin-only. The settings live in the PlatformSetting table and are
// validated + persisted in lib/payout.ts.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  getPlatformPayoutSettings,
  updatePlatformPayoutSettings,
} from "@/lib/payout";
import { z } from "zod";

const bodySchema = z.object({
  minimumPayoutAmount: z.number().int().positive().max(1_000_000_000).optional(),
  payoutDay: z.number().int().min(1).max(31).optional(),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ settings: await getPlatformPayoutSettings() });
}

export async function PATCH(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await updatePlatformPayoutSettings({
    minimumPayoutAmount: parsed.data.minimumPayoutAmount,
    payoutDay: parsed.data.payoutDay,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to update settings" },
      { status: 400 }
    );
  }

  return NextResponse.json({ settings: result.settings });
}
