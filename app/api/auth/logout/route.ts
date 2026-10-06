// app/api/auth/logout/route.ts
//
// Ends the active Clerk session. Locally signing out succeeds even if the
// Clerk API call fails; Clerk's client component also clears its local state.

import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const { sessionId } = await auth();

    if (sessionId) {
      // Backend API v7 renamed this to revokeSession (there is no
      // sessions.signOut). Revoking the session is what invalidates the
      // cookie the browser is holding.
      const clerk = await clerkClient();
      await clerk.sessions.revokeSession(sessionId);
    }
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
  }

  return NextResponse.json({ success: true });
}
