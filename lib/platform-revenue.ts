// lib/platform-revenue.ts
//
// Platform revenue service. Every fee deducted by the platform becomes a
// permanent, immutable PlatformRevenue row, linked to the campaign it came
// from and to the creator/brand (and, for creator fees, the Earning) it was
// charged against.
//
// Idempotency: rows carry unique (earningId, type) / (campaignId, type)
// constraints, and the record functions upsert on those keys, so retried
// money events can never create duplicate revenue records.

import { prisma } from "@/lib/prisma";
import type { Prisma, PlatformRevenueType } from "@prisma/client";

export type PlatformRevenueCreateInput = {
  campaignId: string;
  grossAmount: number;
  feeRate: number;
  feeAmount: number;
  description?: string;
};

export type CreatorFeeInput = PlatformRevenueCreateInput & {
  earningId: string;
  creatorId: string;
};

export type BrandFeeInput = PlatformRevenueCreateInput & {
  businessId: string;
};

// Record the platform fee deducted from a creator earning. Returns the
// existing row when the fee was already recorded (retry-safe).
export async function recordCreatorFee(
  tx: Prisma.TransactionClient,
  input: CreatorFeeInput
) {
  return tx.platformRevenue.upsert({
    where: {
      earningId: input.earningId,
    },
    update: {},
    create: {
      type: "CREATOR_FEE",
      status: "ACCRUED",
      feeRate: input.feeRate,
      grossAmount: input.grossAmount,
      feeAmount: input.feeAmount,
      description:
        input.description ?? `Creator platform fee (${input.feeRate}%)`,
      campaignId: input.campaignId,
      creatorId: input.creatorId,
      earningId: input.earningId,
    },
  });
}

// Record the platform fee charged to a brand on campaign creation. Returns
// the existing row when the fee was already recorded (retry-safe).
export async function recordBrandFee(
  tx: Prisma.TransactionClient,
  input: BrandFeeInput
) {
  return tx.platformRevenue.upsert({
    where: {
      campaignId_type_businessId: {
        campaignId: input.campaignId,
        type: "BRAND_FEE",
        businessId: input.businessId,
      },
    },
    update: {},
    create: {
      type: "BRAND_FEE",
      status: "ACCRUED",
      feeRate: input.feeRate,
      grossAmount: input.grossAmount,
      feeAmount: input.feeAmount,
      description:
        input.description ?? `Brand platform fee (${input.feeRate}%)`,
      campaignId: input.campaignId,
      businessId: input.businessId,
    },
  });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const revenueInclude = {
  campaign: { select: { id: true, name: true } },
  creator: { select: { id: true, username: true, displayName: true } },
  business: { select: { id: true, companyName: true } },
  earning: { select: { id: true, amount: true, creatorAmount: true } },
} satisfies Prisma.PlatformRevenueInclude;

export type PlatformRevenueRecord = Prisma.PlatformRevenueGetPayload<{
  include: typeof revenueInclude;
}>;

export async function getPlatformRevenue({
  type,
  status,
  campaignId,
  limit = 100,
}: {
  type?: PlatformRevenueType;
  status?: "ACCRUED" | "PAID";
  campaignId?: string;
  limit?: number;
} = {}): Promise<PlatformRevenueRecord[]> {
  return prisma.platformRevenue.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(campaignId ? { campaignId } : {}),
    },
    include: revenueInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export interface PlatformRevenueSummary {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export async function getPlatformRevenueSummary(): Promise<PlatformRevenueSummary> {
  const [byType, byStatus] = await Promise.all([
    prisma.platformRevenue.groupBy({
      by: ["type"],
      _sum: { feeAmount: true },
    }),
    prisma.platformRevenue.groupBy({
      by: ["status"],
      _sum: { feeAmount: true },
    }),
  ]);

  const byTypeMap: Record<string, number> = {};
  for (const row of byType) {
    byTypeMap[row.type] = row._sum.feeAmount ?? 0;
  }

  const byStatusMap: Record<string, number> = {};
  for (const row of byStatus) {
    byStatusMap[row.status] = row._sum.feeAmount ?? 0;
  }

  return {
    total: Object.values(byTypeMap).reduce((s, n) => s + n, 0),
    byType: byTypeMap,
    byStatus: byStatusMap,
  };
}

// Mark an accrued revenue row as PAID once funds are actually received.
export async function markPlatformRevenuePaid({
  id,
  paymentReference,
}: {
  id: string;
  paymentReference?: string;
}) {
  return prisma.platformRevenue.update({
    where: { id },
    data: {
      status: "PAID",
      ...(paymentReference?.trim() ? { paymentReference: paymentReference.trim() } : {}),
    },
  });
}
