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

// PATCH /api/notifications — mark all of the current user's notifications as
// read.
export async function PATCH() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const updated = await prisma.notification.updateMany({
    where: {
      userId: user.userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return NextResponse.json({ ok: true, count: updated.count });
}

// DELETE /api/notifications — delete all of the current user's notifications.
export async function DELETE() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const deleted = await prisma.notification.deleteMany({
    where: {
      userId: user.userId,
    },
  });

  return NextResponse.json({ ok: true, count: deleted.count });
}