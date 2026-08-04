"use client";

import { Fragment, useState } from "react";
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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatTZS } from "@/lib/utils";
import type { AdminWithdrawal } from "@/lib/wallet";
import { Loader2Icon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  PAID: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border border-red-500/20",
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface AdminWithdrawalsProps {
  withdrawals: AdminWithdrawal[];
}

export default function AdminWithdrawals({
  withdrawals,
}: AdminWithdrawalsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [markPaidId, setMarkPaidId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalVolume = withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const pendingCount = withdrawals.filter(
    (w) => w.status === "PENDING" || w.status === "PROCESSING"
  ).length;
  const paidTotal = withdrawals
    .filter((w) => w.status === "PAID")
    .reduce((sum, w) => sum + w.amount, 0);

  const updateStatus = async (
    id: string,
    status: "PROCESSING" | "PAID" | "REJECTED"
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallet/withdrawals/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentReference:
            status === "PAID" ? paymentReference.trim() : undefined,
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
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const creatorName = (w: AdminWithdrawal) =>
    w.creator.displayName || w.creator.username || "Unknown creator";

  return (
    <div className="space-y-6">
      <OverviewHeader title="Withdrawal Requests" />

      <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-3">
        <Card className="rounded-2xl bg-orange-500 p-4 text-white shadow-xs gap-2">
          <div className="text-xs font-medium">Total Requested Volume</div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(totalVolume)}
          </div>
          <div className="text-[11px] text-white/80">All withdrawal requests</div>
        </Card>

        <Card className="rounded-2xl bg-white/10 p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Awaiting Payout
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            {pendingCount}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Pending + processing requests
          </div>
        </Card>

        <Card className="rounded-2xl bg-white/10 p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Total Paid Out
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(paidTotal)}
          </div>
          <div className="text-[11px] text-muted-foreground">Completed payouts</div>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-2xl bg-card">
          <div className="p-1">
            <h2 className="text-lg font-semibold">Creator Withdrawals</h2>
          </div>

          {withdrawals.length === 0 ? (
            <div
              className="mt-5 flex flex-col items-center justify-center border border-white/10 bg-zinc-900/40 py-20"
              style={{ borderRadius: 24 }}
            >
              <div className="text-4xl mb-4">🏦</div>
              <h3 className="text-lg font-semibold text-white">
                No withdrawal requests
              </h3>
              <p className="mt-2 max-w-sm text-center text-sm text-zinc-400">
                Withdrawal requests from creators will appear here once their
                earnings become available.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <div
                className="border border-white/10 overflow-hidden"
                style={{ borderRadius: 24 }}
              >
                <table className="w-full text-sm">
                  <thead className="bg-zinc-900 text-zinc-400 text-xs tracking-wider">
                    <tr>
                      <th className="p-3 text-left">Creator</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Method</th>
                      <th className="p-3 text-left">Requested</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => {
                      const isExpanded = expandedId === withdrawal.id;
                      return (
                        <Fragment key={withdrawal.id}>
                          <tr
                            key={`${withdrawal.id}-row`}
                            className="group border-t border-white/5 transition-all duration-200 hover:bg-zinc-900/60 cursor-pointer"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : withdrawal.id)
                            }
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                {isExpanded ? (
                                  <ChevronDownIcon className="size-3.5 text-zinc-500" />
                                ) : (
                                  <ChevronRightIcon className="size-3.5 text-zinc-500" />
                                )}
                                <span className="text-white">
                                  {creatorName(withdrawal)}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-white font-medium">
                              TZS {formatTZS(withdrawal.amount)}
                            </td>
                            <td className="p-3 text-zinc-400">
                              {withdrawal.paymentMethod || "—"}
                            </td>
                            <td className="p-3 text-zinc-400">
                              {formatDate(withdrawal.requestedAt)}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs border ${
                                  STATUS_STYLES[withdrawal.status] ?? ""
                                }`}
                              >
                                {withdrawal.status}
                              </span>
                            </td>
                            <td
                              className="p-3 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {withdrawal.status === "PENDING" && (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-blue-500 hover:bg-blue-600 cursor-pointer"
                                    disabled={loading}
                                    onClick={() => updateStatus(withdrawal.id, "PROCESSING")}
                                  >
                                    Process
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
                                    disabled={loading}
                                    onClick={() => setRejectId(withdrawal.id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {withdrawal.status === "PROCESSING" && (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
                                    disabled={loading}
                                    onClick={() => setMarkPaidId(withdrawal.id)}
                                  >
                                    Mark Paid
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
                                    disabled={loading}
                                    onClick={() => setRejectId(withdrawal.id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {(withdrawal.status === "PAID" ||
                                withdrawal.status === "REJECTED") && (
                                <span className="text-xs text-zinc-500">
                                  {withdrawal.status === "PAID"
                                    ? `Paid ${formatDate(withdrawal.paidAt)}`
                                    : "Rejected"}
                                </span>
                              )}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr key={`${withdrawal.id}-breakdown`} className="border-t border-white/5 bg-zinc-950/60">                              <td colSpan={6} className="p-3">
                                <div className="rounded-[14] border border-white/10 bg-zinc-900/40 p-3">
                                  <p className="mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                    Payout Breakdown
                                  </p>
                                  <div className="space-y-1.5">
                                    {withdrawal.earnings.length === 0 ? (
                                      <p className="text-sm text-zinc-500">
                                        No linked earnings.
                                      </p>
                                    ) : (
                                      withdrawal.earnings.map((earning) => (
                                        <div
                                          key={earning.id}
                                          className="flex items-center justify-between text-sm"
                                        >
                                          <span className="text-zinc-300">
                                            {earning.submission?.campaign?.name ||
                                              "Unknown campaign"}
                                          </span>
                                          <span className="text-white font-medium">
                                            TZS {formatTZS(earning.creatorAmount)}
                                          </span>
                                        </div>
                                      ))
                                    )}
                                    <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm">
                                      <span className="text-zinc-400">Total</span>
                                      <span className="text-white font-semibold">
                                        TZS {formatTZS(withdrawal.amount)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>                      );
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
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
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
            <DialogTitle>Mark Withdrawal as Paid</DialogTitle>
            <DialogDescription>
              After paying the creator externally, enter the payment reference
              and confirm. Their earnings will be marked as withdrawn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Payment Reference</label>
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
              className="bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
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
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              The requested funds will be returned to the creator&apos;s
              available balance. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="cursor-pointer"
              disabled={loading}
              onClick={() => rejectId && updateStatus(rejectId, "REJECTED")}
            >
              {loading && <Loader2Icon className="animate-spin" />}
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
