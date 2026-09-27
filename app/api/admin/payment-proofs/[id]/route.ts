// app/api/admin/payment-proofs/[id]/route.ts
//
// PATCH /api/admin/payment-proofs/:id -> ADMIN verifies or rejects a brand's
//       campaign payment proof.
//       { action: "VERIFY" }                          -> campaign becomes PAID
//       { action: "REJECT", rejectionReason: "..." }  -> campaign back to UNPAID
//
// Only ADMIN is accepted here; the state transitions themselves are guarded
// again in lib/payments.ts.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { reviewCampaignPaymentProof } from "@/lib/payments";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["VERIFY", "REJECT"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: only an admin can review payment proofs" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { id } = await params;
  const result = await reviewCampaignPaymentProof({
    proofId: id,
    adminUserId: user.userId,
    action: parsed.data.action,
    rejectionReason: parsed.data.rejectionReason,
  });

  if (!result.ok) {
    const status =
      result.code === "NOT_FOUND"
        ? 404
        : result.code === "FORBIDDEN"
        ? 403
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ proof: result.proof });
}