// lib/admin-bootstrap.ts
//
// Provisions admin accounts from the environment so that no manual database
// step is ever required to get an admin into the app.
//
// Why this exists instead of "just put the admin in .env":
//
//   Admin actions write the acting admin's *database* id into audit columns —
//   PaymentProof.submittedById / reviewedById are real foreign keys to User.id
//   (see lib/payout.ts, lib/payments.ts). An admin that lived only in .env
//   would have no User.id and every payout approval would fail on the FK.
//   So the environment is the source of truth for *who the admins are and what
//   their password is*, while a database row backs the audit trail.
//
// Configuration (.env):
//
//   ADMIN_EMAILS   comma-separated admin emails
//   ADMIN_PASSWORD shared password for those accounts
//
// Behaviour:
//   - Idempotent. Safe to run on every boot.
//   - Creates missing admins, promotes existing accounts, and re-hashes the
//     stored password whenever ADMIN_PASSWORD changes, so .env stays the
//     source of truth rather than the database drifting away from it.
//   - No-ops (with a warning) when the variables are unset, so contributor
//     setups and CI without a configured admin are unaffected.

import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

/** Login rejects empty emails too, so don't let one through here. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AdminBootstrapResult {
  created: string[];
  passwordSynced: string[];
  alreadyValid: string[];
}

/**
 * Normalizes ADMIN_EMAILS into a de-duplicated list of lowercase addresses.
 * Exported for tests.
 */
export function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return [];

  const seen = new Set<string>();
  const emails: string[] = [];

  for (const part of raw.split(",")) {
    const email = part.trim().toLowerCase();
    if (!email) continue;
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error(
        `ADMIN_EMAILS contains an invalid email address: "${part.trim()}"`
      );
    }
    if (seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }

  return emails;
}

/**
 * Ensures every configured admin exists with a usable password.
 *
 * Never throws on database failures — a boot hook that kills the process
 * because Postgres blinked is worse than an app that starts without an admin.
 * The caller logs; the server still comes up.
 */
export async function ensureAdminUsers(): Promise<AdminBootstrapResult> {
  const result: AdminBootstrapResult = {
    created: [],
    passwordSynced: [],
    alreadyValid: [],
  };

  const emails = parseAdminEmails(process.env.ADMIN_EMAILS);
  if (emails.length === 0) return result;

  const password = process.env.ADMIN_PASSWORD ?? "";

  if (password.length < MIN_PASSWORD_LENGTH) {
    // Deliberately does not include the password itself.
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters when ADMIN_EMAILS is set`
    );
  }

  for (const email of emails) {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (!existing) {
      await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, BCRYPT_ROUNDS),
          role: "ADMIN",
          // Admins have no onboarding flow in proxy.ts, so an incomplete flag
          // would bounce them to /onboarding/username forever.
          onboardingDone: true,
          onboardingStep: 1,
        },
      });
      result.created.push(email);
      continue;
    }

    const data: {
      role?: "ADMIN";
      password?: string;
      onboardingDone?: boolean;
      onboardingStep?: number;
    } = {};

    if (existing.role !== "ADMIN") {
      data.role = "ADMIN";
    }

    if (!existing.onboardingDone) {
      data.onboardingDone = true;
      data.onboardingStep = 1;
    }

    // Only re-hash when the env password genuinely differs. Skipping the
    // no-op case keeps updatedAt (and the audit story) stable across boots
    // instead of churning on every deploy.
    const matches = existing.password
      ? await bcrypt.compare(password, existing.password)
      : false;

    if (matches) {
      result.alreadyValid.push(email);
    } else {
      data.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
      result.passwordSynced.push(email);
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: existing.id }, data });
    }
  }

  return result;
}