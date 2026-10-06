"use client";

import { OverviewHeader } from "./Overviewheader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatTZS } from "@/lib/utils";
import type { CreatorWallet as CreatorWalletData } from "@/lib/wallet";
import {
  EARNING_STATUS_STYLES,
  EARNING_STATUS_DOT,
} from "@/lib/status-styles";
import { WalletIcon, LucideHourglass, LockKeyholeIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  LuBadgeDollarSign,
  LuInfinity,
  LuLandmark,
} from "react-icons/lu";
import { IoIosMegaphone } from "react-icons/io";

type WalletEarning = CreatorWalletData["earnings"][number];

function formatMobileDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function EarningsTable({ earnings }: { earnings: WalletEarning[] }) {
  return (
    <>
    <div className="hidden md:block">
    <div className="border border-border bg-card overflow-hidden" style={{ borderRadius: 24 }}>
      <table className="w-full text-sm">
        <thead className="bg-muted text-muted-foreground text-xs tracking-wider">
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
              className="group border-t border-border transition-all duration-200 hover:bg-muted"
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
    </div>
    <div className="space-y-2 md:hidden">
      {earnings.map((earning) => (
        <article key={earning.id} className="flex items-center gap-3 rounded-2xl  bg-card p-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-orange-600">
            <IoIosMegaphone className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{earning.campaign?.name || "Unknown campaign"}</p>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full  px-2 py-0.5 text-[10px] font-medium ${EARNING_STATUS_STYLES[earning.status] ?? ""}`}>
                
                {earning.status}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {earning.payout?.paymentReference || (earning.payout ? "Pending review" : "—")}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums text-foreground">TZS {formatTZS(earning.creatorAmount)}</p>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">{formatMobileDate(earning.createdAt)}</p>
          </div>
        </article>
      ))}
    </div>
    </>
  );
}

interface CreatorWalletProps {
  wallet: CreatorWalletData;
}

export default function CreatorWallet({ wallet }: CreatorWalletProps) {
  const [selectedMetric, setSelectedMetric] = useState<{
    title: string;
    amount: string;
    description: string;
    icon: ReactNode;
  } | null>(null);

  const mobileMetrics = [
    { title: "Pending", amount: `TZS ${formatTZS(wallet.pending + wallet.approved)}`, description: "Earnings awaiting approval and settlement.", icon: <LucideHourglass className="size-5" /> },
    { title: "In Review", amount: `TZS ${formatTZS(wallet.processing)}`, description: "Funds in a payout under admin review.", icon: <LockKeyholeIcon className="size-5" /> },
    { title: "Lifetime", amount: `TZS ${formatTZS(wallet.lifetime)}`, description: "Total earnings across all campaigns.", icon: <LuInfinity className="size-5" /> },
    { title: "Total Paid", amount: `TZS ${formatTZS(wallet.paid)}`, description: "Successfully paid out via schedule.", icon: <LuLandmark className="size-5" /> },
  ];

  return (
    <div className="space-y-6">
      <OverviewHeader title="Creator Wallet" />

      <div className="hidden px-4 lg:px-6 md:block">
        <Card className="relative overflow-hidden rounded-2xl border-0 bg-orange-500 p-4 text-white shadow-xs gap-3 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <WalletIcon className="size-3.5" />
                </div>
                <span className="text-xs font-medium">Available Balance</span>
              </div>
              <div className="mt-3 break-words text-2xl font-semibold tabular-nums sm:text-3xl">
                TZS {formatTZS(wallet.available)}
              </div>
              <div className="mt-1 text-[11px] text-white/70">
                Ready for a scheduled payout across approved campaigns
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="px-4 md:hidden">
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-zinc-900 p-5 text-white shadow-lg gap-4">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border border-white/5" />
          <div className="relative">
            <p className="text-xs font-medium text-white/65">Available Balance</p>
            <p className="mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums">TZS {formatTZS(wallet.available)}</p>
            <p className="mt-2 text-xs text-white/65">Ready for a scheduled payout</p>
          </div>
          <div className="relative grid grid-cols-4 gap-2 border-t border-white/10 pt-4">
            {mobileMetrics.map((metric) => (
              <Button key={metric.title} variant="ghost" className="flex h-auto flex-col gap-2 bg-transparent px-0 py-0 text-white shadow-none hover:bg-transparent hover:text-white" onClick={() => setSelectedMetric(metric)}>
                <span className="flex size-11 items-center justify-center rounded-full bg-white text-zinc-900 shadow-sm">{metric.icon}</span>
                <span className="text-center text-[10px] font-medium leading-tight">{metric.title}</span>
              </Button>
            ))}
          </div>
        </Card>
        <Dialog open={selectedMetric !== null} onOpenChange={(open) => !open && setSelectedMetric(null)}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMetric?.title}</DialogTitle>
              <DialogDescription>{selectedMetric?.description}</DialogDescription>
            </DialogHeader>
            <p className="text-2xl font-semibold tabular-nums">{selectedMetric?.amount}</p>
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-4 md:grid">
        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning/15">
              <span className="text-xs font-medium text-warning">
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
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-info/15">
              <span className="text-xs font-medium text-info">
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
          
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success/15">
              <span className="text-xs font-medium text-success">
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
