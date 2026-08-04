import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();

    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.creatorProfile.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    await prisma.creatorProfile.update({
      where: { userId: authUser.userId },
      data: { username },
    });

    await prisma.user.update({
      where: { id: authUser.userId },
      data: { onboardingStep: 2 },
    });

    // ✅ Re-issue JWT with updated onboardingStep
    const newToken = await signToken({
      userId: authUser.userId,
      role: authUser.role,
      onboardingDone: false,
      onboardingStep: 2,
      type: "access",
    });

    const res = NextResponse.json({
      success: true,
      nextStep: "/onboarding/socials",
    });

    // ✅ Overwrite the stale cookie
    res.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("USERNAME ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}