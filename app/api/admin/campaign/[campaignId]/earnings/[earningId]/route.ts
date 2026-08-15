// app/api/admin/campaign/[campaignId]/earnings/[earningId]/route.ts
//
// PATCH /api/admin/campaign/:campaignId/earnings/:earningId
//   body { status: "AVAILABLE" }
//
// Admin approves a creator's earning for a campaign, flipping it APPROVED ->
// AVAILABLE (ready to roll into a payout). Admin-only; the earning must belong
// to the campaign in the URL. This is the ONLY way earnings become AVAILABLE
// (there is no time-based auto-settlement).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import {
  approveEarningAvailable,
  BusinessRuleError,
} from "@/lib/payment-flow";
import { z } from "zod";

const bodySchema = z.object({
  status: z.literal("AVAILABLE"),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ campaignId: string; earningId: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: only admins can approve creator earnings" },
      { status: 403 }
    );
  }

  const { campaignId, earningId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const earning = await prisma.earning.findUnique({
    where: { id: earningId },
    select: { id: true, campaignId: true },
  });
  if (!earning || earning.campaignId !== campaignId) {
    return NextResponse.json(
      { error: "Earning not found in this campaign" },
      { status: 404 }
    );
  }

  try {
    const updated = await prisma.$transaction((tx) =>
      approveEarningAvailable(tx, earningId)
    );
    return NextResponse.json({ earning: updated });
  } catch (err) {
    if (err instanceof BusinessRuleError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
