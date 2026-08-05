// app/dashboard/revenue/page.tsx
//
// Platform revenue ledger — ADMIN only. Summarises every fee collected by
// the platform (CREATOR_FEE + BRAND_FEE) and lists the immutable records.

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import {
  getPlatformRevenue,
  getPlatformRevenueSummary,
} from "@/lib/platform-revenue";
import PlatformRevenueDashboard from "./components/PlatformRevenueDashboard";

export default async function RevenuePage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/403");
  }

  const [records, summary] = await Promise.all([
    getPlatformRevenue({ limit: 500 }),
    getPlatformRevenueSummary(),
  ]);

  return (
    <DashboardShell>
      <PlatformRevenueDashboard records={records} summary={summary} />
    </DashboardShell>
  );
}
