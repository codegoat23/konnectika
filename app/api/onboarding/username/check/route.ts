// app/api/onboarding/username/check/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username")?.toLowerCase().trim();

    if (!username || !/^[a-z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json({ available: false });
    }

    const existing = await prisma.creatorProfile.findUnique({
      where: { username },
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error("USERNAME CHECK ERROR:", error);
    return NextResponse.json({ error: "Could not check username availability." }, { status: 500 });
  }
}
