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
import { PaymentMethodDisplay } from "@/components/payment-method-display";
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
import PayoutAccountSection, {
  type PayoutAccount,
} from "./PayoutAccountSection";
import {
  WalletIcon,
  ArrowUpRightIcon,
  Loader2Icon,
  CalendarDaysIcon,
  LockKeyholeIcon,
  InfoIcon,
  CheckIcon,
  PlusIcon,
  Megaphone,
} from "lucide-react";
import { FaReceipt } from "react-icons/fa6";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMobileDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface CreatorPayoutsProps {
  settings: PayoutSettings;
  eligibility: PayoutEligibility;
  payouts: CreatorPayout[];
}

function RequestPayoutDialog({
  eligibility,
  account,
  onDone,
  triggerClassName,
  roundAction = false,
}: {
  eligibility: PayoutEligibility;
  account: PayoutAccount | null;
  onDone: () => void;
  triggerClassName?: string;
  roundAction?: boolean;
}) {
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(
    account?.method ?? undefined
  );
  const [paymentPhone, setPaymentPhone] = useState(
    account && isMobileMoneyMethod(account.method)
      ? account.phone ?? ""
      : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPhone = isMobileMoneyMethod(paymentMethod);

  const handleMethodChange = (m: string) => {
    setPaymentMethod(m);
    setPaymentPhone(
      account && account.method === m && isMobileMoneyMethod(m)
        ? account.phone ?? ""
        : ""
    );
  };

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
          className={roundAction
            ? `flex h-auto flex-col gap-2 bg-transparent px-1 py-0 text-white shadow-none hover:bg-transparent ${triggerClassName ?? ""}`
            : `bg-primary text-primary-foreground font-medium hover:bg-[#EA580C] cursor-pointer ${triggerClassName ?? ""}`}
          style={roundAction ? undefined : { borderRadius: 14 }}
        >
          {roundAction ? (
            <>
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-zinc-900 shadow-sm">
                <ArrowUpRightIcon className="size-5" />
              </span>
              <span className="text-[11px] font-medium">Request</span>
            </>
          ) : (
            <><ArrowUpRightIcon />Request Payout</>
          )}
        </Button>
      </DialogTrigger>
     <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl p-2">
  <DialogHeader className="border-b border-border px-6 py-5">
    <DialogTitle className="text-lg font-semibold tracking-tight">
      Request Monthly Payout
    </DialogTitle>
    
  </DialogHeader>

  <div className="space-y-5 px-6 py-5">
    {/* Payout amount */}
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Available payout
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            TZS {formatTZS(eligibility.availableBalance)}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
          <WalletIcon className="h-5 w-5" />
        </div>
      </div>
    </div>

    {/* Payment method */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Payment method
      </label>

      <Select value={paymentMethod} onValueChange={handleMethodChange}>
        <SelectTrigger className="min-h-15 w-full rounded-lg mt-2 p-2">
          <SelectValue placeholder="Select payment method" />
        </SelectTrigger>

        <SelectContent className="rounded-xl p-3">
          {PAYMENT_METHODS.map((method) => (
            <SelectItem
              key={method}
              value={method}
              className="rounded-lg py-2.5"
            >
              <PaymentMethodDisplay method={method} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Phone number */}
    {needsPhone && (
      <div className="space-y-2">
        <label
          htmlFor="payment-phone"
          className="text-sm font-medium text-foreground"
        >
          Phone number <span className="text-destructive">*</span>
        </label>

        <input
          id="payment-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0712 345 678"
          value={paymentPhone}
          onChange={(e) => setPaymentPhone(e.target.value)}
          className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 mt-2"
        />

        <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Enter the{" "}
            <span className="font-medium text-foreground">
              <PaymentMethodDisplay method={paymentMethod} size="sm" />
            </span>{" "}
            number where your payout will be sent.
          </p>
        </div>
      </div>
    )}

    {/* Error */}
    {error && (
      <div
        role="alert"
        className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
      >
        {error}
      </div>
    )}
  </div>

  {/* Footer */}
  <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4 sm:justify-between">
    <DialogClose asChild>
      <Button
        variant="ghost"
        className="cursor-pointer rounded-xl"
        disabled={submitting}
      >
        Cancel
      </Button>
    </DialogClose>

    <Button
      onClick={submit}
      disabled={
        submitting ||
        !paymentMethod ||
        (needsPhone && !paymentPhone.trim())
      }
      className="w-full cursor-pointer rounded-xl bg-orange-500 text-white hover:bg-orange-600 sm:w-auto"
    >
      {submitting ? (
        <>
          <Loader2Icon className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Confirm Payout"
      )}
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
  const [account, setAccount] = useState<PayoutAccount | null>(null);
  const [showMobileAccount, setShowMobileAccount] = useState(false);

  return (
    <div className="space-y-6">
      <div className="hidden px-4 lg:px-6 md:block">
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
              <RequestPayoutDialog
                eligibility={eligibility}
                account={account}
                onDone={() => {}}
              />
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

      <div className="px-4 md:hidden">
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-zinc-900 p-5 text-white shadow-lg gap-4">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border border-white/5" />
          <div className="relative">
            <p className="text-xs font-medium text-white/65">Available Balance</p>
            <p className="mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums">
              TZS {formatTZS(eligibility.availableBalance)}
            </p>
            <p className="mt-2 text-xs text-white/65">
              Next payout {formatDate(eligibility.nextPayoutDate)}
            </p>
          </div>
          <div className="relative flex items-start justify-center gap-7 border-t border-white/10 pt-4">
            <RequestPayoutDialog
              eligibility={eligibility}
              account={account}
              onDone={() => {}}
              roundAction
            />
            <Button
              type="button"
              variant="ghost"
              className="flex h-auto flex-col gap-2 bg-transparent px-1 py-0 text-white shadow-none hover:bg-transparent hover:text-white"
              onClick={() => setShowMobileAccount((visible) => !visible)}
              aria-expanded={showMobileAccount}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-zinc-900 shadow-sm">
                <WalletIcon className="size-5" />
              </span>
              <span className="text-[11px] font-medium">Account</span>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost" className="flex h-auto flex-col gap-2 bg-transparent px-1 py-0 text-white shadow-none hover:bg-transparent hover:text-white" aria-label="Payout information">
                  <span className="flex size-12 items-center justify-center rounded-full bg-white text-zinc-900 shadow-sm">
                    <InfoIcon className="size-5" />
                  </span>
                  <span className="text-[11px] font-medium">Details</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Payout details</DialogTitle>
                  <DialogDescription>
                    Your balance is paid on day {settings.payoutDay} of each month when it meets the minimum payout amount.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 rounded-xl bg-muted/40 p-4 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Minimum payout</span><span className="font-medium">TZS {formatTZS(settings.minimumPayoutAmount)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground">Eligibility</span><span className="text-right font-medium">{eligibility.eligible ? "Ready to request" : `TZS ${formatTZS(eligibility.remainingToEligible)} to go`}</span></div>
                  {eligibility.hasActivePayout && <p className="flex items-center gap-2 text-xs text-muted-foreground"><LockKeyholeIcon className="size-3.5" /> A payout is already under review.</p>}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
        {showMobileAccount && (
          <div className="mt-3">
            <PayoutAccountSection setAccount={setAccount} />
          </div>
        )}
      </div>

      <div className="hidden px-4 lg:px-6 md:block">
        <PayoutAccountSection setAccount={setAccount} />
      </div>

      <div className="hidden grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-3 md:grid">
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
                {eligibility.eligible ? (<CheckIcon size={12} />) : (<PlusIcon size={12} />)}
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
         <>
         <div className="mt-5 hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
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
         <div className="mt-5 space-y-2 md:hidden">
           {payouts.map((payout) => (
             <article key={payout.id} className="flex items-center gap-3 rounded-2xl  bg-card p-3.5">
               <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-orange-500">
                 <FaReceipt className="size-4" />
               </div>
               <div className="min-w-0 flex-1">
                 <p className="truncate text-sm font-medium text-foreground">Payout request</p>
                 <div className="mt-1 flex min-w-0 items-center gap-2">
                   <span className={`inline-flex shrink-0 items-center rounded-full  px-2 py-0.5 text-[10px] font-medium ${PAYOUT_STATUS_STYLES[payout.status] ?? "border-border bg-muted/50 text-muted-foreground"}`}>
                     {payout.status}
                   </span>
                   {payout.paymentReference && <span className="truncate text-xs text-muted-foreground">{payout.paymentReference}</span>}
                 </div>
               </div>
               <div className="shrink-0 text-right">
                 <p className="text-sm font-semibold tabular-nums text-foreground">TZS {formatTZS(payout.amount)}</p>
                 <p className="mt-1 text-xs tabular-nums text-muted-foreground">{formatMobileDate(payout.requestedAt)}</p>
               </div>
             </article>
           ))}
         </div>
         </>
          )}
        </div>
      </div>
    </div>
  );
}
