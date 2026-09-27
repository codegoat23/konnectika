// app/api/payment-receiving-accounts/route.ts
//
// GET  /api/payment-receiving-accounts?method=... -> any authenticated user
//       returns the ACTIVE Konnectika receiving account(s). A mobile-money
//       method filters by provider; anything else returns the active bank(s).
//
// POST /api/payment-receiving-accounts -> ADMIN only
//       creates/updates a Konnectika receiving account (the destination brands
//       are shown when they go to pay).

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  getReceivingAccountsForMethod,
  getReceivingAccounts,
  upsertReceivingAccount,
} from "@/lib/payments";
import { z } from "zod";

const createSchema = z.object({
  id: z.string().optional().nullable(),
  type: z.enum(["MOBILE_MONEY", "BANK"]),
  provider: z.string().trim().min(1).max(100),
  accountName: z.string().trim().min(1).max(200),
  phone: z.string().trim().max(30).optional().nullable(),
  accountNumber: z.string().trim().max(100).optional().nullable(),
  branchDetail: z.string().trim().max(200).optional().nullable(),
  extraDetails: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const method = searchParams.get("method");

  if (method || user.role !== "ADMIN") {
    const accounts = await getReceivingAccountsForMethod(method);
    return NextResponse.json({ accounts });
  }

  const accounts = await getReceivingAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: only an admin can configure receiving accounts" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await upsertReceivingAccount(
    parsed.data.id ?? null,
    {
      type: parsed.data.type,
      provider: parsed.data.provider,
      accountName: parsed.data.accountName,
      phone: parsed.data.phone,
      accountNumber: parsed.data.accountNumber,
      branchDetail: parsed.data.branchDetail,
      extraDetails: parsed.data.extraDetails,
      isActive: parsed.data.isActive,
    }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ account: result.account }, { status: 201 });
}