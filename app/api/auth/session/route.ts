// app/api/auth/session/route.ts
//
// Session probe for client components. Shape preserved from the JWT version:
// 200 `{ user }` when a Konnectika user exists, 401 when signed out, 404 when
// Clerk has a session but Prisma has no synced user yet.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClerkUserId } from "@/lib/auth";

export async function GET() {
  const clerkUserId = await getClerkUserId();

  if (!clerkUserId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      email: true,
      role: true,
      onboardingStep: true,
      onboardingDone: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 404 });
  }

  return NextResponse.json({ user });
}