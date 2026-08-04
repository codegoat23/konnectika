// app/api/wallet/withdrawals/[id]/status/route.ts
//
// PATCH /api/wallet/withdrawals/:id/status  -> admin advances a withdrawal
//        (PROCESSING | PAID | REJECTED). Only admins can mutate withdrawal
//        status. On PAID, linked earnings become WITHDRAWN; on REJECTED they
//        return to the creator's available balance.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { adminUpdateWithdrawal } from "@/lib/wallet";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["PROCESSING", "PAID", "REJECTED"]),
  paymentReference: z.string().trim().max(200).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = statusSchema.safeParse(body ?? {});

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = await adminUpdateWithdrawal({
      withdrawalId: id,
      status: parsed.data.status,
      paymentReference: parsed.data.paymentReference,
      adminUserId: user.userId,
    });

    if (!result.withdrawal) {
      const statusCode = result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { error: result.error ?? "Update failed" },
        { status: statusCode }
      );
    }

    return NextResponse.json({ withdrawal: result.withdrawal });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
