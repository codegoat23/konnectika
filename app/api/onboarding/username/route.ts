import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "CREATOR") {
      return NextResponse.json({ error: "This step is only for creator accounts." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const username = typeof body?.username === "string"
      ? body.username.trim().toLowerCase()
      : "";

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3–30 characters using lowercase letters, numbers, or underscores." },
        { status: 400 }
      );
    }

    const existing = await prisma.creatorProfile.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (existing && existing.userId !== authUser.userId) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.creatorProfile.upsert({
        where: { userId: authUser.userId },
        update: { username },
        create: { userId: authUser.userId, username },
      });

      await tx.user.update({
        where: { id: authUser.userId },
        data: { onboardingStep: 2 },
      });
    });

    const res = NextResponse.json({
      success: true,
      nextStep: "/onboarding/socials",
    });

    return res;
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    console.error("USERNAME ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
