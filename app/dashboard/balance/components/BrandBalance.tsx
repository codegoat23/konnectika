"use client";

import { OverviewHeader } from "./Overviewheader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Prisma } from "@prisma/client";
import { formatTZS } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import {
  Check,
  CheckCheck,
  Clock3,
  CircleDollarSign,
  X,
} from "lucide-react";


import { EARNING_STATUS_STYLES, EARNING_STATUS_ICONS } from "@/lib/status-styles";

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
  const [selectedMetric, setSelectedMetric] = useState<{
    title: string;
    amount: string;
    description: string;
    icon: ReactNode;
  } | null>(null);

  const active = payments.filter((x) => x.status !== "REJECTED");
  const totalSpending = active.reduce((sum, item) => sum + item.amount, 0);
  const pendingCount = active.filter((x) => PAYABLE.includes(x.status)).length;
  const paidCount = active.filter((x) => x.status === "PAID").length;
  const paidTotal = active
    .filter((x) => x.status === "PAID")
    .reduce((sum, item) => sum + item.amount, 0);
  const mobileMetrics = [
    { title: "Payments Pending", amount: String(pendingCount), description: "Approved creator payments awaiting payout.", icon: <Clock3 className="size-5" /> },
    { title: "Creators Paid", amount: String(paidCount), description: "Creators with completed payouts.", icon: <CheckCheck className="size-5" /> },
    { title: "Amount Settled", amount: `TZS ${formatTZS(paidTotal)}`, description: "Total paid to creators through payouts.", icon: <CircleDollarSign className="size-5" /> },
  ];

  return (
    <div className="space-y-6">
      <OverviewHeader title="Campaign Payments" />

      <div className="px-4 md:hidden">
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-zinc-900 p-5 text-white shadow-lg gap-4">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border border-white/5" />
          <div className="relative">
            <p className="text-xs font-medium text-white/65">Total Spending</p>
            <p className="mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums">TZS {formatTZS(totalSpending)}</p>
            <p className="mt-2 text-xs text-white/65">Campaign commitments</p>
          </div>
          <div className="relative grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
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

      <div className="hidden grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-3 md:grid">
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
  className={`inline-flex items-center gap-1.5 rounded-full  px-2.5 py-1 text-xs font-medium ${
    EARNING_STATUS_STYLES[payment.status] ?? ""
  }`}
>
  {(() => {
    const Icon = EARNING_STATUS_ICONS[payment.status];
    return Icon ? <Icon className="h-3.5 w-3.5" /> : null;
  })()}

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
