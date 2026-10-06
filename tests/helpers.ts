// tests/helpers.ts
//
// Shared utilities for the Konnectika marketplace test environment:
//   - auth: sign the Clerk test session in/out as a given user (signInAs /
//     signOut). Under Clerk, identity is a Clerk user id and role still comes
//     from Prisma — so these helpers attach a deterministic clerkUserId to the
//     fixture user and point the session mock at it.
//   - routing: invoke Next.js route handlers directly without a server
//     (callRoute)
//   - data: deterministic fixtures (@test.konnectika.local domain), resetDb()
//     to wipe the test database between tests, and campaign/application
//     builders.

import { prisma } from "@/lib/prisma";
import { setClerkSession, clearClerkSession } from "./clerk-jar";
import { clearCookies } from "./cookie-jar";
import type { Role } from "@prisma/client";
import type { MarkPayoutPaidResult } from "@/lib/payout";
import { expect } from "vitest";

export const TEST_EMAIL_DOMAIN = "@test.konnectika.local";

export const EMAILS = {
  admin: `admin${TEST_EMAIL_DOMAIN}`,
  brandAlpha: `brand-alpha${TEST_EMAIL_DOMAIN}`,
  brandBeta: `brand-beta${TEST_EMAIL_DOMAIN}`,
  creatorAlpha: `creator-alpha${TEST_EMAIL_DOMAIN}`,
  creatorBeta: `creator-beta${TEST_EMAIL_DOMAIN}`,
  creatorGamma: `creator-gamma${TEST_EMAIL_DOMAIN}`,
};

let counter = 0;
function uniqueSuffix(): string {
  counter += 1;
  return `${counter}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Signs the Clerk test session in as `userId`.
 *
 * Attaches a deterministic clerkUserId to the row if it doesn't have one yet,
 * so the lookup path in lib/auth.ts (find user by clerkUserId) runs exactly as
 * it does in production. `role` is intentionally ignored for authorization —
 * Prisma already holds the truth — but kept in the signature so existing call
 * sites read the same.
 */
export async function signInAs(userId: string, role: Role): Promise<void> {
  void role;

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { clerkUserId: true, email: true },
  });

  const clerkUserId =
    existing?.clerkUserId ?? `user_test_${userId.replace(/[^a-zA-Z0-9]/g, "")}`;

  if (existing && !existing.clerkUserId) {
    await prisma.user.update({
      where: { id: userId },
      data: { clerkUserId },
    });
  }

  setClerkSession(clerkUserId, { email: existing?.email ?? null });
}

export function signOut(): void {
  clearClerkSession();
  clearCookies();
}

// ---------------------------------------------------------------------------
// Route invocation
// ---------------------------------------------------------------------------

export interface CallRouteOptions {
  method: string;
  url?: string;
  body?: unknown;
  params?: Record<string, string>;
}

// Handlers have heterogeneous signatures (Request vs NextRequest, params
// promises, etc.) — keep the call surface loose and let callRoute adapt.
export async function callRoute(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  route: Record<string, Function>,
  opts: CallRouteOptions
): Promise<Response> {
  const url = opts.url ?? "http://localhost/api/test";
  const init: RequestInit = { method: opts.method };
  if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    init.headers = { "content-type": "application/json" };
  }
  const req = new Request(url, init);
  const ctx = opts.params ? { params: Promise.resolve(opts.params) } : {};
  const handler = route[opts.method];
  if (typeof handler !== "function") {
    throw new Error(`Route has no ${opts.method} handler`);
  }
  return handler(req, ctx) as Promise<Response>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson(res: Response): Promise<any> {
  return res.json().catch(() => ({}));
}

/** Assert a markPayoutPaid() failure with an exact error code (narrows the
 *  discriminated union so `result.code` is safe to read). */
export function expectPayoutFailed(
  result: MarkPayoutPaidResult,
  code: string
): void {
  expect(result.ok).toBe(false);
  if (result.ok === false) {
    expect(result.code).toBe(code);
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

export interface Fixture {
  admin: { id: string; email: string };
  brandAlpha: { id: string; email: string; businessProfileId: string };
  brandBeta: { id: string; email: string; businessProfileId: string };
  creatorAlpha: { id: string; email: string; creatorProfileId: string };
  creatorBeta: { id: string; email: string; creatorProfileId: string };
  creatorGamma: { id: string; email: string; creatorProfileId: string };
}

/** Create the standard actor set (admin + 2 brands + 3 creators). Deterministic
 *  emails under @test.konnectika.local; wiped by resetDb() before each test. */
export async function createFixture(): Promise<Fixture> {
  const admin = await prisma.user.create({
    data: { email: EMAILS.admin, role: "ADMIN" },
    select: { id: true, email: true },
  });

  const brandAlpha = await prisma.user.create({
    data: {
      email: EMAILS.brandAlpha,
      role: "BRAND",
      businessProfile: { create: { companyName: "Alpha Test Co" } },
    },
    select: { id: true, email: true, businessProfile: { select: { id: true } } },
  });

  const brandBeta = await prisma.user.create({
    data: {
      email: EMAILS.brandBeta,
      role: "BRAND",
      businessProfile: { create: { companyName: "Beta Test Co" } },
    },
    select: { id: true, email: true, businessProfile: { select: { id: true } } },
  });

  const creatorAlpha = await prisma.user.create({
    data: {
      email: EMAILS.creatorAlpha,
      role: "CREATOR",
      creatorProfile: { create: { username: "creator-alpha", displayName: "Creator Alpha" } },
    },
    select: { id: true, email: true, creatorProfile: { select: { id: true } } },
  });

  const creatorBeta = await prisma.user.create({
    data: {
      email: EMAILS.creatorBeta,
      role: "CREATOR",
      creatorProfile: { create: { username: "creator-beta", displayName: "Creator Beta" } },
    },
    select: { id: true, email: true, creatorProfile: { select: { id: true } } },
  });

  const creatorGamma = await prisma.user.create({
    data: {
      email: EMAILS.creatorGamma,
      role: "CREATOR",
      creatorProfile: { create: { username: "creator-gamma", displayName: "Creator Gamma" } },
    },
    select: { id: true, email: true, creatorProfile: { select: { id: true } } },
  });

  return {
    admin: { id: admin.id, email: admin.email },
    brandAlpha: {
      id: brandAlpha.id,
      email: brandAlpha.email,
      businessProfileId: brandAlpha.businessProfile!.id,
    },
    brandBeta: {
      id: brandBeta.id,
      email: brandBeta.email,
      businessProfileId: brandBeta.businessProfile!.id,
    },
    creatorAlpha: {
      id: creatorAlpha.id,
      email: creatorAlpha.email,
      creatorProfileId: creatorAlpha.creatorProfile!.id,
    },
    creatorBeta: {
      id: creatorBeta.id,
      email: creatorBeta.email,
      creatorProfileId: creatorBeta.creatorProfile!.id,
    },
    creatorGamma: {
      id: creatorGamma.id,
      email: creatorGamma.email,
      creatorProfileId: creatorGamma.creatorProfile!.id,
    },
  };
}

export interface CampaignOverrides {
  name?: string;
  paymentRate?: number;
  budgetTotal?: number;
  applicationsClose?: Date;
  status?: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED";
  paymentStatus?: "UNPAID" | "AWAITING_PAYMENT" | "PROOF_SUBMITTED" | "PAYMENT_FAILED" | "PAID";
  paymentMethod?: string | null;
  paymentPhone?: string | null;
}

/** Direct-DB campaign builder (bypasses the API). Defaults to an APPROVED
 *  campaign at 250,000 TZS per creator with a 2,500,000 TZS budget. */
export async function createCampaign(
  businessProfileId: string,
  overrides: CampaignOverrides = {}
) {
  const paymentRate = overrides.paymentRate ?? 250000;
  const budgetTotal = overrides.budgetTotal ?? 2500000;
  const platformFee = Math.round((budgetTotal * 5) / 100);
  return prisma.campaign.create({
    data: {
      name: overrides.name ?? `Campaign ${uniqueSuffix()}`,
      description: "Automated test campaign.",
      category: "Lifestyle",
      campaignType: "UGC",
      badge: "new",
      thumbnailColor: "#18181b",
      thumbnailPic: "",
      thumbnailInitials: "TC",
      paymentRate,
      budgetFunded: 0,
      budgetTotal,
      paymentStatus: overrides.paymentStatus ?? "UNPAID",
      platformFeeRate: 5,
      platformFee,
      totalCharge: budgetTotal + platformFee,
      daysLeft: 30,
      contentFormat: "Video (15s - 60s)",
      duration: "30 days",
      applicationsClose: overrides.applicationsClose ?? addDays(new Date(), 30),
      isOpenToAll: true,
      isFeatured: false,
      tags: [],
      requirements: [],
      creatorsJoined: 0,
      brand: "Test Brand",
      status: overrides.status ?? "APPROVED",
      paymentMethod: overrides.paymentMethod ?? null,
      paymentPhone: overrides.paymentPhone ?? null,
      platforms: [],
      businessProfileId,
    },
  });
}

export async function createApplication(
  creatorProfileId: string,
  campaignId: string,
  status: "PENDING" | "APPROVED" | "REJECTED" = "PENDING",
  message = "I would love to join this campaign!"
) {
  return prisma.campaignApplication.create({
    data: { creatorId: creatorProfileId, campaignId, message, status },
  });
}

export async function createCreatorUser(email: string, username: string) {
  return prisma.user.create({
    data: {
      email,
      role: "CREATOR",
      creatorProfile: { create: { username, displayName: username } },
    },
    select: { id: true, creatorProfile: { select: { id: true } } },
  });
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

/** Delete every row belonging to @test.konnectika.local users (cascading to
 *  their campaigns, applications, earnings, payments, withdrawals, revenue,
 *  notifications). Safe to run before every test — repeatable, deterministic. */
export async function resetDb(): Promise<void> {
  const testUsers = await prisma.user.findMany({
    where: { email: { endsWith: TEST_EMAIL_DOMAIN } },
    select: { id: true },
  });
  const userIds = testUsers.map((u) => u.id);

  // Resolve the owned rows in dependency order so every child table's filter
  // matches. Empty `in: []` filters are safe no-ops for deleteMany.
  const creators = await prisma.creatorProfile.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const businesses = await prisma.businessProfile.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const creatorIds = creators.map((c) => c.id);
  const businessIds = businesses.map((b) => b.id);

  const campaigns = await prisma.campaign.findMany({
    where: { businessProfileId: { in: businessIds } },
    select: { id: true },
  });
  const campaignIds = campaigns.map((c) => c.id);

  // Snippe webhook events are global (not scoped to a user), so drop them by
  // the references we may have minted during a test.
  await prisma.webhookEvent.deleteMany({ where: { provider: "snippe" } });

  // Fee settings are global too. A test that changes a percentage would
  // otherwise leak that rate into every later test's fee assertions.
  await prisma.platformSetting.deleteMany({
    where: {
      key: {
        in: [
          "pricing.brandFeePercent",
          "pricing.creatorFeePercent",
          "pricing.snippeCollectionFeePercent",
        ],
      },
    },
  });

  const applications = await prisma.campaignApplication.findMany({
    where: {
      OR: [
        { creatorId: { in: creatorIds } },
        { campaignId: { in: campaignIds } },
      ],
    },
    select: { id: true },
  });
  const applicationIds = applications.map((a) => a.id);

  const earnings = await prisma.earning.findMany({
    where: {
      OR: [
        { applicationId: { in: applicationIds } },
        { campaignId: { in: campaignIds } },
      ],
    },
    select: { id: true },
  });
  const earningIds = earnings.map((e) => e.id);

  // Children first (FK / onDelete order).
  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { userId: { in: userIds } } }),
    prisma.platformRevenue.deleteMany({
      where: {
        OR: [
          { campaignId: { in: campaignIds } },
          { creatorId: { in: creatorIds } },
        ],
      },
    }),
    // Payouts are the single settlement channel; WITHDRAWN/Payment rows no
    // longer exist.
    // Proofs reference payouts/intents with Restrict, so drop them first.
    prisma.paymentProof.deleteMany({
      where: {
        OR: [
          { campaignId: { in: campaignIds } },
          { payout: { creatorId: { in: creatorIds } } },
        ],
      },
    }),
    prisma.payout.deleteMany({ where: { creatorId: { in: creatorIds } } }),
    prisma.paymentIntent.deleteMany({ where: { campaignId: { in: campaignIds } } }),
    prisma.earning.deleteMany({ where: { id: { in: earningIds } } }),
    prisma.submission.deleteMany({
      where: {
        OR: [
          { campaignId: { in: campaignIds } },
          { creatorId: { in: creatorIds } },
        ],
      },
    }),
    prisma.campaignApplication.deleteMany({ where: { id: { in: applicationIds } } }),
    prisma.campaign.deleteMany({ where: { id: { in: campaignIds } } }),
    prisma.socialAccount.deleteMany({
      where: {
        OR: [
          { creatorId: { in: creatorIds } },
          { businessId: { in: businessIds } },
        ],
      },
    }),
    prisma.creatorProfile.deleteMany({ where: { id: { in: creatorIds } } }),
    prisma.businessProfile.deleteMany({ where: { id: { in: businessIds } } }),
    prisma.user.deleteMany({ where: userIds.length ? { id: { in: userIds } } : {} }),
  ]);
}
