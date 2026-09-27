// app/dashboard/payments/page.tsx
//
// Admin-only "Payments" dashboard:
//   - Configure Konnectika's receiving accounts (mobile money + bank) that
//     brands see when paying their campaign fee.
//   - Verify / reject brand-submitted payment proofs.
//
// BRAND and CREATOR are redirected to the main dashboard.

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/getSessionUser";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";
import AdminPayments from "./components/AdminPayments";

export default async function PaymentsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <AdminPayments />
    </DashboardShell>
  );
}