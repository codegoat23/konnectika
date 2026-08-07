"use client";

import { useState } from "react";
import { OverviewHeader } from "./Overviewheader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTZS } from "@/lib/utils";
import type { CreatorWallet as CreatorWalletData } from "@/lib/wallet";
import { WalletIcon, ArrowUpRightIcon, Loader2Icon, LucideHourglass } from "lucide-react";
import { LuBadgeDollarSign, LuBanknote, LuInfinity, LuLandmark } from "react-icons/lu";

type WalletEarning = CreatorWalletData["earnings"][number];
type WalletWithdrawal = CreatorWalletData["withdrawals"][number];

const EARNING_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  AVAILABLE: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  WITHDRAWN: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

const WITHDRAWAL_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  PROCESSING: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  PAID: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border border-red-500/20",
};
const EARNING_STATUS_DOT: Record<string, string> = {
  PENDING: "bg-amber-400",
  AVAILABLE: "bg-emerald-400",
  WITHDRAWN: "bg-emerald-400",
};

const PAYMENT_METHODS = [
  "M-PESA",
  "Airtel Money",
  "Tigo Pesa",
  "Bank Transfer",
  "Other",
];

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
    <div className="border border-border overflow-hidden" style={{ borderRadius: 24 }}>
      <table className="w-full text-sm">
        <thead className="bg-card text-muted-foreground text-xs tracking-wider">
          <tr>
            <th className="p-3 text-left">No.</th>
            <th className="p-3 text-left">Campaign</th>
            <th className="p-3 text-left">Gross Amount</th>
            <th className="p-3 text-left">Platform Fee</th>
            <th className="p-3 text-left">Earnings</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Available Date</th>
          </tr>
        </thead>
        <tbody>
          {earnings.map((earning, index) => (
            <tr
              key={earning.id}
              className="group border-t border-border transition-all duration-200 hover:bg-card/60"
            >
                <td className="p-3 text-muted-foreground">
          <div className="flex justify-center items-center gap-2 border border-border rounded-full px-2 py-2 text-xs font-medium text-muted-foreground">
{index + 1}
          </div>
          </td>
              <td className="p-3 text-foreground">
                {earning.submission?.campaign?.name || "Unknown"}
              </td>
              <td className="p-3 text-muted-foreground">TZS {formatTZS(earning.amount)}</td>
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
              <div className="flex items-center justify-center">
  <span
    className={`h-2.5 w-2.5 rounded-full ${
      EARNING_STATUS_DOT[earning.status] ?? "bg-zinc-500"
    }`}
    title={earning.status}
  />
</div>
              </td>
              <td className="p-3 text-muted-foreground">
                {formatDate(earning.availableAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WithdrawalHistory({
  withdrawals,
}: {
  withdrawals: WalletWithdrawal[];
}) {
  return (
    <div className="border border-border overflow-hidden" style={{ borderRadius: 24 }}>
      <table className="w-full text-sm">
        <thead className="bg-card text-muted-foreground text-xs tracking-wider">
          <tr>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Method</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((withdrawal) => (
            <tr
              key={withdrawal.id}
              className="group border-t border-border transition-all duration-200 hover:bg-card/60"
            >
              <td className="p-3 text-foreground font-medium">
                TZS {formatTZS(withdrawal.amount)}
              </td>
              <td className="p-3 text-muted-foreground">
                {formatDate(withdrawal.requestedAt)}
              </td>
              <td className="p-3 text-muted-foreground">
                {withdrawal.paymentMethod || "—"}
              </td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs border ${
                    WITHDRAWAL_STATUS_STYLES[withdrawal.status] ?? ""
                  }`}
                >
                  {withdrawal.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WithdrawDialog({ wallet }: { wallet: CreatorWalletData }) {
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Withdrawal failed. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          disabled={wallet.available <= 0}
          className="bg-primary text-primary-foreground font-medium hover:bg-zinc-200 cursor-pointer"
          style={{ borderRadius: 14 }}
        >
          <ArrowUpRightIcon />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            You can withdraw your full available balance. It will be reviewed
            by an admin before payout.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Available Balance</span>
          <span className="text-lg font-semibold text-foreground">
            TZS {formatTZS(wallet.available)}
          </span>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Payment Method</label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={submitting || !paymentMethod}
            className="cursor-pointer"
          >
            {submitting && <Loader2Icon className="animate-spin" />}
            Confirm Withdrawal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
              <div className="mt-1 text-[11px] text-white">
                Ready to withdraw across all approved campaigns
              </div>
            </div>

            <WithdrawDialog wallet={wallet} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-3">
        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <span className="text-xs font-medium text-amber-400"><LucideHourglass size={12} /></span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Pending Balance</span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(wallet.pending)}
          </div>
          <div className="text-[11px] text-muted-foreground">Awaiting settlement</div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
              <span className="text-xs font-medium text-orange-500"><LuInfinity/></span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Lifetime Earnings</span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(wallet.lifetime)}
          </div>
          <div className="text-[11px] text-muted-foreground">Across all campaigns</div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <span className="text-xs font-medium text-emerald-400"><LuLandmark /></span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Total Withdrawn</span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(wallet.withdrawn)}
          </div>
          <div className="text-[11px] text-muted-foreground">Successfully paid out</div>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-2xl ">
          <div className="p-1">
            <h2 className="text-lg font-semibold">Earnings History</h2>
          </div>

          {wallet.earnings.length === 0 ? (
            <div
              className="mt-5 flex flex-col items-center justify-center border border-border bg-card/40 py-20"
              style={{ borderRadius: 24 }}
            >
              <div className="text-5xl mb-4"><LuBadgeDollarSign /></div>
              <h3 className="text-lg font-semibold text-foreground">No earnings yet</h3>
              <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Your earnings will appear here after your campaign submissions
                have been approved by brands.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <EarningsTable earnings={wallet.earnings} />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-2xl ">
          <div className="p-1">
            <h2 className="text-lg font-semibold">Withdrawal History</h2>
          </div>

          {wallet.withdrawals.length === 0 ? (
            <div
              className="mt-5 flex flex-col items-center justify-center border border-border bg-card/40 py-16"
              style={{ borderRadius: 24 }}
            >
              <div className="text-4xl mb-4"><LuLandmark /></div>
              <h3 className="text-lg font-semibold text-foreground">No withdrawals yet</h3>
              <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Once your earnings are available, you can withdraw them here.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <WithdrawalHistory withdrawals={wallet.withdrawals} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
