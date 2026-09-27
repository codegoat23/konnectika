// app/api/admin/payment-proofs/route.ts
//
// GET /api/admin/payment-proofs -> ADMIN lists proofs awaiting verification
//      across all campaigns (newest last), for the admin Payments dashboard.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getPendingCampaignPaymentProofs } from "@/lib/payments";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: only admins can view payment proofs" },
      { status: 403 }
    );
  }

  const proofs = await getPendingCampaignPaymentProofs();
  return NextResponse.json({ proofs });
}