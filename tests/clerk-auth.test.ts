// tests/clerk-auth.test.ts
//
// Covers the Clerk <-> Prisma migration's critical properties:
//
//   1. AUTHENTICATION and AUTHORIZATION stay separate. Clerk supplies identity;
//      Prisma User.role supplies permissions. A test asserts that changing the
//      Clerk session does not change what a user may do.
//   2. The sync never creates duplicate users, no matter how many times it
//      runs, and always converges on the clerkUserId.
//   3. ADMIN is unreachable from the public signup path — not offered in the
//      UI, and not obtainable by tampering with the role the client sends.
//   4. Campaign ownership, applications and earnings still key off User.id,
//      so pre-existing data survives the migration.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ensurePrismaUserForClerkUser,
  normalizeRequestedRole,
  deletePrismaUserForClerkUser,
  syncClerkProfile,
} from "@/lib/clerk-sync";
import { getAuthUser } from "@/lib/auth";
import { getSessionUser } from "@/lib/getSessionUser";
import { setClerkSession, clearClerkSession } from "./clerk-jar";
import { resetDb, createFixture, signInAs, signOut, callRoute } from "./helpers";
import * as adminRevenue from "@/app/api/admin/revenue/route";
import * as campaignsPOST from "@/app/api/campaigns/route";

const CLERK_A = "user_clerk_alpha";
const CLERK_B = "user_clerk_beta";

function clerkUser(overrides: Partial<Parameters<typeof ensurePrismaUserForClerkUser>[0]> = {}) {
  return {
    id: CLERK_A,
    emailAddress: "clerk-alpha@test.konnectika.local",
    firstName: "Clerk",
    lastName: "Alpha",
    ...overrides,
  };
}

describe("clerk auth migration", () => {
  beforeEach(async () => {
    await resetDb();
    clearClerkSession();
  });

  afterEach(() => {
    clearClerkSession();
    signOut();
  });

  // -------------------------------------------------------------------------
  // 1. Authentication vs authorization
  // -------------------------------------------------------------------------

  it("takes identity from Clerk and role from Prisma", async () => {
    const { userId } = await ensurePrismaUserForClerkUser(clerkUser(), "CREATOR");

    setClerkSession(CLERK_A);
    const authUser = await getAuthUser();

    // userId is the Prisma id, not the Clerk id — every FK in the schema
    // points at User.id.
    expect(authUser?.userId).toBe(userId);
    expect(authUser?.userId).not.toBe(CLERK_A);

    // Now flip the role in Prisma only. Clerk's session is untouched.
    await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
    expect((await getAuthUser())?.role).toBe("ADMIN");

    setClerkSession(CLERK_B);
    expect(await getAuthUser()).toBeNull();
  });

  it("honours the Prisma role for authorization, not the session", async () => {
    const fx = await createFixture();
    // Admin cookie/session identity for a user whose Prisma role is BRAND.
    await signInAs(fx.brandAlpha.id, "BRAND");

    // Admin-only route must refuse, because Prisma says BRAND.
    const denied = await callRoute(adminRevenue, {
      method: "GET",
      url: "http://localhost/api/admin/revenue",
    });
    expect(denied.status).toBe(403);

    // Same session, role promoted in Prisma -> allowed.
    await prisma.user.update({
      where: { id: fx.brandAlpha.id },
      data: { role: "ADMIN" },
    });
    const allowed = await callRoute(adminRevenue, {
      method: "GET",
      url: "http://localhost/api/admin/revenue",
    });
    expect(allowed.status).toBe(200);
  });

  it("returns null with no session rather than throwing", async () => {
    clearClerkSession();
    expect(await getAuthUser()).toBeNull();
    expect(await getSessionUser()).toBeNull();
  });

  it("hydrates profile ids for creators and skips the lookup for admins", async () => {
    const fx = await createFixture();

    await signInAs(fx.creatorAlpha.id, "CREATOR");
    const creator = await getSessionUser();
    expect(creator?.creatorProfileId).toBe(fx.creatorAlpha.creatorProfileId);
    expect(creator?.businessProfileId).toBeNull();

    await signInAs(fx.brandAlpha.id, "BRAND");
    const brand = await getSessionUser();
    expect(brand?.businessProfileId).toBe(fx.brandAlpha.businessProfileId);
    expect(brand?.creatorProfileId).toBeNull();

    await signInAs(fx.admin.id, "ADMIN");
    const admin = await getSessionUser();
    expect(admin?.role).toBe("ADMIN");
    expect(admin?.creatorProfileId).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 2. No duplicate users
  // -------------------------------------------------------------------------

  it("creates one user no matter how many times the sync runs", async () => {
    const first = await ensurePrismaUserForClerkUser(clerkUser(), "CREATOR");
    const second = await ensurePrismaUserForClerkUser(clerkUser(), "CREATOR");
    const third = await ensurePrismaUserForClerkUser(clerkUser(), "CREATOR");

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(third.created).toBe(false);
    expect(second.userId).toBe(first.userId);
    expect(await prisma.user.count()).toBe(1);
  });

  it("converges when the webhook and first sign-in race", async () => {
    // Simulates user.created landing twice concurrently-ish.
    const results = await Promise.all([
      ensurePrismaUserForClerkUser(clerkUser(), "CREATOR"),
      ensurePrismaUserForClerkUser(clerkUser(), "CREATOR"),
    ]);
    expect(results[0].userId).toBe(results[1].userId);
    expect(await prisma.user.count()).toBe(1);
  });

  it("links a pre-Clerk row by email instead of duplicating it", async () => {
    // A user from the old JWT era: no clerkUserId, but real campaign data.
    const legacy = await prisma.user.create({
      data: {
        email: "legacy@test.konnectika.local",
        role: "BRAND",
        onboardingDone: true,
        businessProfile: { create: { companyName: "Legacy Co" } },
      },
      include: { businessProfile: true },
    });

    const result = await ensurePrismaUserForClerkUser(
      clerkUser({ id: "user_clerk_legacy", emailAddress: "legacy@test.konnectika.local" }),
      "CREATOR"
    );

    expect(result.linkedByEmail).toBe(true);
    expect(result.userId).toBe(legacy.id);
    expect(await prisma.user.count()).toBe(1);

    const row = await prisma.user.findUniqueOrThrow({
      where: { id: legacy.id },
      include: { businessProfile: true },
    });
    expect(row.clerkUserId).toBe("user_clerk_legacy");
    // An existing role is preserved — signing in must not demote or promote.
    expect(row.role).toBe("BRAND");
    // Business profile survives, so their campaigns stay attached.
    expect(row.businessProfile?.id).toBe(legacy.businessProfile?.id);
  });

  it("creates the profile row the app expects for the role", async () => {
    await ensurePrismaUserForClerkUser(clerkUser(), "CREATOR");
    const creator = await prisma.user.findUniqueOrThrow({
      where: { clerkUserId: CLERK_A },
      include: { creatorProfile: true, businessProfile: true },
    });
    expect(creator.creatorProfile).not.toBeNull();
    expect(creator.businessProfile).toBeNull();
    expect(creator.creatorProfile?.displayName).toBe("Clerk Alpha");

    await ensurePrismaUserForClerkUser(clerkUser({ id: CLERK_B, emailAddress: "b@test.konnectika.local" }), "BRAND");
    const brand = await prisma.user.findUniqueOrThrow({
      where: { clerkUserId: CLERK_B },
      include: { creatorProfile: true, businessProfile: true },
    });
    expect(brand.businessProfile).not.toBeNull();
    expect(brand.creatorProfile).toBeNull();
  });

  it("refuses to sync a Clerk user with no email", async () => {
    await expect(
      ensurePrismaUserForClerkUser(clerkUser({ emailAddress: null }))
    ).rejects.toThrow(/email/i);
    expect(await prisma.user.count()).toBe(0);
  });

  // -------------------------------------------------------------------------
  // 3. ADMIN is unreachable from signup
  // -------------------------------------------------------------------------

  it("collapses an ADMIN request to CREATOR", () => {
    expect(normalizeRequestedRole("ADMIN")).toBe("CREATOR");
    expect(normalizeRequestedRole("CREATOR")).toBe("CREATOR");
    expect(normalizeRequestedRole("BRAND")).toBe("BRAND");

    // Nonsense and injection-ish values all degrade safely.
    for (const bad of [null, undefined, "", "admin", "SUPERADMIN", 1, {}, ["ADMIN"]]) {
      expect(normalizeRequestedRole(bad)).toBe("CREATOR");
    }
  });

  it("never stores ADMIN for a user who signs up", async () => {
    await ensurePrismaUserForClerkUser(clerkUser(), "ADMIN");
    const row = await prisma.user.findUniqueOrThrow({ where: { clerkUserId: CLERK_A } });
    expect(row.role).toBe("CREATOR");
  });

  it("does not let a tampered signup role reach the database", async () => {
    // Simulates the client sending ADMIN through whatever channel it likes.
    for (const attempt of ["ADMIN", "admin", "Admin", "ADMIN "]) {
      await prisma.user.deleteMany({ where: {} });
      await ensurePrismaUserForClerkUser(clerkUser(), attempt);
      const row = await prisma.user.findUniqueOrThrow({ where: { clerkUserId: CLERK_A } });
      expect(row.role).toBe("CREATOR");
    }
  });

  it("leaves an existing ADMIN alone when they sign in", async () => {
    const admin = await prisma.user.create({
      data: { email: "real-admin@test.konnectika.local", role: "ADMIN" },
    });

    // Signing in must not change the role, even if a role is offered.
    await ensurePrismaUserForClerkUser(
      clerkUser({ id: "user_clerk_admin", emailAddress: admin.email }),
      "CREATOR"
    );

    const row = await prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
    expect(row.role).toBe("ADMIN");
    expect(row.clerkUserId).toBe("user_clerk_admin");
  });

  // -------------------------------------------------------------------------
  // 4. Existing relationships survive
  // -------------------------------------------------------------------------

  it("keeps campaign ownership keyed on User.id after linking", async () => {
    const fx = await createFixture();
    await signInAs(fx.brandAlpha.id, "BRAND");

    const created = await callRoute(campaignsPOST, {
      method: "POST",
      body: {
        name: "Ownership After Clerk",
        description: "verifying ownership still resolves via User.id",
        category: "Lifestyle",
        campaignType: "UGC",
        paymentRate: 250000,
        budgetTotal: 1_000_000,
        daysLeft: 30,
        contentFormat: "Video",
        duration: "30 days",
        applicationsClose: new Date(Date.now() + 30 * 864e5).toISOString(),
      },
    });
    expect(created.status).toBe(201);

    const campaign = await prisma.campaign.findFirstOrThrow({
      where: { name: "Ownership After Clerk" },
      include: { businessProfile: true },
    });
    expect(campaign.businessProfile?.userId).toBe(fx.brandAlpha.id);

    // And the acting user still resolves to that same Prisma id.
    const authUser = await getAuthUser();
    expect(authUser?.userId).toBe(fx.brandAlpha.id);
  });

  // -------------------------------------------------------------------------
  // Profile sync + deletion
  // -------------------------------------------------------------------------

  it("syncs a renamed Clerk profile without touching role", async () => {
    await ensurePrismaUserForClerkUser(clerkUser(), "CREATOR");
    await prisma.user.update({ where: { clerkUserId: CLERK_A }, data: { role: "BRAND" } });

    await syncClerkProfile(
      clerkUser({ firstName: "Renamed", lastName: "Person" })
    );

    const row = await prisma.user.findUniqueOrThrow({
      where: { clerkUserId: CLERK_A },
      include: { creatorProfile: true },
    });
    expect(row.creatorProfile?.displayName).toBe("Renamed Person");
    // Role is not a profile concern.
    expect(row.role).toBe("BRAND");
  });

  it("deletes on user.deleted and is safe to repeat", async () => {
    await ensurePrismaUserForClerkUser(clerkUser(), "CREATOR");
    expect(await prisma.user.count()).toBe(1);

    const first = await deletePrismaUserForClerkUser(CLERK_A);
    expect(first.deleted).toBe(true);
    expect(await prisma.user.count()).toBe(0);

    // Clerk retries: a second delivery must not throw.
    const second = await deletePrismaUserForClerkUser(CLERK_A);
    expect(second.deleted).toBe(false);
  });
});