"use client";

import { useState } from "react";
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
import type {
  CreatorPayout,
  PayoutEligibility,
  PayoutSettings,
} from "@/app/dashboard/payouts/components/types";
import { PAYOUT_STATUS_STYLES } from "@/lib/status-styles";
import {
  PAYMENT_METHODS,
  isMobileMoneyMethod,
} from "@/lib/payment";
import {
  WalletIcon,
  ArrowUpRightIcon,
  Loader2Icon,
  CalendarDaysIcon,
  LockKeyholeIcon,
} from "lucide-react";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface CreatorPayoutsProps {
  settings: PayoutSettings;
  eligibility: PayoutEligibility;
  payouts: CreatorPayout[];
}

function RequestPayoutDialog({
  eligibility,
  onDone,
}: {
  eligibility: PayoutEligibility;
  onDone: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>();
  const [paymentPhone, setPaymentPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPhone = isMobileMoneyMethod(paymentMethod);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod, paymentPhone }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Payout request failed. Please try again.");
        setSubmitting(false);
        return;
      }
      onDone();
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
          disabled={
            !eligibility.eligible ||
            eligibility.hasActivePayout ||
            eligibility.availableBalance <= 0
          }
          className="bg-primary text-primary-foreground font-medium hover:bg-[#EA580C] cursor-pointer"
          style={{ borderRadius: 14 }}
        >
          <ArrowUpRightIcon />
          Request Payout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Monthly Payout</DialogTitle>
          <DialogDescription>
            Your available balance will be batched into a payout and reviewed
            by an admin. This cannot be undone while it is under review.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Payout Amount</span>
          <span className="text-lg font-semibold text-foreground">
            TZS {formatTZS(eligibility.availableBalance)}
          </span>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Payment Method</label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Where should you be paid?" />
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

        {needsPhone && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="e.g. 0712 345 678 or +255 712 345 678"
              value={paymentPhone}
              onChange={(e) => setPaymentPhone(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-all focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10"
            />
            <p className="text-[11px] text-muted-foreground">
              The {paymentMethod} number where your payout will be sent.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/15 border border-destructive/25 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={
              submitting ||
              !paymentMethod ||
              (needsPhone && !paymentPhone.trim())
            }
            className="cursor-pointer"
          >
            {submitting && <Loader2Icon className="animate-spin" />}
            Confirm Payout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CreatorPayouts({
  settings,
  eligibility,
  payouts,
}: CreatorPayoutsProps) {
  return (
    <div className="space-y-6">
      <div className="px-4 lg:px-6">
        <Card className="relative overflow-hidden rounded-2xl border-0 bg-zinc-900 p-5 text-white shadow-xs gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <CalendarDaysIcon className="size-3.5" />
                </div>
                <span className="text-xs font-medium">Next Payout Date</span>
              </div>
              <div className="mt-3 text-3xl font-semibold tabular-nums">
                {formatDate(eligibility.nextPayoutDate)}
              </div>
              <div className="mt-1 text-[11px] text-white/70">
                Monthly on day {settings.payoutDay} · Minimum TZS{" "}
                {formatTZS(settings.minimumPayoutAmount)}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <RequestPayoutDialog eligibility={eligibility} onDone={() => {}} />
              {eligibility.hasActivePayout && (
                <span className="text-[11px] text-white/70 flex items-center gap-1">
                  <LockKeyholeIcon className="size-3" />
                  A payout is already under review
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-3">
        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success/15">
              <WalletIcon className="size-3.5 text-success" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Available Balance
            </span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(eligibility.availableBalance)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Ready for payout
          </div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
              <span className="text-xs font-medium text-orange-600">
                <ArrowUpRightIcon size={12} />
              </span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Minimum Payout
            </span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(settings.minimumPayoutAmount)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Threshold to request a payout
          </div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-info/15">
              <span className="text-xs font-medium text-info">
                {eligibility.eligible ? "✓" : "+"}
              </span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {eligibility.eligible ? "Eligible" : "Until Eligible"}
            </span>
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            {eligibility.eligible ? (
              <span className="text-success">Eligible</span>
            ) : (
              <>TZS {formatTZS(eligibility.remainingToEligible)}</>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {eligibility.eligible
              ? "You can request a payout"
              : "More earnings needed before your next payout"}
          </div>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-2xl">
          <div className="p-1">
            <h2 className="text-lg font-semibold">Payout History</h2>
            <p className="text-xs text-muted-foreground">
              Amounts below the minimum threshold roll over to the next payout
              period.
            </p>
          </div>

          {payouts.length === 0 ? (
            <div
              className="mt-5 flex flex-col items-center justify-center border border-border bg-card/40 py-16"
              style={{ borderRadius: 24 }}
            >
              <div className="text-4xl mb-4">🗓️</div>
              <h3 className="text-lg font-semibold text-foreground">
                No payouts yet
              </h3>
              <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Once your available balance reaches TZS{" "}
                {formatTZS(settings.minimumPayoutAmount)}, you can request a
                payout and it will be reviewed by an admin.
              </p>
            </div>
          ) : (
         <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[650px] text-sm">
        <thead className="bg-muted">
        <tr className="border-b border-border">
          <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Amount
          </th>
          <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Date
          </th>
          <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </th>
          <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Reference
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-border">
        {payouts.map((payout) => (
          <tr
            key={payout.id}
            className="group transition-colors hover:bg-muted/30"
          >
            <td className="px-4 py-4">
              <span className="font-semibold text-foreground">
                TZS {formatTZS(payout.amount)}
              </span>
            </td>

            <td className="px-4 py-4 whitespace-nowrap">
              <span className="text-muted-foreground">
                {formatDate(payout.requestedAt)}
              </span>
            </td>

            <td className="px-4 py-4">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  PAYOUT_STATUS_STYLES[payout.status] ??
                  "border-border bg-muted/50 text-muted-foreground"
                }`}
              >
                {payout.status}
              </span>
            </td>

            <td className="max-w-[240px] px-4 py-4">
              <span
                className="block truncate font-mono text-xs text-muted-foreground"
                title={payout.paymentReference || undefined}
              >
                {payout.paymentReference || "—"}
              </span>
            </td>
          </tr>
        ))}

        {payouts.length === 0 && (
          <tr>
            <td colSpan={4}>
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted/50 text-xl">
                  💸
                </div>

                <p className="text-sm font-medium text-foreground">
                  No payouts yet
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Payout history will appear here once a payout is requested.
                </p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
          )}
        </div>
      </div>
    </div>
  );
}
