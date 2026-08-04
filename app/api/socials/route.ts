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

async function getProfileId(authUser: { userId: string; role: string }) {
  if (authUser.role === "BRAND") {
    const business = await prisma.businessProfile.findUnique({
      where: { userId: authUser.userId },
      select: { id: true },
    });
    return business ? { kind: "businessId" as const, id: business.id } : null;
  }

  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: authUser.userId },
    select: { id: true },
  });
  return creator ? { kind: "creatorId" as const, id: creator.id } : null;
}

async function listSocials(
  kind: "businessId" | "creatorId",
  id: string
) {
  return prisma.socialAccount.findMany({
    where: kind === "businessId" ? { businessId: id } : { creatorId: id },
    orderBy: { createdAt: "asc" },
  });
}

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfileId(authUser);
  if (!profile) {
    return NextResponse.json({ socials: [] });
  }

  const socials = await listSocials(profile.kind, profile.id);
  return NextResponse.json({ socials });
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    platform?: unknown;
    handle?: unknown;
    url?: unknown;
  };

  const platform = body.platform as SocialPlatform;
  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  if (typeof body.handle !== "string" || !body.handle.trim()) {
    return NextResponse.json({ error: "Handle is required" }, { status: 400 });
  }

  const handle = body.handle.trim();
  const url = typeof body.url === "string" && body.url.trim() ? body.url.trim() : null;

  const profile = await getProfileId(authUser);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const where =
    profile.kind === "businessId"
      ? {
          businessId_platform: {
            businessId: profile.id,
            platform,
          },
        }
      : {
          creatorId_platform: {
            creatorId: profile.id,
            platform,
          },
        };

  const createData =
    profile.kind === "businessId"
      ? { businessId: profile.id, platform, handle, url }
      : { creatorId: profile.id, platform, handle, url };

  await prisma.socialAccount.upsert({
    where,
    update: { handle, url },
    create: createData,
  });

  const socials = await listSocials(profile.kind, profile.id);
  return NextResponse.json({ socials });
}
