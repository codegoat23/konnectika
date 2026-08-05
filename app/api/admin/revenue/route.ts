// app/api/admin/revenue/route.ts
//
// GET /api/admin/revenue -> platform revenue ledger for admins.
//   ?type=CREATOR_FEE|BRAND_FEE
//   ?status=ACCRUED|PAID
//   ?campaignId=<id>
//   ?limit=<n>

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  getPlatformRevenue,
  getPlatformRevenueSummary,
} from "@/lib/platform-revenue";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const campaignId = searchParams.get("campaignId") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 100);

  if (type && type !== "CREATOR_FEE" && type !== "BRAND_FEE") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (status && status !== "ACCRUED" && status !== "PAID") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [records, summary] = await Promise.all([
    getPlatformRevenue({
      type: type as "CREATOR_FEE" | "BRAND_FEE" | undefined,
      status: status as "ACCRUED" | "PAID" | undefined,
      campaignId: campaignId || undefined,
      limit: Number.isFinite(limit) ? limit : 100,
    }),
    getPlatformRevenueSummary(),
  ]);

  return NextResponse.json({ records, summary });
}
