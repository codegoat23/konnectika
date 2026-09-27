// app/api/payment-receiving-accounts/[id]/route.ts
//
// PATCH /api/payment-receiving-accounts/:id -> ADMIN updates an account (or
//        toggles it active/inactive)
// DELETE /api/payment-receiving-accounts/:id -> ADMIN removes an account
//
// Non-admin callers are rejected here AND in lib/payments.ts.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setReceivingAccountActive } from "@/lib/payments";
import { z } from "zod";

const patchSchema = z.object({
  type: z.enum(["MOBILE_MONEY", "BANK"]).optional(),
  provider: z.string().trim().min(1).max(100).optional(),
  accountName: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  accountNumber: z.string().trim().max(100).optional().nullable(),
  branchDetail: z.string().trim().max(200).optional().nullable(),
  extraDetails: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
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
      { error: "Forbidden: only an admin can manage receiving accounts" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data = parsed.data as Record<string, unknown>;

  if (
    data.isActive === undefined &&
    data.type === undefined &&
    data.provider === undefined &&
    data.accountName === undefined &&
    data.phone === undefined &&
    data.accountNumber === undefined &&
    data.branchDetail === undefined &&
    data.extraDetails === undefined
  ) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  // A boolean-only toggle keeps the account data intact.
  if (
    Object.keys(data).length === 1 &&
    typeof data.isActive === "boolean"
  ) {
    const result = await setReceivingAccountActive(id, data.isActive);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Receiving account not found." ? 404 : 400 }
      );
    }
    return NextResponse.json({ account: result.account });
  }

  const account = await prisma.receivingAccount.update({
    where: { id },
    data: {
      type: data.type as never,
      provider: data.provider as string,
      accountName: data.accountName as string,
      phone: typeof data.phone === "string" ? data.phone : null,
      accountNumber:
        typeof data.accountNumber === "string" ? data.accountNumber : null,
      branchDetail:
        typeof data.branchDetail === "string" ? data.branchDetail : null,
      extraDetails:
        typeof data.extraDetails === "string" ? data.extraDetails : null,
      isActive:
        typeof data.isActive === "boolean" ? data.isActive : undefined,
    },
  }).catch(() => null);

  if (!account) {
    return NextResponse.json(
      { error: "Receiving account not found or update failed" },
      { status: 404 }
    );
  }
  return NextResponse.json({ account });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: only an admin can remove receiving accounts" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    await prisma.receivingAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Receiving account not found" },
      { status: 404 }
    );
  }
}