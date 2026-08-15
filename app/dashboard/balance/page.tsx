// app/dashboard/balance/page.tsx

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

import DashboardShell from "@/app/dashboard/components/dashboard-shell";

import CreatorWallet from "./components/CreatorWallet";
import BrandBalance from "./components/BrandBalance";

import { getBrandBalance } from "@/lib/balance";
import { getCreatorWallet } from "@/lib/wallet";
import { prisma } from "@/lib/prisma";

export default async function BalancePage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  switch (user.role) {
    case "CREATOR": {
      const creator = await prisma.creatorProfile.findUnique({
        where: { userId: user.userId },
        select: { id: true },
      });

      const wallet = creator
        ? await getCreatorWallet(creator.id)
        : {
            available: 0,
            pending: 0,
            approved: 0,
            processing: 0,
            paid: 0,
            lifetime: 0,
            earnings: [],
          };

      return (
        <DashboardShell>
          <CreatorWallet wallet={wallet} />
        </DashboardShell>
      );
    }

    case "BRAND": {
      const payments = await getBrandBalance(user.userId);

      return (
        <DashboardShell>
          <BrandBalance payments={payments} />
        </DashboardShell>
      );
    }

    case "ADMIN": {
      // Admins manage creator settlements in the payout dashboard.
      redirect("/dashboard/payouts");
    }

    default:
      redirect("/dashboard");
  }
}