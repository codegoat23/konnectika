"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { formatTZS } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  PlatformRevenueRecord,
  PlatformRevenueSummary,
} from "@/lib/platform-revenue";

interface Props {
  records: PlatformRevenueRecord[];
  summary: PlatformRevenueSummary;
}

const TYPE_STYLES: Record<string, string> = {
  CREATOR_FEE:
    "bg-orange-50 text-orange-700 border-orange-200 " +
    "dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",

  BRAND_FEE:
    "bg-info/15 text-info border-info/25",
};

const STATUS_STYLES: Record<string, string> = {
  ACCRUED:
    "bg-warning/15 text-warning border-warning/25",

  PAID:
    "bg-success/15 text-success border-success/25",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const selectClass =
  "h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-all focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10";

export default function PlatformRevenueDashboard({ records, summary }: Props) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          (typeFilter === "all" || r.type === typeFilter) &&
          (statusFilter === "all" || r.status === statusFilter)
      ),
    [records, typeFilter, statusFilter]
  );

  const monthly = useMemo(() => {
    const map: Record<string, { label: string; value: number }> = {};
    for (const r of records) {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) {
        map[key] = {
          label: d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          }),
          value: 0,
        };
      }
      map[key].value += r.feeAmount;
    }
    return Object.entries(map)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v);
  }, [records]);

  const sourceLabel = (r: PlatformRevenueRecord) =>
    r.type === "CREATOR_FEE"
      ? r.creator?.displayName ?? r.creator?.username ?? "—"
      : r.business?.companyName ?? "—";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Platform Revenue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fees collected from brands and creators. Each record is immutable.
          </p>
        </div>
        
      </header>

      {/* summary cards */}
      <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl bg-orange-500 p-4 text-white shadow-xs gap-2">
          <div className="text-xs font-medium">Total Revenue</div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(summary.total)}
          </div>
          <div className="text-[11px] text-white/80">
            All fees collected across the platform
          </div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Creator Fees
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums text-foreground">
            TZS {formatTZS(summary.byType.CREATOR_FEE ?? 0)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Deducted from creator earnings
          </div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Brand Fees
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums text-foreground">
            TZS {formatTZS(summary.byType.BRAND_FEE ?? 0)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Charged on campaign budgets
          </div>
        </Card>

        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Collected (PAID)
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums text-foreground">
            TZS {formatTZS(summary.byStatus.PAID ?? 0)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Accrued TZS {formatTZS(summary.byStatus.ACCRUED ?? 0)}
          </div>
        </Card>
      </div>

      {/* monthly chart */}
     {monthly.length > 0 && (
  <div className="px-4 lg:px-6">
    <div className="overflow-hidden rounded-3xl border border-border bg-card p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Revenue by month
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Monthly revenue performance
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthly}
            margin={{
              top: 8,
              right: 8,
              left: 0,
              bottom: 0,
            }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 5"
              stroke="#E7E5E4"
            />

            <XAxis
              dataKey="label"
              tick={{
                fontSize: 11,
                fill: "#a1a1aa",
              }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />

            <YAxis
              tick={{
                fontSize: 11,
                fill: "#a1a1aa",
              }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) =>
                value >= 1000
                  ? `${(value / 1000).toFixed(0)}k`
                  : String(value)
              }
              width={42}
            />

            <Tooltip
              cursor={{
                fill: "#F5F5F4",
              }}
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E7E5E4",
                borderRadius: 14,
                padding: "10px 12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
              labelStyle={{
                color: "#737373",
                fontSize: 11,
                marginBottom: 4,
              }}
              itemStyle={{
                color: "#171717",
                fontSize: 12,
                fontWeight: 600,
              }}
              formatter={(value) => [
                `TZS ${Number(value).toLocaleString()}`,
                "Revenue",
              ]}
            />

            <Bar
              dataKey="value"
              fill="#f97316"
              radius={[7, 7, 2, 2]}
              maxBarSize={42}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}

      {/* history table */}
    <div className="px-4 lg:px-6">
      <div className="flex items-center gap-3 justify-end mb-6">
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger className={selectClass} aria-label="Filter by type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="CREATOR_FEE">Creator fee</SelectItem>
              <SelectItem value="BRAND_FEE">Brand fee</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className={selectClass} aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACCRUED">Accrued</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
  <div className="overflow-hidden rounded-2xl border border-border bg-card">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-card">
          <tr className="border-b border-border">
            <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Type
            </th>
            <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Source
            </th>
            <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Campaign
            </th>
            <th className="px-4 py-3.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Gross
            </th>
            <th className="px-4 py-3.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Fee
            </th>
            <th className="px-4 py-3.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Rate
            </th>
            <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Date
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {filtered.map((r) => (
           <tr
  key={r.id}
  className="group cursor-pointer transition-colors duration-150 hover:bg-muted/30"
>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${TYPE_STYLES[r.type]}`}
                >
                  {r.type.replace("_", " ")}
                </span>
              </td>

              <td className="px-4 py-4">
                <span className="font-medium text-foreground">
                  {sourceLabel(r)}
                </span>
              </td>

              <td className="max-w-[220px] px-4 py-4">
                <span className="block truncate text-muted-foreground">
                  {r.campaign.name}
                </span>
              </td>

              <td className="px-4 py-4 text-right whitespace-nowrap">
                <span className="text-muted-foreground">
                  TZS {formatTZS(r.grossAmount)}
                </span>
              </td>

              <td className="px-4 py-4 text-right whitespace-nowrap">
                <span className="font-medium text-foreground">
                  TZS {formatTZS(r.feeAmount)}
                </span>
              </td>

              <td className="px-4 py-4 text-right whitespace-nowrap">
                <span className="text-muted-foreground">
                  {r.feeRate}%
                </span>
              </td>

              <td className="px-4 py-4">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[r.status]}`}
                >
                  {r.status}
                </span>
              </td>

              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-muted-foreground">
                  {formatDate(r.createdAt)}
                </span>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={8}>
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted/50 text-2xl">
                    💸
                  </div>

                  <p className="font-medium text-foreground">
                    No revenue records found
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    No platform revenue records match the current filter.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>
    </div>
  );
}
