// app/api/campaigns/[id]/pay/route.ts
//
// POST /api/campaigns/[id]/pay -> start (or retry) a brand's Snippe payment
// for one of their own campaigns.
//
//   GET  -> the charge breakdown + current payment state, for rendering the
//           "budget + platform fee + payment fee = total" summary.
//
// This route NEVER marks a campaign PAID. It creates a payment intent and
// returns USSD instructions; settlement happens only when a signature-verified
// Snippe webhook arrives at /api/webhooks/snippe.

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createPaymentIntent,
  getCampaignChargeBreakdown,
  getLatestPaymentIntent,
} from "@/lib/payment-intents";

const paySchema = z.object({
  phoneNumber: z.string().trim().min(1).max(40),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
});

/** Snippe rejects non-HTTPS webhook URLs, so derive it from the request. */
function resolveWebhookUrl(req: Request): string {
  const configured = process.env.SNIPPE_WEBHOOK_URL?.trim();
  if (configured) return configured;

  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    `https://${req.headers.get("host") ?? ""}`;
  return `${origin.replace(/\/$/, "")}/api/webhooks/snippe`;
}

async function loadOwnCampaign(campaignId: string, brandUserId: string) {
  return prisma.campaign.findFirst({
    where: { id: campaignId, businessProfile: { userId: brandUserId } },
    select: {
      id: true,
      name: true,
      budgetTotal: true,
      platformFee: true,
      totalCharge: true,
      paymentStatus: true,
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "BRAND") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const campaign = await loadOwnCampaign(id, user.userId);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const [breakdown, intent] = await Promise.all([
    getCampaignChargeBreakdown(campaign.id),
    getLatestPaymentIntent(campaign.id),
  ]);

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      budgetTotal: campaign.budgetTotal,
      paymentStatus: campaign.paymentStatus,
    },
    breakdown,
    // Snapshotted on the live attempt; falls back to the campaign's own total
    // for campaigns that have never been paid through Snippe.
    intent: intent
      ? {
          id: intent.id,
          attempt: intent.attempt,
          status: intent.status,
          totalCharge: intent.totalCharge,
          platformFee: intent.platformFee,
          providerFee: intent.providerFee,
          providerFeeRate: intent.providerFeeRate,
          actualProviderFee: intent.actualProviderFee,
          channel: intent.channel,
          customerPhone: intent.customerPhone,
          failureReason: intent.failureReason,
          createdAt: intent.createdAt,
        }
      : null,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "BRAND") {
    return NextResponse.json(
      { error: "Forbidden: only brands pay for campaigns" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = paySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "A valid phone number and name are required to start a payment.",
        issues: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { id } = await params;
  const campaign = await loadOwnCampaign(id, user.userId);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const result = await createPaymentIntent({
    campaignId: campaign.id,
    brandUserId: user.userId,
    phoneNumber: parsed.data.phoneNumber,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: parsed.data.email,
    webhookUrl: resolveWebhookUrl(req),
  });

  if (!result.ok) {
    const status =
      result.code === "NOT_FOUND"
        ? 404
        : result.code === "FORBIDDEN"
          ? 403
          : result.code === "ALREADY_PAID"
            ? 409
            : result.code === "PROVIDER_ERROR"
              ? 502
              : result.code === "IN_FLIGHT"
                ? 409
                : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  // 202: the payment is in flight. The campaign is NOT paid yet — only the
  // verified webhook can do that.
  return NextResponse.json(
    {
      intentId: result.intentId,
      breakdown: result.breakdown,
      instructions: result.instructions,
      paymentStatus: "AWAITING_PAYMENT",
    },
    { status: 202 }
  );
}