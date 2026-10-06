// lib/getSessionUser.ts
//
// Wraps identity resolution (lib/auth.ts -> Clerk) and hydrates the two ids the
// submission feature's API routes need:
//   - creatorProfileId (so we can scope Submission rows to this creator)
//   - businessProfileId (so we can scope Submission rows to campaigns
//     this brand owns)
//
// Authentication and authorization stay separate here: lib/auth.ts answers
// "is this person signed in, and which Prisma user are they?", while role comes
// from Prisma rather than from any token claim.
//
// The profile ids are deliberately NOT part of the identity payload — they can
// change without forcing a re-login, and caching them in a session would go
// stale. So we do one cheap Prisma lookup per request, scoped to just the id
// columns we need.

import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string; // Prisma User.id (NOT the Clerk user id)
  role: "CREATOR" | "BRAND" | "ADMIN";
  creatorProfileId: string | null;
  businessProfileId: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  // Narrow rather than trusting the value blindly.
  const role = authUser.role;
  if (role !== "CREATOR" && role !== "BRAND" && role !== "ADMIN") {
    return null;
  }

  // Admins have no creator/business profile — skip the lookup.
  if (role === "ADMIN") {
    return { id: authUser.userId, role: "ADMIN", creatorProfileId: null, businessProfileId: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      creatorProfile: { select: { id: true } },
      businessProfile: { select: { id: true } },
    },
  });

  if (!user) return null;

  return {
    id: authUser.userId,
    role,
    creatorProfileId: user.creatorProfile?.id ?? null,
    businessProfileId: user.businessProfile?.id ?? null,
  };
}
