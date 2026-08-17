"use client";

import { Fragment, useState } from "react";
import { OverviewHeader } from "@/app/dashboard/balance/components/Overviewheader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatTZS } from "@/lib/utils";
import { PaymentMethodDisplay } from "@/components/payment-method-display";
import { PAYOUT_STATUS_STYLES } from "@/lib/status-styles";
import type {
  AdminPayout,
  PayoutSettings,
} from "./types";
import {
  Loader2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  Settings2Icon,
  RefreshCwIcon,
  Calendar,
  WalletCards,
  X,
  CheckCircle2,
  Check,
  XCircle,
} from "lucide-react";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface AdminPayoutsProps {
  payouts: AdminPayout[];
  settings: PayoutSettings;
}

export default function AdminPayouts({
  payouts,
  settings: initialSettings,
}: AdminPayoutsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings state
  const [minimumAmount, setMinimumAmount] = useState(
    String(initialSettings.minimumPayoutAmount)
  );
  const [payoutDay, setPayoutDay] = useState(String(initialSettings.payoutDay));
  const [savingSettings, setSavingSettings] = useState(false);
  const [generating, setGenerating] = useState(false);

  const pendingCount = payouts.filter(
    (p) => p.status === "PENDING" || p.status === "APPROVED"
  ).length;
  const totalValue = payouts
    .filter((p) => p.status === "PENDING" || p.status === "APPROVED")
    .reduce((s, p) => s + p.amount, 0);
  const paidTotal = payouts
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);

  const updateStatus = async (
    id: string,
    status: "APPROVE" | "REJECT" | "PAID"
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/payouts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentReference:
            status === "PAID" ? paymentReference.trim() : undefined,
          rejectionReason:
            status === "REJECT" ? rejectionReason.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Update failed. Please try again.");
        setLoading(false);
        return;
      }
      setMarkPaidId(null);
      setRejectId(null);
      setPaymentReference("");
      setRejectionReason("");
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setError(null);
    try {
      const res = await fetch("/api/payouts/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minimumPayoutAmount: Number(minimumAmount),
          payoutDay: Number(payoutDay),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to save settings.");
        setSavingSettings(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setSavingSettings(false);
    }
  };

  const generatePayouts = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/payouts/generate", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to generate payouts.");
        setGenerating(false);
        return;
      }
      setError(
        data.generated > 0
          ? `Generated ${data.generated} payout${data.generated > 1 ? "s" : ""}.`
          : "No new payouts to generate (it must be the payout day and creators must have cleared the minimum threshold)."
      );
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setGenerating(false);
    }
  };

  const creatorName = (p: AdminPayout) =>
    p.creator.displayName || p.creator.username || "Unknown creator";

  return (
    <div className="space-y-6">
      <OverviewHeader title="Creator Payouts" />

      <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-3">
        <Card className="rounded-2xl bg-orange-500 p-4 text-white shadow-xs gap-2">
          <div className="text-xs font-medium">Awaiting Payout</div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            {pendingCount}
          </div>
          <div className="text-[11px] text-white/80">
            Pending + approved batches
          </div>
        </Card>
        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Pending Value
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(totalValue)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Awaiting admin review
          </div>
        </Card>
        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Total Paid Out
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(paidTotal)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Completed payouts
          </div>
        </Card>
      </div>

      {/* Settings card */}
     <div className="px-4 lg:px-6">
  <Card className="rounded-[24px] border border-border bg-card p-5 shadow-xs">
    {/* Header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
          <Settings2Icon className="h-4 w-4 text-orange-600" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Payout Settings
          </h2>

          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            Set the minimum balance required for payout and the monthly payout
            day. Changes apply to the next payout cycle.
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-9 shrink-0 rounded-xl border-border px-3 text-xs font-medium hover:bg-muted"
        disabled={generating}
        onClick={generatePayouts}
      >
        {generating ? (
          <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCwIcon className="h-3.5 w-3.5" />
        )}

        Generate Payouts
      </Button>
    </div>

    {/* Settings */}
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
      {/* Minimum amount */}
      <div className="rounded-2xl border border-border bg-background/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Minimum payout
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Minimum balance before a payout can be generated.
            </p>
          </div>

          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            TZS
          </span>
        </div>

        <Input
          type="number"
          min={1}
          value={minimumAmount}
          onChange={(e) => setMinimumAmount(e.target.value)}
          className="h-10 rounded-xl border-border bg-card text-sm"
          placeholder="50000"
        />
      </div>

      {/* Payout day */}
      <div className="rounded-2xl border border-border bg-background/50 p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-foreground">
            Payout day
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Day of each month.
          </p>
        </div>

        <div className="relative">
          <Input
            type="number"
            min={1}
            max={31}
            value={payoutDay}
            onChange={(e) => setPayoutDay(e.target.value)}
            className="h-10 rounded-xl border-border bg-card pr-12 text-sm"
            placeholder="25"
          />

          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            / 31
          </span>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-end">
        <Button
          className="h-10 w-full rounded-xl bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600 sm:w-auto"
          disabled={savingSettings}
          onClick={saveSettings}
        >
          {savingSettings && (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          )}

          Save Settings
        </Button>
      </div>
    </div>

   
  </Card>
</div>

      <div className="px-4 lg:px-6">
        <div className="">
          <div className="p-1">
            <h2 className="text-lg font-semibold">Payout Batches</h2>
            <p className="text-xs text-muted-foreground">
              Only admins can approve, reject, or mark a payout as paid.
            </p>
          </div>

          {payouts.length === 0 ? (
            <div
              className="mt-5 flex flex-col items-center justify-center border border-border bg-card/40 py-20"
              style={{ borderRadius: 24 }}
            >
              <div className="text-5xl mb-4"><Calendar/></div>
              <h3 className="text-lg font-semibold text-foreground">
                No payouts yet
              </h3>
              <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Payouts are generated on the monthly payout day once a
                creator&apos;s available balance crosses the minimum threshold.
                You can also generate them now with the button above.
              </p>
            </div>
          ) : (
           <div className="mt-5 overflow-hidden rounded-[24px] border border-border bg-card">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[1100px] text-sm">
      <thead>
        <tr className="border-b border-border bg-card">
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Creator
          </th>
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Amount
          </th>
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Available
          </th>
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Status
          </th>
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Destination
          </th>
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Requested
          </th>
          <th className="h-12 px-5 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Action
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-border">
        {payouts.map((payout) => {
          const isExpanded = expandedId === payout.id;

          return (
            <Fragment key={payout.id}>
              <tr
                onClick={() =>
                  setExpandedId(isExpanded ? null : payout.id)
                }
                className="group cursor-pointer transition-colors duration-150 hover:bg-card/50"
              >
                {/* Creator */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-semibold text-orange-500">
                      {creatorName(payout).charAt(0).toUpperCase()}
                    </div>

                    <div className="flex min-w-0 items-center gap-2">
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}

                      <span className="truncate font-medium text-foreground">
                        {creatorName(payout)}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Amount */}
                <td className="px-5 py-4">
                  <span className="font-semibold text-foreground">
                    TZS {formatTZS(payout.amount)}
                  </span>
                </td>

                {/* Available */}
                <td className="px-5 py-4">
                  <span className="text-muted-foreground">
                    TZS {formatTZS(payout.currentBalance)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                      PAYOUT_STATUS_STYLES[payout.status] ?? ""
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {payout.status.toLowerCase()}
                  </span>
                </td>

                {/* Destination */}
                <td className="px-5 py-4">
                  {payout.paymentMethod ? (
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <PaymentMethodDisplay
                          method={payout.paymentMethod}
                          size="sm"
                        />

                        {payout.paymentPhone && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {payout.paymentPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                {/* Date */}
                <td className="px-5 py-4">
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(payout.requestedAt)}
                  </span>
                </td>

                {/* Actions */}
                <td
                  className="px-5 py-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {payout.status === "PENDING" && (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={loading}
                        onClick={() =>
                          updateStatus(payout.id, "APPROVE")
                        }
                        className="h-8 rounded-lg bg-orange-500 px-3 text-xs font-medium hover:bg-orange-600"
                      >
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => setRejectId(payout.id)}
                        className="h-8 rounded-lg border-destructive/25 px-3 text-xs text-destructive hover:bg-destructive/15 hover:text-destructive"
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {payout.status === "APPROVED" && (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={loading}
                        onClick={() => setMarkPaidId(payout.id)}
                        className="h-8 rounded-lg bg-success text-success-foreground px-3 text-xs font-medium hover:bg-success/90"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Mark paid
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => setRejectId(payout.id)}
                        className="h-8 rounded-lg border-destructive/25 px-3 text-xs text-destructive hover:bg-destructive/15 hover:text-destructive"
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {payout.status === "PAID" && (
                    <div className="flex flex-col items-center justify-end gap-1.5 text-xs text-success">
                      
                     <span className="flex flex-row gap-2"><CheckCircle2 className="h-3.5 w-3.5" />Paid</span> <span>{formatDate(payout.paidAt)}</span>
                    </div>
                  )}

                  {payout.status === "REJECTED" && (
                    <div className="flex max-w-[180px] items-center justify-end gap-1.5 text-right text-xs text-destructive">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {payout.rejectionReason || "Rejected"}
                      </span>
                    </div>
                  )}
                </td>
              </tr>

              {/* Expanded breakdown */}
              {isExpanded && (
                <tr className="bg-card/20">
                  <td colSpan={7} className="px-5 pb-5 pt-5">
                    <div className="rounded-2xl border border-border bg-card/40 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Payout breakdown
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Earnings included in this payout
                          </p>
                        </div>

                        <span className="rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          {payout.earnings.length}{" "}
                          {payout.earnings.length === 1
                            ? "earning"
                            : "earnings"}
                        </span>
                      </div>

                      {payout.earnings.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border py-8 text-center">
                          <p className="text-sm text-muted-foreground">
                            No linked earnings.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-border">
                          {payout.earnings.map((earning, index) => (
                            <div
                              key={earning.id}
                              className={`flex items-center justify-between px-4 py-3 ${
                                index !== payout.earnings.length - 1
                                  ? "border-b border-border"
                                  : ""
                              }`}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                                  <WalletCards className="h-3.5 w-3.5 text-orange-500" />
                                </div>

                                <span className="truncate text-sm text-muted-foreground">
                                  {earning.campaign?.name ||
                                    "Unknown campaign"}
                                </span>
                              </div>

                              <span className="ml-4 whitespace-nowrap text-sm font-medium text-foreground">
                                TZS {formatTZS(earning.creatorAmount)}
                              </span>
                            </div>
                          ))}

                          <div className="flex items-center justify-between bg-muted/60 px-4 py-3">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Total
                            </span>

                            <span className="text-sm font-semibold text-foreground">
                              TZS {formatTZS(payout.amount)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 lg:px-6">
          <p className="text-sm text-destructive bg-destructive/15 border border-destructive/25 rounded-lg px-3 py-2">
            {error}
          </p>
        </div>
      )}

      {/* Mark Paid dialog */}
      <Dialog
        open={markPaidId !== null}
        onOpenChange={(open) => {
          if (!open) setMarkPaidId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payout as Paid</DialogTitle>
            <DialogDescription>
              After paying the creator externally, enter the payment reference
              and confirm. Their earnings will be marked as paid.
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const p = payouts.find((x) => x.id === markPaidId);
            if (!p) return null;
            return (
              <div className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Payout Amount</span>
                <span className="text-lg font-semibold text-foreground">
                  TZS {formatTZS(p.amount)}
                </span>
              </div>
            );
          })()}

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Payment Reference
            </label>
            <Input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. M-PESA transaction ID"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-success text-success-foreground hover:bg-success/90 cursor-pointer"
              disabled={loading || !paymentReference.trim()}
              onClick={() => markPaidId && updateStatus(markPaidId, "PAID")}
            >
              {loading && <Loader2Icon className="animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog
        open={rejectId !== null}
        onOpenChange={(open) => {
          if (!open) setRejectId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payout</DialogTitle>
            <DialogDescription>
              The frozen funds will be returned to the creator&apos;s available
              balance and roll over to the next payout period.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Reason <span className="text-destructive">*</span>
            </label>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid payment details"
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="cursor-pointer"
              disabled={loading || !rejectionReason.trim()}
              onClick={() => rejectId && updateStatus(rejectId, "REJECT")}
            >
              {loading && <Loader2Icon className="animate-spin" />}
              Reject Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
