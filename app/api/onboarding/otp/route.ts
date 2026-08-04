import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, signToken } from "@/lib/auth";
import { verifyOtp, clearOtpCookie } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { otp } = await req.json();

    if (!otp) {
      return NextResponse.json(
        { error: "OTP required" },
        { status: 400 }
      );
    }

    const isValid = await verifyOtp(String(otp));

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      );
    }

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: {
        userId: authUser.userId,
      },
    });

    if (!creatorProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    await prisma.creatorProfile.update({
      where: {
        id: creatorProfile.id,
      },
      data: {
        phoneVerified: true,
      },
    });

    await prisma.user.update({
      where: {
        id: authUser.userId,
      },
      data: {
        onboardingStep: 5,
        onboardingDone: true,
      },
    });

    await clearOtpCookie();

    // ✅ Fresh JWT for middleware
    const newToken = await signToken({
      userId: authUser.userId,
      role: authUser.role,
      onboardingStep: 5,
      onboardingDone: true,
      type: "access",
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: "/dashboard",
    });

    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("OTP ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}