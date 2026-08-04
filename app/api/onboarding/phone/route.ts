import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, signToken } from "@/lib/auth";
import { issueOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone required" },
        { status: 400 }
      );
    }

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!creatorProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    await prisma.creatorProfile.update({
      where: { id: creatorProfile.id },
      data: { phone },
    });

    await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        onboardingStep: 4,
      },
    });

    // Generate a random OTP and store a hash of it in a signed cookie.
    // TODO: Replace the dev-only console log with a real SMS/WhatsApp
    // provider so the code actually reaches the creator's phone.
    const otp = await issueOtp(phone);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
    }

    // ✅ Re-issue JWT with updated onboarding step
    const newToken = await signToken({
      userId: authUser.userId,
      role: authUser.role,
      onboardingStep: 4,
      onboardingDone: false,
      type: "access",
    });

    const res = NextResponse.json({
      success: true,
      nextStep: "/onboarding/otp",
    });

    // ✅ Replace stale cookie
    res.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("PHONE ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}