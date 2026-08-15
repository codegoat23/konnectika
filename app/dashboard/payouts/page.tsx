// app/dashboard/payouts/page.tsx
//
// Payout management, one URL for both roles:
//   - ADMIN: approves / rejects / pays creator payouts. The admin first
//     approves each creator's earning per campaign (APPROVED -> AVAILABLE);
//     once a creator's AVAILABLE balance crosses the minimum payout threshold
//     a Payout batch is created and handled here. Settings (minimum amount +
//     payout day) are editable in the same view.
//   - CREATOR: requests a payout for their AVAILABLE balance and tracks their
//     payout history.
//   - BRAND: no payout access -> redirected to the dashboard.

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/getSessionUser";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import {
  getAdminPayouts,
  getPlatformPayoutSettings,
  getCreatorPayoutSummary,
} from "@/lib/payout";
import AdminPayouts from "./components/AdminPayouts";
import CreatorPayouts from "./components/CreatorPayouts";

export default async function PayoutsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    const [payouts, settings] = await Promise.all([
      getAdminPayouts(),
      getPlatformPayoutSettings(),
    ]);

    return (
      <DashboardShell>
        <AdminPayouts payouts={payouts} settings={settings} />
      </DashboardShell>
    );
  }

  if (user.role === "CREATOR") {
    const payoutSummary = user.creatorProfileId
      ? await getCreatorPayoutSummary(user.creatorProfileId)
      : null;

    return (
      <DashboardShell>
        {payoutSummary && (
          <CreatorPayouts
            settings={payoutSummary.settings}
            eligibility={payoutSummary.eligibility}
            payouts={payoutSummary.payouts}
          />
        )}
      </DashboardShell>
    );
  }

  redirect("/dashboard");
}
