// lib/auth.ts
//
// Server-side identity helper. Now backed by Clerk.
//
// Authentication (Clerk) and authorization (Prisma User.role) are kept
// deliberately separate:
//
//   Clerk  -> "is there a valid, signed-in identity?" and "what is the Clerk
//             user id?"
//   Prisma -> "what role does this Konnectika user have?" and everything else
//             the app authorizes against (campaign ownership, applications,
//             earnings, payouts).
//
// `getAuthUser()` returns the SAME shape the old JWT implementation returned,
// so the ~50 call sites that already consume `{ userId, role,
// onboardingDone, onboardingStep }` keep working with role still read from
// Prisma. `userId` is the Prisma User.id, NOT the Clerk id — that distinction
// matters because every foreign key in the schema points at User.id.
//
import { auth, currentUser } from "@clerk/nextjs/server";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensurePrismaUserForClerkUser } from "@/lib/clerk-sync";

/**
 * The shape every existing call site already expects from getAuthUser().
 * Kept identical to the previous JWT payload so no consumer needs rewriting.
 */
export interface AuthUser {
  userId: string;
  role: string;
  onboardingDone: boolean;
  onboardingStep: number;
  type: string;
}

/**
 * Resolves the current Clerk session into a Konnectika user.
 *
 * Returns null when there is no session. When there IS a session but no
 * Prisma row (first sign-in before the webhook arrives), the user is synced on
 * the spot — this is what makes the flow robust without depending on webhook
 * delivery timing.
 *
 * Never throws: an auth helper that throws turns "not logged in" into a 500.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return null;

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        id: true,
        role: true,
        onboardingDone: true,
        onboardingStep: true,
      },
    });

    if (user) {
      return {
        userId: user.id,
        role: user.role,
        onboardingDone: user.onboardingDone,
        onboardingStep: user.onboardingStep,
        type: "access",
      };
    }

    // Signed in with Clerk but no Konnectika row yet. Create/link it now so a
    // missing or delayed webhook can never lock a real user out.
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const synced = await ensurePrismaUserForClerkUser({
      id: clerkUser.id,
      emailAddress: clerkUser.emailAddresses[0]?.emailAddress ?? null,
      firstName: clerkUser.firstName ?? null,
      lastName: clerkUser.lastName ?? null,
    });

    const fresh = await prisma.user.findUniqueOrThrow({
      where: { id: synced.userId },
      select: {
        id: true,
        role: true,
        onboardingDone: true,
        onboardingStep: true,
      },
    });

    return {
      userId: fresh.id,
      role: fresh.role,
      onboardingDone: fresh.onboardingDone,
      onboardingStep: fresh.onboardingStep,
      type: "access",
    };
  } catch (error) {
    // Next.js signals control flow by throwing (DynamicServerError when a
    // segment is forced static, redirect/notFound, PPR postponement). Those
    // errors are not failures and MUST propagate, or the framework can no
    // longer classify and serve the route — catching them silently turns a
    // framework signal into a bogus "signed out" (null) result.
    unstable_rethrow(error);

    // A genuine auth/DB failure degrades to "signed out" rather than taking
    // down every authenticated route with a 500.
    console.error("getAuthUser failed:", error);
    return null;
  }
}

/**
 * The Clerk user id for the current session, or null. Use this only when you
 * need the Clerk identity itself (e.g. talking to Clerk APIs) — never for
 * authorization, which goes through getAuthUser()/Prisma.
 */
export async function getClerkUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

export function isSafeRedirect(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  if (path.includes("\\")) return null;
  if (path.includes("://")) return null;
  return path;
}

export const FIRST_STEP_BY_ROLE: Record<string, string> = {
  CREATOR: "/onboarding/username",
  BRAND: "/onboarding/companyname",
};
