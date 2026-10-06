// tests/admin-bootstrap.test.ts
//
// The env-driven admin provisioning in lib/admin-bootstrap.ts.
//
// What actually matters here:
//   - a fresh database gets a working admin with no manual SQL
//   - the provisioned admin can complete a real login (bcrypt hash is valid)
//   - changing ADMIN_PASSWORD in .env invalidates the old one
//   - re-running is a no-op rather than churning rows
//   - misconfiguration fails loudly instead of silently creating a broken admin

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { ensureAdminUsers, parseAdminEmails } from "@/lib/admin-bootstrap";

import { resetDb, signOut } from "./helpers";

const ENV_KEYS = ["ADMIN_EMAILS", "ADMIN_PASSWORD"] as const;

describe("admin bootstrap", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(async () => {
    await resetDb();
    saved = {};
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    signOut();
  });

  // -------------------------------------------------------------------------
  // Email parsing
  // -------------------------------------------------------------------------

  describe("parseAdminEmails", () => {
    it("normalizes, lowercases and de-duplicates", () => {
      expect(
        parseAdminEmails("  Admin@Konnectika.com , ops@konnectika.com,ADMIN@konnectika.com ")
      ).toEqual(["admin@konnectika.com", "ops@konnectika.com"]);
    });

    it("returns an empty list when unset or blank", () => {
      expect(parseAdminEmails(undefined)).toEqual([]);
      expect(parseAdminEmails("")).toEqual([]);
      expect(parseAdminEmails("  ,  ,")).toEqual([]);
    });

    it("rejects a malformed address rather than creating a junk user", () => {
      expect(() => parseAdminEmails("not-an-email")).toThrow(/invalid email/i);
      expect(() => parseAdminEmails("a@b.com, broken")).toThrow(/invalid email/i);
    });
  });

  // -------------------------------------------------------------------------
  // Provisioning
  // -------------------------------------------------------------------------

  it("creates an admin on a fresh database with no manual seed step", async () => {
    process.env.ADMIN_EMAILS = "admin@konnectika.com";
    process.env.ADMIN_PASSWORD = "correct-horse-battery";

    const result = await ensureAdminUsers();
    expect(result.created).toEqual(["admin@konnectika.com"]);

    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@konnectika.com" },
    });
    expect(admin.role).toBe("ADMIN");
    // proxy.ts has no ADMIN onboarding route, so an incomplete admin would be
    // redirected to /onboarding/username forever.
    expect(admin.onboardingDone).toBe(true);
    expect(admin.password).toBeTruthy();
    expect(admin.password).not.toBe("correct-horse-battery");
  });

  it("produces a hash that verifies the configured password", async () => {
    process.env.ADMIN_EMAILS = "admin@konnectika.com";
    process.env.ADMIN_PASSWORD = "correct-horse-battery";
    await ensureAdminUsers();

    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@konnectika.com" },
    });
    expect(await bcrypt.compare("correct-horse-battery", admin.password!)).toBe(true);
    expect(await bcrypt.compare("wrong-password", admin.password!)).toBe(false);
  });

  it("supports several admins from one comma-separated list", async () => {
    process.env.ADMIN_EMAILS = "a@konnectika.com, b@konnectika.com";
    process.env.ADMIN_PASSWORD = "correct-horse-battery";

    const result = await ensureAdminUsers();
    expect(result.created.sort()).toEqual(["a@konnectika.com", "b@konnectika.com"]);

    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    expect(admins).toBe(2);
  });

  it("does nothing when ADMIN_EMAILS is unset", async () => {
    process.env.ADMIN_PASSWORD = "correct-horse-battery";

    const result = await ensureAdminUsers();
    expect(result).toEqual({ created: [], passwordSynced: [], alreadyValid: [] });
    expect(await prisma.user.count()).toBe(0);
  });

  it("promotes an existing account and marks onboarding done", async () => {
    const existing = await prisma.user.create({
      data: {
        email: "admin@konnectika.com",
        role: "BRAND",
        password: await bcrypt.hash("brand-password", 10),
        onboardingDone: false,
      },
      include: { businessProfile: true },
    });

    process.env.ADMIN_EMAILS = "admin@konnectika.com";
    process.env.ADMIN_PASSWORD = "correct-horse-battery";

    const result = await ensureAdminUsers();
    expect(result.passwordSynced).toEqual(["admin@konnectika.com"]);

    const after = await prisma.user.findUniqueOrThrow({ where: { id: existing.id } });
    expect(after.role).toBe("ADMIN");
    expect(after.onboardingDone).toBe(true);
    // Same row — promoting must not orphan audit foreign keys.
    expect(after.id).toBe(existing.id);
  });

  // -------------------------------------------------------------------------
  // Password sync
  // -------------------------------------------------------------------------

  it("re-syncs the stored hash when ADMIN_PASSWORD changes", async () => {
    process.env.ADMIN_EMAILS = "admin@konnectika.com";
    process.env.ADMIN_PASSWORD = "first-password-1";
    await ensureAdminUsers();

    process.env.ADMIN_PASSWORD = "second-password-2";
    const result = await ensureAdminUsers();
    expect(result.passwordSynced).toEqual(["admin@konnectika.com"]);

    // Old password no longer verifies; the new one does.
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@konnectika.com" },
    });
    expect(await bcrypt.compare("first-password-1", admin.password!)).toBe(false);
    expect(await bcrypt.compare("second-password-2", admin.password!)).toBe(true);
  });

  it("is a no-op on re-run, and does not churn updatedAt", async () => {
    process.env.ADMIN_EMAILS = "admin@konnectika.com";
    process.env.ADMIN_PASSWORD = "correct-horse-battery";
    await ensureAdminUsers();

    const first = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@konnectika.com" },
    });

    const second = await ensureAdminUsers();
    expect(second).toEqual({
      created: [],
      passwordSynced: [],
      alreadyValid: ["admin@konnectika.com"],
    });

    const after = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@konnectika.com" },
    });
    // Unchanged password => no re-hash, so updatedAt stays put.
    expect(after.updatedAt.getTime()).toBe(first.updatedAt.getTime());
    expect(await prisma.user.count()).toBe(1);
  });

  it("gives an admin that had no password a usable one", async () => {
    await prisma.user.create({
      data: { email: "admin@konnectika.com", role: "ADMIN", password: null },
    });

    process.env.ADMIN_EMAILS = "admin@konnectika.com";
    process.env.ADMIN_PASSWORD = "correct-horse-battery";

    const result = await ensureAdminUsers();
    expect(result.passwordSynced).toEqual(["admin@konnectika.com"]);

    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@konnectika.com" },
    });
    expect(await bcrypt.compare("correct-horse-battery", admin.password!)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Misconfiguration
  // -------------------------------------------------------------------------

  it("refuses to provision a too-weak password", async () => {
    process.env.ADMIN_EMAILS = "admin@konnectika.com";
    process.env.ADMIN_PASSWORD = "short";

    await expect(ensureAdminUsers()).rejects.toThrow(/at least 8 characters/i);
    expect(await prisma.user.count()).toBe(0);
  });

  it("refuses to provision when ADMIN_PASSWORD is blank", async () => {
    process.env.ADMIN_EMAILS = "admin@konnectika.com";
    process.env.ADMIN_PASSWORD = "";

    await expect(ensureAdminUsers()).rejects.toThrow(/at least 8 characters/i);
    expect(await prisma.user.count()).toBe(0);
  });

  it("never leaks the password into the error message", async () => {
    process.env.ADMIN_EMAILS = "admin@konnectika.com";
    process.env.ADMIN_PASSWORD = "hunter2";

    await expect(ensureAdminUsers()).rejects.toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("hunter2") }) as never
    );
  });
});