// app/api/payouts/route.ts
//
// GET /api/payouts  -> role-aware payout ledger
//   - ADMIN:   every payout on the platform (schedule included)
//   - CREATOR: their own payout history
//
// POST /api/payouts -> a creator requests a payout of their available balance.
//   Server-side validation in lib/payout.ts: balance must clear the minimum
//   payout threshold, and the creator cannot already have an active payout.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { PAYMENT_METHODS, validatePaymentPhone } from "@/lib/payment";
import {
  createPayout,
  getAdminPayouts,
  getCreatorPayouts,
} from "@/lib/payout";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "ADMIN") {
    return NextResponse.json({ payouts: await getAdminPayouts() });
  }

  if (user.role === "CREATOR") {
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
    return NextResponse.json({
      payouts: await getCreatorPayouts(creator.id),
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "CREATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const paymentMethod =
      typeof body.paymentMethod === "string" ? body.paymentMethod.trim() : "";
    const paymentPhone =
      typeof body.paymentPhone === "string" ? body.paymentPhone.trim() : "";

    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod as never)) {
      return NextResponse.json(
        { error: "Select a valid payment method for your payout." },
        { status: 400 }
      );
    }
    const phoneError = validatePaymentPhone(paymentMethod, paymentPhone);
    if (phoneError) {
      return NextResponse.json({ error: phoneError }, { status: 400 });
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

    const result = await createPayout(
      creator.id,
      new Date(),
      { paymentMethod: paymentMethod || null, paymentPhone: paymentPhone || null }
    );

    if (!result.payout) {
      return NextResponse.json(
        { error: result.error ?? "Payout failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ payout: result.payout }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
