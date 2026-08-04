import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authUser = await getAuthUser();

  if (!authUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const creator = await prisma.creatorProfile.findUnique({
    where: {
      userId: authUser.userId,
    },
    include: {
      socialAccounts: true,
      user: true,
    },
  });

  return NextResponse.json({
    auth: authUser,
    creator,
  });
}