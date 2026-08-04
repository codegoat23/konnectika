import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  return NextResponse.json(notifications);
}