// lib/clerk-sync.ts
//
// The single place that maps Clerk identities onto Konnectika User rows.
//
// Clerk owns authentication (who someone is, whether they're signed in).
// Prisma owns authorization (what they may do). This module is the seam, and
// it is deliberately the ONLY module that writes `User.clerkUserId` — having
// one writer is what makes the sync idempotent.
//
// Two invariants:
//   1. `clerkUserId` is the identity key. Every path (first sign-in, Clerk's
//      webhook, sign-up) funnels through ensurePrismaUserForClerkUser().
//   2. Role is NEVER taken from the Clerk session on the public signup path.
//      ADMIN is not selectable by the public signup flow; it can only be
//      granted by the env bootstrap (lib/admin-bootstrap.ts) or directly in
//      the database. See `requestedRole` handling below.

import type { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/** Roles the public signup flow is allowed to request. Note the absence of
 *  ADMIN: a client can ask for CREATOR or BRAND and nothing else. */
export const PUBLIC_SIGNUP_ROLES = ["CREATOR", "BRAND"] as const;
export type PublicSignupRole = (typeof PUBLIC_SIGNUP_ROLES)[number];

/** Cookie the sign-up UI writes to record the CREATOR/BRAND choice. */
const SIGNUP_ROLE_COOKIE = "kk_signup_role";

export function isPublicSignupRole(value: unknown): value is PublicSignupRole {
  return (
    typeof value === "string" &&
    (PUBLIC_SIGNUP_ROLES as readonly string[]).includes(value)
  );
}

/** Normalizes a requested role, defaulting to CREATOR. Anything that isn't a
 *  public signup role (including "ADMIN") collapses to CREATOR rather than
 *  being rejected, so a tampered request can never escalate privileges. */
export function normalizeRequestedRole(value: unknown): PublicSignupRole {
  return isPublicSignupRole(value) ? value : "CREATOR";
}

/**
 * Reads the role the sign-up flow recorded.
 *
 * The cookie is user-writable, so the result is only ever a CREATOR/BRAND
 * hint — normalizeRequestedRole() is applied before anything is persisted.
 * Returns undefined outside a request scope (e.g. the webhook), which makes
 * the caller fall back to CREATOR.
 */
export async function readRequestedSignupRole(): Promise<unknown> {
  try {
    const store = await cookies();
    return store.get(SIGNUP_ROLE_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

export interface ClerkUserLike {
  id: string;
  emailAddress: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface EnsureResult {
  userId: string;
  created: boolean;
  linkedByEmail: boolean;
}

/**
 * Returns the Konnectika User for a Clerk user, creating one if needed.
 *
 * Idempotent: safe to call on every request and on every webhook delivery.
 * Clerk retries webhooks, and a user may sign in before the webhook lands, so
 * both paths racing must converge on one row rather than two.
 *
 * Linking by email handles the transition period: a user who signed up
 * pre-Clerk already has a row (with their campaign, applications, earnings and
 * payout history attached) and we attach their Clerk id to THAT row instead of
 * orphaning their data behind a duplicate.
 */
export async function ensurePrismaUserForClerkUser(
  clerkUser: ClerkUserLike,
  requestedRole?: unknown
): Promise<EnsureResult> {
  const clerkUserId = clerkUser.id;
  const email = clerkUser.emailAddress?.trim().toLowerCase() || null;

  // Fast path: already linked.
  const existingByClerkId = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });
  if (existingByClerkId) {
    return {
      userId: existingByClerkId.id,
      created: false,
      linkedByEmail: false,
    };
  }

  // New sign-up needs an email; Clerk's primary email is the identity anchor.
  if (!email) {
    throw new Error(
      `Clerk user ${clerkUserId} has no primary email address; cannot sync to Konnectika`
    );
  }

  // Transition path: a pre-Clerk row with the same email. Link it rather than
  // creating a duplicate, so their existing data stays attached.
  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existingByEmail) {
    // Role is intentionally left alone. Whoever holds this account already
    // has a Konnectika role (possibly ADMIN); a Clerk sign-in must not be able
    // to change it.
    const linked = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: { clerkUserId },
      select: { id: true },
    });
    return { userId: linked.id, created: false, linkedByEmail: true };
  }

  // Genuinely new user. Role is sanitized to CREATOR/BRAND; ADMIN is
  // unreachable from here.
  const role: Role = normalizeRequestedRole(
    requestedRole ?? (await readRequestedSignupRole())
  );

  try {
    const created = await prisma.user.create({
      data: {
        email,
        clerkUserId,
        role,
        // New accounts choose their marketplace role after Clerk verifies
        // their email. The role onboarding route advances this to step 1.
        onboardingStep: 0,
        // Profile rows mirror what the pre-Clerk signup route used to create,
        // so the rest of the app finds them exactly where it expects.
        ...(role === "CREATOR"
          ? {
              creatorProfile: {
                create: {
                  displayName:
                    [clerkUser.firstName, clerkUser.lastName]
                      .filter(Boolean)
                      .join(" ") || null,
                },
              },
            }
          : {
              businessProfile: {
                create: {},
              },
            }),
      },
      select: { id: true },
    });

    return { userId: created.id, created: true, linkedByEmail: false };
  } catch (err) {
    /*
     * Lost a race. The checks above are read-then-write, so two concurrent
     * callers (webhook delivery + first sign-in, or two webhook deliveries at
     * once) can both conclude "no user exists" and both attempt the insert. The
     * unique index on clerkUserId/email is what actually guarantees one row —
     * so on that specific error, re-read and return the winner rather than
     * surfacing a 500 to Clerk (which would just retry and hit this again).
     */
    if (!isUniqueConstraintError(err)) throw err;

    const winner = await prisma.user.findFirst({
      where: { OR: [{ clerkUserId }, { email }] },
      select: { id: true },
    });
    if (!winner) throw err;

    return { userId: winner.id, created: false, linkedByEmail: false };
  }
}

/** True for Prisma's unique-constraint violation (P2002). */
function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === "P2002"
  );
}

/**
 * Applies profile edits from Clerk to the Konnectika user (display name /
 * company name). Keyed on clerkUserId, so it is idempotent, and it never
 * touches role or onboarding state.
 */
export async function syncClerkProfile(
  clerkUser: ClerkUserLike
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId: clerkUser.id },
    select: {
      id: true,
      creatorProfile: { select: { id: true } },
      businessProfile: { select: { id: true } },
    },
  });
  if (!user) return;

  const fullName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  if (user.creatorProfile && fullName) {
    await prisma.creatorProfile.update({
      where: { id: user.creatorProfile.id },
      data: { displayName: fullName },
    });
  }
}

/**
 * Removes the Konnectika user for a deleted Clerk account.
 *
 * The row is deleted rather than detached, matching how the old signup flow
 * behaved (a deleted account left nothing behind). If the row is still absent
 * or already gone this is a no-op, so repeated webhook deliveries are safe.
 */
export async function deletePrismaUserForClerkUser(
  clerkUserId: string
): Promise<{ deleted: boolean }> {
  const existing = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });
  if (!existing) return { deleted: false };

  await prisma.user.delete({ where: { id: existing.id } });
  return { deleted: true };
}
