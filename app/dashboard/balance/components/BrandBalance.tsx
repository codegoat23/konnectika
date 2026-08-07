"use client";

import { OverviewHeader } from "./Overviewheader";
import { Card } from "@/components/ui/card";
import type { Prisma } from "@prisma/client";
import { formatTZS } from "@/lib/utils";

type BrandPayment = Prisma.EarningGetPayload<{
  include: {
    creator: true;
    submission: { include: { campaign: true } };
  };
}>;

interface Props {
  payments: BrandPayment[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  AVAILABLE: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  WITHDRAWN: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BrandBalance({ payments }: Props) {
  const totalSpending = payments.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = payments.filter((x) => x.status === "PENDING").length;
  const paidCount = payments.filter((x) => x.status === "WITHDRAWN").length;

  return (
    <div className="space-y-6">
      <OverviewHeader title="Campaign Payments" />

      <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-3">
        <Card className="rounded-2xl bg-orange-500 p-4 text-white shadow-xs gap-2">
          <div className="text-xs font-medium">Total Spending</div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(totalSpending)}
          </div>
          <div className="text-[11px] text-muted-foreground">Campaign commitments</div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Pending Settlement
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            {pendingCount}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Awaiting the settlement period
          </div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Creators Paid
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            {paidCount}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Completed withdrawals
          </div>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-2xl bg-card">
          <div className="p-1">
            <h2 className="text-lg font-semibold">Creator Payments</h2>
          </div>

          {payments.length === 0 ? (
            <div
              className="mt-5 flex flex-col items-center justify-center border border-border bg-card/40 py-20"
              style={{ borderRadius: 24 }}
            >
              <div className="text-5xl mb-4">💸</div>
              <h3 className="text-lg font-semibold text-foreground">
                No creator payments
              </h3>
              <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                Payments to creators will appear here after campaign submissions
                are approved.
              </p>
            </div>
          ) : (
            <div
              className="border border-border overflow-hidden mt-5"
              style={{ borderRadius: 24 }}
            >
              <table className="w-full text-sm">
  <thead className="bg-card text-muted-foreground text-xs tracking-wider">
    <tr>
      <th className="p-3 text-left">No.</th>
      <th className="p-3 text-left">Creator</th>
      <th className="p-3 text-left">Campaign</th>
      <th className="p-3 text-left">Gross Amount</th>
      <th className="p-3 text-left">Status</th>
      <th className="p-3 text-left">Available</th>
    </tr>
  </thead>

  <tbody>
    {payments.map((payment, index) => (
      <tr
        key={payment.id}
        className="group border-t border-border transition-all duration-200 hover:bg-card/60"
      >
        <td className="p-3 text-muted-foreground">
          <div className="flex justify-center items-center gap-2 border border-border rounded-full px-2 py-2 text-xs font-medium text-muted-foreground">
{index + 1}
          </div>
          </td>

        <td className="p-3 text-foreground">
          {payment.creator?.username || "Unknown"}
        </td>

        <td className="p-3 text-muted-foreground">
          {payment.submission?.campaign?.name || "—"}
        </td>

        <td className="p-3 text-muted-foreground">
          TZS {formatTZS(payment.amount)}
        </td>

        <td className="p-3">
          <span
            className={`px-2 py-1 rounded-full text-xs border ${
              STATUS_STYLES[payment.status] ?? ""
            }`}
          >
            {payment.status}
          </span>
        </td>

        <td className="p-3 text-muted-foreground">
          {formatDate(payment.availableAt)}
        </td>
      </tr>
    ))}
  </tbody>
</table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
