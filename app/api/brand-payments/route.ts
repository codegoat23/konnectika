// app/api/brand-payments/route.ts
//
// POST /api/brand-payments -> a BRAND records that they made a manual payment
//       for one of their OWN campaigns. Server-side checks enforce ownership,
//       exact amount (totalCharge) and the payment lifecycle. Creates the
//       PaymentProof and flips campaign.paymentStatus -> PROOF_SUBMITTED.
//
// GET  /api/brand-payments?campaignId=... -> the brand's OWN proofs for a
//       campaign (any brand can only ever see their own submissions).

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  createCampaignPaymentProof,
  getBrandCampaignPaymentProofs,
} from "@/lib/payments";
import { z } from "zod";

const submitSchema = z.object({
  campaignId: z.string().min(1),
  amount: z.number().int().positive(),
  paymentMethod: z.string().trim().min(1).max(100),
  transactionReference: z.string().trim().min(1).max(200),
  proofUrl: z.string().trim().max(500).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "BRAND") {
    return NextResponse.json(
      { error: "Forbidden: only brands can submit campaign payment proof" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createCampaignPaymentProof({
    campaignId: parsed.data.campaignId,
    brandUserId: user.userId,
    amount: parsed.data.amount,
    paymentMethod: parsed.data.paymentMethod,
    transactionReference: parsed.data.transactionReference,
    proofUrl: parsed.data.proofUrl,
    note: parsed.data.note,
  });

  if (!result.ok) {
    const status =
      result.code === "NOT_FOUND"
        ? 404
        : result.code === "FORBIDDEN"
        ? 403
        : result.code === "ALREADY_PAID" || result.code === "PROOF_ALREADY_SUBMITTED"
        ? 409
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ proof: result.proof }, { status: 201 });
}

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "BRAND") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId");

  if (!campaignId) {
    return NextResponse.json(
      { error: "campaignId query parameter is required" },
      { status: 400 }
    );
  }

  // Only proofs belonging to the requesting brand's campaigns.
  const proofs = await getBrandCampaignPaymentProofs(campaignId, user.userId);

  return NextResponse.json({
    proofs,
    campaignId,
  });
}