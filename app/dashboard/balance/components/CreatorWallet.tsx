"use client";

import { OverviewHeader } from "./Overviewheader";
import { Card } from "@/components/ui/card";
import { formatTZS } from "@/lib/utils";
import type { CreatorWallet as CreatorWalletData } from "@/lib/wallet";
import {
  EARNING_STATUS_STYLES,
  EARNING_STATUS_DOT,
} from "@/lib/status-styles";
import { WalletIcon, LucideHourglass, LockKeyholeIcon } from "lucide-react";
import {
  LuBadgeDollarSign,
  LuInfinity,
  LuLandmark,
} from "react-icons/lu";

type WalletEarning = CreatorWalletData["earnings"][number];

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function EarningsTable({ earnings }: { earnings: WalletEarning[] }) {
  return (
    <div className="border border-border bg-card overflow-hidden" style={{ borderRadius: 24 }}>
      <table className="w-full text-sm">
        <thead className="bg-[#FAFAF9] text-muted-foreground text-xs tracking-wider">
          <tr>
            <th className="p-3 text-left">No.</th>
            <th className="p-3 text-left">Campaign</th>
            <th className="p-3 text-left">Gross Amount</th>
            <th className="p-3 text-left">Platform Fee</th>
            <th className="p-3 text-left">Earnings</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Payout Ref</th>
          </tr>
        </thead>
        <tbody>
          {earnings.map((earning, index) => (
            <tr
              key={earning.id}
              className="group border-t border-border transition-all duration-200 hover:bg-[#FAFAF9]"
            >
              <td className="p-3 text-muted-foreground">
                <div className="flex justify-center items-center gap-2 border border-border rounded-full px-2 py-2 text-xs font-medium text-muted-foreground">
                  {index + 1}
                </div>
              </td>
              <td className="p-3 text-foreground">
                {earning.campaign?.name || "Unknown"}
              </td>
              <td className="p-3 text-muted-foreground">
                TZS {formatTZS(earning.amount)}
              </td>
              <td className="p-3 text-muted-foreground">
                TZS {formatTZS(earning.platformFee)}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({earning.platformFeeRate}%)
                </span>
              </td>
              <td className="p-3 text-foreground font-medium">
                TZS {formatTZS(earning.creatorAmount)}
              </td>
              <td className="p-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs border ${
                    EARNING_STATUS_STYLES[earning.status] ?? ""
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      EARNING_STATUS_DOT[earning.status] ?? "bg-zinc-500"
                    }`}
                  />
                  {earning.status}
                </span>
              </td>
              <td className="p-3 text-muted-foreground">
                {earning.payout?.paymentReference || (earning.payout ? "Pending review" : "—")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface CreatorWalletProps {
  wallet: CreatorWalletData;
}

export default function CreatorWallet({ wallet }: CreatorWalletProps) {
  return (
    <div className="space-y-6">
      <OverviewHeader title="Creator Wallet" />

      <div className="px-4 lg:px-6">
        <Card className="relative overflow-hidden rounded-2xl border-0 bg-orange-500 p-5 text-white shadow-xs gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <WalletIcon className="size-3.5" />
                </div>
                <span className="text-xs font-medium">Available Balance</span>
              </div>
              <div className="mt-3 text-3xl font-semibold tabular-nums">
                TZS {formatTZS(wallet.available)}
              </div>
              <div className="mt-1 text-[11px] text-white/70">
                Ready for a scheduled payout across approved campaigns
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <span className="text-xs font-medium text-amber-600">
                <LucideHourglass size={12} />
              </span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Pending Balance
            </span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(wallet.pending + wallet.approved)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Awaiting approval & settlement
          </div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
              <span className="text-xs font-medium text-blue-600">
                <LockKeyholeIcon size={12} />
              </span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              In Review
            </span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(wallet.processing)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Frozen in a payout under admin review
          </div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
              <span className="text-xs font-medium text-orange-600">
                <LuInfinity />
              </span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Lifetime Earnings
            </span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(wallet.lifetime)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Across all campaigns
          </div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <span className="text-xs font-medium text-emerald-600">
                <LuLandmark />
              </span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Total Paid
            </span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(wallet.paid)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Successfully paid out via schedule
          </div>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-2xl">
          <div className="p-1">
            <h2 className="text-lg font-semibold">Earnings History</h2>
          </div>

          {wallet.earnings.length === 0 ? (
            <div
              className="mt-5 flex flex-col items-center justify-center border border-border bg-card py-20"
              style={{ borderRadius: 24 }}
            >
              <div className="text-5xl mb-4">
                <LuBadgeDollarSign />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                No earnings yet
              </h3>
              <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Your earnings will appear here after your campaign submissions
                have been approved by brands, and are paid out through monthly
                scheduled payouts.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <EarningsTable earnings={wallet.earnings} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}