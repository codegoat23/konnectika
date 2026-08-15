// app/dashboard/payouts/components/types.ts
//
// Shared types for the payout dashboards (admin + creator). Thin re-exports
// from lib/payout so UI components stay decoupled from the lib.

import type {
  PayoutRecord,
  PayoutSettings,
  PayoutEligibility,
} from "@/lib/payout";

export type { PayoutSettings };

/** A payout as listed in the admin ledger, with the creator's current
 *  available balance (what is NOT frozen into this payout / rolls over). */
export type AdminPayout = PayoutRecord & { currentBalance: number };

export type CreatorPayout = PayoutRecord;

export type { PayoutEligibility };
