// lib/pricing.ts
//
// Single source of truth for platform fee configuration and math.
// Percentages come from environment variables with safe defaults and are
// SNAPSHOTTED onto every Earning / PlatformRevenue row at write time, so
// changing a percentage only affects NEW transactions. Old records keep the
// feeRate/feeAmount they were created with.

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
  5
);

export function getCreatorFeePercent(): number {
  return PLATFORM_CREATOR_FEE_PERCENT;
}

export function getBrandFeePercent(): number {
  return PLATFORM_BRAND_FEE_PERCENT;
}

export interface CreatorFeeSplit {
  amount: number; // gross campaign payment
  platformFeeRate: number; // percent
  platformFee: number;
  creatorAmount: number; // net the creator earns
}

// Gross -> gross | fee | net split for a creator earning.
export function computeCreatorFeeSplit(gross: number): CreatorFeeSplit {
  const rate = getCreatorFeePercent();
  const platformFee = Math.round((gross * rate) / 100);
  return {
    amount: gross,
    platformFeeRate: rate,
    platformFee,
    creatorAmount: gross - platformFee,
  };
}

export interface BrandFee {
  budget: number; // campaign budgetTotal
  feeRate: number; // percent
  feeAmount: number;
  totalCharge: number; // what the brand is billed (budget + fee)
}

// Campaign budget -> platform fee charged on top of the budget.
// The fee is platform revenue and never reduces creator payouts.
export function computeBrandFee(budget: number): BrandFee {
  const rate = getBrandFeePercent();
  const feeAmount = Math.round((budget * rate) / 100);
  return {
    budget,
    feeRate: rate,
    feeAmount,
    totalCharge: budget + feeAmount,
  };
}
