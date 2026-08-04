// lib/getSessionUser.ts
//
// Wraps your existing JWT/cookie auth (lib/auth.ts -> getAuthUser) and
// hydrates the two ids the submission feature's API routes need:
//   - creatorProfileId (so we can scope Submission rows to this creator)
//   - businessProfileId (so we can scope Submission rows to campaigns
//     this brand owns)
//
// Your JWT payload only carries { userId, role, onboardingDone,
// onboardingStep, type } — it does NOT carry creatorProfileId /
// businessProfileId, and it shouldn't (keep the token small, and these
// ids can change without forcing a re-login). So we do one cheap Prisma
// lookup per request, scoped to just the id columns we need.

import { getAuthUser } from "@/lib/auth"; // your existing file with signToken/verifyToken/getAuthUser
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string; // userId from the JWT
  role: "CREATOR" | "BRAND" | "ADMIN";
  creatorProfileId: string | null;
  businessProfileId: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jwt = await getAuthUser();
  if (!jwt) return null;

  // role on the JWT is typed as `string` (JWTPayload.role) — narrow it
  // here rather than trusting it blindly, in case of stale/odd tokens.
  if (jwt.role !== "CREATOR" && jwt.role !== "BRAND" && jwt.role !== "ADMIN") {
    return null;
  }

  // Admins have no creator/business profile — skip the lookup.
  if (jwt.role === "ADMIN") {
    return { id: jwt.userId, role: "ADMIN", creatorProfileId: null, businessProfileId: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: jwt.userId },
    select: {
      creatorProfile: { select: { id: true } },
      businessProfile: { select: { id: true } },
    },
  });

  if (!user) return null;

  return {
    id: jwt.userId,
    role: jwt.role,
    creatorProfileId: user.creatorProfile?.id ?? null,
    businessProfileId: user.businessProfile?.id ?? null,
  };
}
