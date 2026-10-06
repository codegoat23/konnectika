// tests/clerk-jar.ts
//
// Stands in for `@clerk/nextjs/server` in tests.
//
// Production resolves identity from a signed Clerk session token. Tests can't
// mint one (that needs real Clerk keys and a real session), so this module
// mocks the two functions lib/auth.ts actually consumes:
//
//   auth()         -> { userId } for the signed-in test user
//   currentUser()  -> the matching Clerk user object
//
// The signed-in identity is the *Clerk* user id, which mirrors production
// exactly: lib/auth.ts then looks the Prisma row up by clerkUserId, and role
// still comes from Prisma. So these tests exercise the real authorization
// path rather than a shortcut.
//
// Note this replaces the old cookie-jar JWT approach. There is deliberately no
// token forging here — the whole point of the Clerk migration is that the app
// no longer trusts a self-signed cookie.

import { vi } from "vitest";

// vi.hoisted runs before the import statements below, so the mutable session
// state is created there and reached through exported helpers.
const session = vi.hoisted(() => ({
  userId: null as string | null,
  email: null as string | null,
  firstName: null as string | null,
  lastName: null as string | null,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({
    userId: session.userId,
    sessionId: session.userId ? "sess_test" : null,
    orgId: null,
    getToken: async () => null,
  }),
  currentUser: async () =>
    session.userId
      ? {
          id: session.userId,
          emailAddresses: session.email
            ? [{ id: "eaddr_test", emailAddress: session.email }]
            : [],
          firstName: session.firstName,
          lastName: session.lastName,
        }
      : null,
  clerkClient: async () => ({}),
}));

/** Signs the test session in as a given Clerk user id. */
export function setClerkSession(
  userId: string | null,
  details: {
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } = {}
): void {
  session.userId = userId;
  session.email = details.email ?? null;
  session.firstName = details.firstName ?? null;
  session.lastName = details.lastName ?? null;
}

export function clearClerkSession(): void {
  setClerkSession(null);
}