import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// PATCH /api/notifications/:id — mark a single notification as read.
// Idempotent: already-read notifications resolve successfully.
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const updated = await prisma.notification.updateMany({
    where: { id, userId: user.userId, isRead: false },
    data: { isRead: true },
  });

  if (updated.count === 0) {
    const existing = await prisma.notification.findFirst({
      where: { id, userId: user.userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/notifications/:id — delete a single notification.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deleted = await prisma.notification.deleteMany({
    where: { id, userId: user.userId },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
