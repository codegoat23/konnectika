// app/api/onboarding/username/check/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.toLowerCase().trim();

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false });
  }

  const existing = await prisma.creatorProfile.findUnique({
    where: { username },
  });

  return NextResponse.json({ available: !existing });
}