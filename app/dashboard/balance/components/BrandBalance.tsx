"use client";

import { OverviewHeader } from "./Overviewheader";
import { Card } from "@/components/ui/card";
import type { Prisma } from "@prisma/client";
import { formatTZS } from "@/lib/utils";
import { EARNING_STATUS_STYLES } from "@/lib/status-styles";

type BrandPayment = Prisma.EarningGetPayload<{
  include: {
    creator: true;
    campaign: true;
    submission: true;
    payout: {
      select: { id: true; status: true; paymentReference: true; paidAt: true };
    };
  };
}>;

interface Props {
  payments: BrandPayment[];
}

const PAYABLE = ["APPROVED", "AVAILABLE"];

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BrandBalance({ payments }: Props) {
  const active = payments.filter((x) => x.status !== "REJECTED");
  const totalSpending = active.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = active.filter((x) => PAYABLE.includes(x.status)).length;
  const paidCount = active.filter((x) => x.status === "PAID").length;
  const paidTotal = active
    .filter((x) => x.status === "PAID")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <OverviewHeader title="Campaign Payments" />

      <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-3">
        <Card className="rounded-2xl bg-orange-500 p-4 text-white shadow-xs gap-2">
          <div className="text-xs font-medium">Total Spending</div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(totalSpending)}
          </div>
          <div className="text-[11px] text-white/80">
            Campaign commitments
          </div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Payments Pending
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            {pendingCount}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Approved, awaiting payout
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
            TZS {formatTZS(paidTotal)} settled via payouts
          </div>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <div className="rounded-2xl ">
          <div className="p-1">
            <h2 className="text-lg font-semibold">Creator Payments</h2>
            <p className="text-xs text-muted-foreground">
              Creator earnings are settled by the platform through scheduled
              payouts. Approved content accrues here until then.
            </p>
          </div>

          {payments.length === 0 ? (
            <div
              className="mt-5 flex flex-col items-center justify-center border border-border bg-card py-20"
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
            <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-muted/40 text-xs tracking-wider text-muted-foreground">
        <tr className="border-b border-border">
          <th className="p-3 text-left font-medium">No.</th>
          <th className="p-3 text-left font-medium">Creator</th>
          <th className="p-3 text-left font-medium">Campaign</th>
          <th className="p-3 text-left font-medium">Amount</th>
          <th className="p-3 text-left font-medium">Status</th>
          <th className="p-3 text-left font-medium">Settlement</th>
        </tr>
      </thead>

      <tbody>
        {payments.map((payment, index) => (
          <tr
            key={payment.id}
            className="
              group
              border-b border-border/60
              last:border-b-0
              transition-colors duration-150
              hover:bg-muted/50
            "
          >
            {/* No. */}
            <td className="p-3 text-muted-foreground">
              <div className="flex size-7 items-center justify-center rounded-full border border-border bg-background text-xs font-medium text-muted-foreground">
                {index + 1}
              </div>
            </td>

            {/* Creator */}
            <td className="p-3 font-medium text-foreground">
              {payment.creator?.username || "Unknown"}
            </td>

            {/* Campaign */}
            <td className="p-3 text-muted-foreground">
              {payment.campaign?.name || "—"}
            </td>

            {/* Amount */}
            <td className="p-3 font-medium text-foreground">
              TZS {formatTZS(payment.amount)}
            </td>

            {/* Status */}
            <td className="p-3">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                  EARNING_STATUS_STYLES[payment.status] ?? ""
                }`}
              >
                {payment.status}
              </span>
            </td>

            {/* Settlement */}
            <td className="p-3 text-muted-foreground">
              {payment.payout
                ? payment.payout.paymentReference ||
                  `${payment.payout.status} payout`
                : "—"}

              {payment.status === "PAID" && payment.payout && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({formatDate(payment.payout.paidAt)})
                </span>
              )}
            </td>
          </tr>
        ))}
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