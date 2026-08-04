import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { SocialPlatform } from "@prisma/client";

const VALID_PLATFORMS: SocialPlatform[] = [
  "TWITTER",
  "INSTAGRAM",
  "TIKTOK",
  "YOUTUBE",
  "FACEBOOK",
  "LINKEDIN",
];

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = await params;
  if (!VALID_PLATFORMS.includes(platform as SocialPlatform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  if (authUser.role === "BRAND") {
    const business = await prisma.businessProfile.findUnique({
      where: { userId: authUser.userId },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    await prisma.socialAccount.deleteMany({
      where: {
        businessId: business.id,
        platform: platform as SocialPlatform,
      },
    });
  } else {
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: authUser.userId },
      select: { id: true },
    });
    if (!creator) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    await prisma.socialAccount.deleteMany({
      where: {
        creatorId: creator.id,
        platform: platform as SocialPlatform,
      },
    });
  }

  return NextResponse.json({ success: true });
}
