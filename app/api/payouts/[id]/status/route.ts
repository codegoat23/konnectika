// app/api/payouts/[id]/status/route.ts
//
// PATCH /api/payouts/:id/status  -> admin advances a payout
//   APPROVE -> PENDING -> APPROVED (payout queued for payment)
//   REJECT  -> PENDING/APPROVED -> REJECTED (earnings roll over)
//   PAID    -> APPROVED -> PAID (admin processed the manual payment)
//
// Only ADMIN can mutate payout status (and only ADMIN can mark a payout PAID —
// enforced here AND in lib/payout.ts, so a brand/creator that crafts the
// request directly still gets a 403).

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  approvePayout,
  rejectPayout,
  markPayoutPaid,
} from "@/lib/payout";
import { z } from "zod";

const bodySchema = z.object({
  status: z.enum(["APPROVE", "REJECT", "PAID"]),
  paymentReference: z.string().trim().max(200).optional(),
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
      { error: "Forbidden: only an admin can manage payouts" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { id } = await params;

  switch (parsed.data.status) {
    case "APPROVE": {
      const result = await approvePayout(id, user.userId);
      if (!result.payout) {
        return NextResponse.json(
          { error: result.error ?? "Failed to approve payout" },
          { status: result.code === "NOT_FOUND" ? 404 : 400 }
        );
      }
      return NextResponse.json({ payout: result.payout });
    }
    case "REJECT": {
      const result = await rejectPayout(id, user.userId, parsed.data.rejectionReason);
      if (!result.payout) {
        return NextResponse.json(
          { error: result.error ?? "Failed to reject payout" },
          { status: result.code === "NOT_FOUND" ? 404 : 400 }
        );
      }
      return NextResponse.json({ payout: result.payout });
    }
    case "PAID": {
      const result = await markPayoutPaid({
        payoutId: id,
        adminUserId: user.userId,
        role: user.role,
        paymentReference: parsed.data.paymentReference,
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
      return NextResponse.json({ payout: result.payout });
    }
  }
}
