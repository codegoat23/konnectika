// lib/pricing.ts
//
// Single source of truth for platform fee configuration and math.
//
// Percentages resolve in this order:
//   1. PlatformSetting rows an admin has saved (authoritative at runtime)
//   2. environment variables
//   3. the built-in defaults below
// and are SNAPSHOTTED onto every Campaign / Earning / PlatformRevenue /
// PaymentIntent row at write time, so changing a percentage only affects NEW
// transactions. Old records keep the rates they were created with.
//
// All money is integer TZS. Percentages are integers or are rounded at the
// point of computation.

import { prisma } from "@/lib/prisma";

const envPercent = (raw: string | undefined, fallback: number): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export const PLATFORM_CREATOR_FEE_PERCENT = envPercent(
  process.env.PLATFORM_CREATOR_FEE_PERCENT,
  10
);

export const PLATFORM_BRAND_FEE_PERCENT = envPercent(
  process.env.PLATFORM_BRAND_FEE_PERCENT,
  10
);

// ---------------------------------------------------------------------------
// Admin-configurable platform settings
// ---------------------------------------------------------------------------

export const PRICING_SETTING_BRAND_FEE = "pricing.brandFeePercent";
export const PRICING_SETTING_CREATOR_FEE = "pricing.creatorFeePercent";
export const PRICING_SETTING_COLLECTION_FEE =
  "pricing.snippeCollectionFeePercent";

export interface PlatformPricing {
  brandFeePercent: number;
  creatorFeePercent: number;
  snippeCollectionFeePercent: number;
}

const DEFAULT_PLATFORM_PRICING: PlatformPricing = {
  brandFeePercent: PLATFORM_BRAND_FEE_PERCENT,
  creatorFeePercent: PLATFORM_CREATOR_FEE_PERCENT,
  // Snippe exposes NO collection-fee quote endpoint, so the brand-facing fee
  // line is an admin-configured ESTIMATE. The real fee is written back from
  // the `payment.completed` webhook's `settlement.fees` and reconciled against
  // this number — see lib/payment-intents.ts. Default 0 = the platform absorbs
  // collection fees entirely, which is the safest starting position.
  snippeCollectionFeePercent: envPercent(
    process.env.SNIPPE_COLLECTION_FEE_PERCENT,
    0
  ),
};

function parseSettingPercent(
  raw: string | undefined,
  fallback: number
): number {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Read the effective pricing, preferring admin overrides over env/defaults. */
export async function getPlatformPricing(): Promise<PlatformPricing> {
  const rows = await prisma.platformSetting.findMany({
    where: {
      key: {
        in: [
          PRICING_SETTING_BRAND_FEE,
          PRICING_SETTING_CREATOR_FEE,
          PRICING_SETTING_COLLECTION_FEE,
        ],
      },
    },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  return {
    brandFeePercent: parseSettingPercent(
      byKey.get(PRICING_SETTING_BRAND_FEE),
      DEFAULT_PLATFORM_PRICING.brandFeePercent
    ),
    creatorFeePercent: parseSettingPercent(
      byKey.get(PRICING_SETTING_CREATOR_FEE),
      DEFAULT_PLATFORM_PRICING.creatorFeePercent
    ),
    snippeCollectionFeePercent: parseSettingPercent(
      byKey.get(PRICING_SETTING_COLLECTION_FEE),
      DEFAULT_PLATFORM_PRICING.snippeCollectionFeePercent
    ),
  };
}

export type UpdatePlatformPricingResult =
  | { ok: true; pricing: PlatformPricing }
  | { ok: false; error: string };

/** Persist admin-changed fee percentages. Partial input leaves others alone. */
export async function updatePlatformPricing(
  input: Partial<PlatformPricing>
): Promise<UpdatePlatformPricingResult> {
  const current = await getPlatformPricing();

  const entries: Array<[string, number | undefined]> = [
    [PRICING_SETTING_BRAND_FEE, input.brandFeePercent],
    [PRICING_SETTING_CREATOR_FEE, input.creatorFeePercent],
    [PRICING_SETTING_COLLECTION_FEE, input.snippeCollectionFeePercent],
  ];

  const now = new Date();
  const operations = [];
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      return {
        ok: false,
        error: "Fee percentages must be between 0 and 100.",
      };
    }
    operations.push(
      prisma.platformSetting.upsert({
        where: { key },
        create: { key, value: String(value), updatedAt: now },
        update: { value: String(value), updatedAt: now },
      })
    );
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  return {
    ok: true,
    pricing: {
      brandFeePercent: input.brandFeePercent ?? current.brandFeePercent,
      creatorFeePercent: input.creatorFeePercent ?? current.creatorFeePercent,
      snippeCollectionFeePercent:
        input.snippeCollectionFeePercent ?? current.snippeCollectionFeePercent,
    },
  };
}

// ---------------------------------------------------------------------------
// Synchronous accessors (env/default only — no admin overrides)
// ---------------------------------------------------------------------------
//
// These stay synchronous and override-free so the existing call sites
// (lib/payment-flow.ts earning creation) keep working untouched. Anything
// money-critical that must honour admin settings uses the async
// `getPlatformPricing()` / `computeBrandFeeWithPricing()` variants instead.

export function getCreatorFeePercent(): number {
  return PLATFORM_CREATOR_FEE_PERCENT;
}

export function getBrandFeePercent(): number {
  return PLATFORM_BRAND_FEE_PERCENT;
}

function percentOf(amount: number, rate: number): number {
  return Math.round((amount * rate) / 100);
}

export interface CreatorFeeSplit {
  amount: number; // gross campaign payment
  platformFeeRate: number; // percent
  platformFee: number;
  creatorAmount: number; // net the creator earns
}

// Gross -> gross | fee | net split for a creator earning.
export function computeCreatorFeeSplit(
  gross: number,
  rate: number = getCreatorFeePercent()
): CreatorFeeSplit {
  const platformFee = Math.round((gross * rate) / 100);
  return {
    amount: gross,
    platformFeeRate: rate,
    platformFee,
    creatorAmount: gross - platformFee,
  };
}

/**
 * The creator earning for a campaign payment: what the creator is owed
 * (gross), the platform's cut, and the net the creator actually receives.
 *
 * This is the single function the payment flow uses when creating an
 * earning (at application approval) — a thin, named wrapper over
 * computeCreatorFeeSplit so the flow reads clearly and the same math is
 * reused everywhere.
 */
export function calculateCreatorEarning(
  gross: number,
  creatorFeePercent?: number
): CreatorFeeSplit {
  return computeCreatorFeeSplit(gross, creatorFeePercent);
}

export interface BrandFee {
  budget: number; // campaign budgetTotal
  feeRate: number; // percent
  feeAmount: number;
  totalCharge: number; // what the brand is billed (budget + fee)
}

// Campaign budget -> platform fee charged on top of the budget.
// The fee is platform revenue and never reduces creator payouts.
export function computeBrandFee(
  budget: number,
  /** Pass the admin-configured rate; omit to fall back to env/default. */
  rate: number = getBrandFeePercent()
): BrandFee {
  const platformFee = Math.round((budget * rate) / 100);
  return {
    budget,
    feeRate: rate,
    feeAmount: platformFee,
    totalCharge: budget + platformFee,
  };
}

// ---------------------------------------------------------------------------
// Brand payment breakdown (what the brand is actually charged)
// ---------------------------------------------------------------------------

/**
 * The full charge breakdown for a campaign payment:
 *
 *   budgetTotal
 *   + platformFee   (platform margin — becomes BRAND_FEE revenue)
 *   + providerFee   (estimated Snippe collection fee)
 *   = totalCharge   (what the brand pays)
 *
 * `providerFee` is an ESTIMATE. Snippe has no collection-fee quote endpoint,
 * so the rate comes from admin configuration; the real amount is captured from
 * the `payment.completed` webhook's `settlement.fees` and stored alongside the
 * estimate on the PaymentIntent so the two can be reconciled.
 */
export interface BrandChargeBreakdown {
  budget: number;
  platformFeeRate: number;
  platformFee: number;
  providerFeeRate: number;
  providerFee: number;
  totalCharge: number;
}

export function computeBrandCharge(budget: number, pricing: PlatformPricing): BrandChargeBreakdown {
  const platformFee = percentOf(budget, pricing.brandFeePercent);
  const providerFee = percentOf(budget + platformFee, pricing.snippeCollectionFeePercent);
  return {
    budget,
    platformFeeRate: pricing.brandFeePercent,
    platformFee,
    providerFeeRate: pricing.snippeCollectionFeePercent,
    providerFee,
    totalCharge: budget + platformFee + providerFee,
  };
}
