// app/api/auth/me/route.ts
//
// Returns the current Konnectika user for client-side guards
// (lib/useAuthGuard.ts, nav components).
//
// The shape is unchanged from the JWT era: `{ user: { userId, role,
// onboardingDone, onboardingStep } }`. Role comes from Prisma, never from the
// Clerk session.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}