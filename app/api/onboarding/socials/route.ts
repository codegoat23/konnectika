import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
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

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: authUser.userId },
    });

    if (!creatorProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await Promise.all(
      socials.map((s) =>
        prisma.socialAccount.upsert({
          where: {
            creatorId_platform: {
              creatorId: creatorProfile.id,
              platform: s.platform,
            },
          },
          update: { handle: s.handle, url: s.url },
          create: {
            creatorId: creatorProfile.id,
            platform: s.platform,
            handle: s.handle,
            url: s.url,
          },
        })
      )
    );

    await prisma.user.update({
      where: { id: authUser.userId },
      data: { onboardingStep: 3, onboardingDone: true },
    });

    return NextResponse.json({
      success: true,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    console.error("SOCIALS ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
