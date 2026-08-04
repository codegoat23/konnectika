// app/api/onboarding/username/check/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companyName = searchParams.get("companyname")?.toLowerCase().trim();

  if (!companyName || companyName.length < 3) {
    return NextResponse.json({ available: false });
  }

  const existing = await prisma.businessProfile.findUnique({
    where: { companyName },
  });

  return NextResponse.json({ available: !existing });
}