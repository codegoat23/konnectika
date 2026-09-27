// app/api/admin/campaign/[campaignId]/payment-proofs/route.ts
//
// GET /api/admin/campaign/:campaignId/payment-proofs -> ADMIN lists every
//      payment proof submitted against a campaign, newest first. Admins can
//      verify/reject them via /api/admin/payment-proofs/:id.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getCampaignPaymentProofs } from "@/lib/payments";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
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

  const { campaignId } = await params;
  const proofs = await getCampaignPaymentProofs(campaignId);
  return NextResponse.json({ proofs });
}