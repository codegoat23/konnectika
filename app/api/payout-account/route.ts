// app/api/payout-account/route.ts
//
// GET /api/payout-account -> CREATOR's saved payout destination (or null)
// PUT /api/payout-account -> CREATOR creates/updates their payout account
//
// The creator id always comes from the session — never from the client.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayoutAccount, upsertPayoutAccount } from "@/lib/payments";
import { z } from "zod";

const putSchema = z.object({
  method: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(30).optional().nullable(),
  accountName: z.string().trim().max(200).optional().nullable(),
  bankName: z.string().trim().max(200).optional().nullable(),
  accountNumber: z.string().trim().max(100).optional().nullable(),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role === "ADMIN") {
    return NextResponse.json({ payoutAccount: null });
  }

  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: user.userId },
    select: { id: true },
  });
  if (!creator) {
    return NextResponse.json({ payoutAccount: null });
  }

  const payoutAccount = await getPayoutAccount(creator.id);
  return NextResponse.json({ payoutAccount });
}

export async function PUT(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "CREATOR") {
    return NextResponse.json(
      { error: "Forbidden: only creators can save a payout account" },
      { status: 403 }
    );
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
  const parsed = putSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await upsertPayoutAccount(creator.id, {
    method: parsed.data.method,
    phone: parsed.data.phone,
    accountName: parsed.data.accountName,
    bankName: parsed.data.bankName,
    accountNumber: parsed.data.accountNumber,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ payoutAccount: result.account });
}