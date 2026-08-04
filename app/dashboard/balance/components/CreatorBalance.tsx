"use client";

import { StatsCards, StatCardData } from "./StatsCards";
import { Badge } from "@/components/ui/badge";
import type { Prisma } from "@prisma/client";
import { LucideBadgeDollarSign } from "lucide-react";

type CreatorEarning = Prisma.EarningGetPayload<{
  include: {
    submission: { include: { campaign: true } };
  };
}>;

interface CreatorBalanceProps {
  earnings: CreatorEarning[];
}

export default function CreatorBalance({
  earnings,
}: CreatorBalanceProps) {

  const total = earnings.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const pending = earnings
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + e.amount, 0);

  const approved = earnings
    .filter((e) => e.status === "APPROVED")
    .reduce((sum, e) => sum + e.amount, 0);

  const paid = earnings
    .filter((e) => e.status === "PAID")
    .reduce((sum, e) => sum + e.amount, 0);



  const stats: StatCardData[] = [
    {
      label: "Total Earnings",
      value: `$${total}`,
      accent: "orange",
      highlight: true,
      delta: "+12%",
      trend: "up",
      footerSubtitle: "all earnings",
    },

    {
      label: "Pending",
      value: `$${pending}`,
      accent: "blue",
      footerSubtitle: "awaiting review",
      delta: `${earnings.filter(e => e.status === "PENDING").length}`,
      trend: "up",
    },

    {
      label: "Approved",
      value: `$${approved}`,
      accent: "violet",
      footerSubtitle: "ready for payment",
      delta: `${earnings.filter(e => e.status === "APPROVED").length}`,
      trend: "up",
    },

    {
      label: "Paid",
      value: `$${paid}`,
      accent: "green",
      footerSubtitle: "completed",
      delta: `${earnings.filter(e => e.status === "PAID").length}`,
      trend: "up",
    },
  ];


  return (
    <div className="space-y-6">


      <StatsCards stats={stats} />


      <div className="px-4 lg:px-6 mt-6">

        <div className="rounded-2xl bg-card">

          <div className="p-1">
            <h2 className="text-lg font-semibold">
              Earnings History
            </h2>
          </div>


         {earnings.length === 0 ? (
  <div
    className="mt-5 flex flex-col items-center justify-center border border-white/10 bg-zinc-900/40 py-20"
    style={{ borderRadius: 24 }}
  >
    <div className="text-5xl mb-4"><LucideBadgeDollarSign /></div>

    <h3 className="text-lg font-semibold text-white">
      No earnings yet
    </h3>

    <p className="mt-2 max-w-sm text-center text-sm text-zinc-400">
      Your earnings will appear here after your campaign submissions
      have been approved by brands.
    </p>
  </div>
) : (
  <div
    className="border border-white/10 overflow-hidden mt-5"
    style={{ borderRadius: 24 }}
  >
    <table className="w-full text-sm">
      <thead className="bg-zinc-900 text-zinc-400 text-xs tracking-wider">
        <tr>
          <th className="p-3 text-left">Campaign</th>
          <th className="p-3 text-left">Amount</th>
          <th className="p-3 text-left">Status</th>
        </tr>
      </thead>

      <tbody>
        {earnings.map((earning) => (
          <tr
            key={earning.id}
            className="
              group
              border-t
              border-white/5
              transition-all
              duration-200
              hover:bg-zinc-900/60
              hover:shadow-lg
              hover:scale-[1.01]
            "
          >
            <td className="p-3 text-white">
              {earning.submission?.campaign?.name || "Unknown"}
            </td>

            <td className="p-3 text-white font-medium">
              ${earning.amount}
            </td>

            <td className="p-3">
              <span
                className={`
                  px-2
                  py-1
                  rounded-full
                  text-xs
                  border
                  ${
                    earning.status === "PAID"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : earning.status === "APPROVED"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }
                `}
              >
                {earning.status}
              </span>
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