// app/api/wallet/withdrawals/route.ts
//
// POST /api/wallet/withdrawals  -> creator requests a withdrawal of their
//                                  full available balance

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { requestWithdrawal } from "@/lib/wallet";
import { z } from "zod";

const bodySchema = z.object({
  paymentMethod: z.string().trim().max(100).optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "CREATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body ?? {});

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = await requestWithdrawal(
      creator.id,
      parsed.data.paymentMethod
    );

    if (!result.withdrawal) {
      return NextResponse.json(
        { error: result.error ?? "Withdrawal failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ withdrawal: result.withdrawal }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
