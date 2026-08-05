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
import type {
  PlatformRevenueRecord,
  PlatformRevenueSummary,
} from "@/lib/platform-revenue";

interface Props {
  records: PlatformRevenueRecord[];
  summary: PlatformRevenueSummary;
}

const TYPE_STYLES: Record<string, string> = {
  CREATOR_FEE: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  BRAND_FEE: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  ACCRUED: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  PAID: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const selectClass =
  "h-11 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none transition-all focus:border-white/10 focus:ring-4 focus:ring-violet-500/10";

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
          <h1 className="text-2xl font-semibold text-white">Platform Revenue</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Fees collected from brands and creators. Each record is immutable.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            <option value="CREATOR_FEE">Creator fee</option>
            <option value="BRAND_FEE">Brand fee</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClass}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="ACCRUED">Accrued</option>
            <option value="PAID">Paid</option>
          </select>
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

        <Card className="rounded-2xl bg-white/10 p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Creator Fees
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(summary.byType.CREATOR_FEE ?? 0)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Deducted from creator earnings
          </div>
        </Card>

        <Card className="rounded-2xl bg-white/10 p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Brand Fees
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            TZS {formatTZS(summary.byType.BRAND_FEE ?? 0)}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Charged on campaign budgets
          </div>
        </Card>

        <Card className="rounded-2xl bg-white/10 p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Collected (PAID)
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
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
          <div
            className="border border-white/10 bg-zinc-900/40 p-5"
            style={{ borderRadius: 24 }}
          >
            <h3 className="text-lg font-semibold text-white">
              Revenue by month
            </h3>
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="4 4"
                    stroke="#ffffff1f"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#a1a1aa" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#a1a1aa" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                    width={44}
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff0a" }}
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid #27272a",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                    formatter={(value) => [
                      `TZS ${Number(value).toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Bar
                    dataKey="value"
                    fill="#f97316"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* history table */}
      <div className="px-4 lg:px-6">
        <div
          className="border border-white/10 overflow-hidden"
          style={{ borderRadius: 24 }}
        >
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-xs tracking-wider">
              <tr>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Source</th>
                <th className="p-3 text-left">Campaign</th>
                <th className="p-3 text-left">Gross</th>
                <th className="p-3 text-left">Fee</th>
                <th className="p-3 text-left">Rate</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="group border-t border-white/5 transition-all duration-200 hover:bg-zinc-900/60"
                >
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs border ${TYPE_STYLES[r.type]}`}
                    >
                      {r.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-white">{sourceLabel(r)}</td>
                  <td className="p-3 text-zinc-400">{r.campaign.name}</td>
                  <td className="p-3 text-zinc-400">
                    TZS {formatTZS(r.grossAmount)}
                  </td>
                  <td className="p-3 font-medium text-white">
                    TZS {formatTZS(r.feeAmount)}
                  </td>
                  <td className="p-3 text-zinc-400">{r.feeRate}%</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs border ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-500">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="text-4xl mb-4">💸</div>
                    <p className="text-sm text-zinc-400">
                      No platform revenue records match this filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
