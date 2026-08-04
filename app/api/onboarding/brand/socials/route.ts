import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, signToken } from "@/lib/auth";
import { SocialPlatform } from "@prisma/client";

interface SocialInput {
  platform: SocialPlatform;
  handle: string;
  url?: string;
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { socials }: { socials: SocialInput[] } = await req.json();

    if (!socials || socials.length === 0) {
      return NextResponse.json(
        { error: "Add at least one social account" },
        { status: 400 }
      );
    }

    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!businessProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await Promise.all(
      socials.map((s) =>
        prisma.socialAccount.upsert({
          where: {
            businessId_platform: {
              businessId: businessProfile.id,
              platform: s.platform,
            },
          },
          update: { handle: s.handle, url: s.url },
          create: {
            businessId: businessProfile.id,
            platform: s.platform,
            handle: s.handle,
            url: s.url,
          },
        })
      )
    );

    await prisma.user.update({
      where: { id: authUser.userId },
      data: { onboardingStep: 3 },
    });

    // ✅ Re-issue JWT with updated onboardingStep
    const newToken = await signToken({
      userId: authUser.userId,
      role: authUser.role,
      onboardingDone: false,
      onboardingStep: 3,
      type: "access",
    });

    const res = NextResponse.json({
      success: true,
      nextStep: "/onboarding/brand-details",
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
    console.error("SOCIALS ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}