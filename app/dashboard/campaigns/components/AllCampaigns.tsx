"use client"

import { AllCampaign } from "@/lib/campaigns";
import { useRouter } from "next/navigation";

const BADGE_STYLES: Record<string, string> = {
  active:
    "bg-emerald-50 text-emerald-700 border-emerald-200 " +
    "dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",

  hot:
    "bg-orange-50 text-orange-700 border-orange-200 " +
    "dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",

  new:
    "bg-blue-50 text-blue-700 border-blue-200 " +
    "dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",

  featured:
    "bg-violet-50 text-violet-700 border-violet-200 " +
    "dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20",
};

export default function AllCampaigns({
  campaigns,
}: {
  campaigns: AllCampaign[];
}) {
   const router = useRouter()
  if (campaigns.length === 0) {
    return (
      <section className="px-4 lg:px-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          All Campaigns
        </h2>
        <p className="text-sm text-muted-foreground">
          No campaigns exist in the system yet.
        </p>
      </section>
    );
  }

  return (
    <section className="px-4 lg:px-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        All Campaigns ({campaigns.length})
      </h2>

     <div className="space-y-3">
 <div className="overflow-hidden rounded-2xl border border-border bg-card">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[900px] text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/30">
          <th className="px-5 py-3.5 text-left text-xs font-medium tracking-wide text-muted-foreground">
            Campaign
          </th>

          <th className="px-5 py-3.5 text-left text-xs font-medium tracking-wide text-muted-foreground">
            Brand
          </th>

          <th className="px-5 py-3.5 text-left text-xs font-medium tracking-wide text-muted-foreground">
            Budget
          </th>

          <th className="px-5 py-3.5 text-left text-xs font-medium tracking-wide text-muted-foreground">
            Category
          </th>

          <th className="px-5 py-3.5 text-center text-xs font-medium tracking-wide text-muted-foreground">
            Applications
          </th>

          <th className="px-5 py-3.5 text-right text-xs font-medium tracking-wide text-muted-foreground">
            Payment
          </th>

          
        </tr>
      </thead>

      <tbody className="divide-y divide-border">
        {campaigns.map((campaign) => {
          const isPaid = campaign.paymentStatus === "PAID";

          return (
            <tr
              key={campaign.id}
              onClick={() =>
                router.push(`/dashboard/campaigns/${campaign.id}`)
              }
              className="group cursor-pointer transition-colors hover:bg-muted/30"
            >
              {/* Campaign */}
              <td className="px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="max-w-[260px] truncate font-medium text-foreground">
                        {campaign.name}
                      </p>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          BADGE_STYLES[campaign.badge] ??
                          "border-border bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {campaign.badge}
                      </span>
                    </div>

                    <p className="mt-1 max-w-[300px] truncate text-xs text-muted-foreground">
                      {campaign.description}
                    </p>
                  </div>
                </div>
              </td>

              {/* Brand */}
              <td className="px-5 py-4">
                <span className="font-medium text-foreground/85">
                  {campaign.businessProfile.companyName ?? "Unknown brand"}
                </span>
              </td>

              {/* Budget */}
              <td className="px-5 py-4">
                <div className="whitespace-nowrap">
                  <span className="font-medium text-foreground">
                    ${campaign.budgetFunded}
                  </span>

                  <span className="text-muted-foreground">
                    {" "}
                    / ${campaign.budgetTotal}
                  </span>
                </div>
              </td>

              {/* Category */}
              <td className="px-5 py-4">
                <span className="text-muted-foreground">
                  {campaign.category}
                </span>
              </td>

              {/* Applications */}
              <td className="px-5 py-4 text-center">
                <span className="font-medium text-foreground">
                  {campaign._count.applications}
                </span>

              
              </td>

              {/* Payment */}
              <td className="px-5 py-4 text-right">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    isPaid
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      isPaid
                        ? "bg-emerald-500 dark:bg-emerald-400"
                        : "bg-amber-500 dark:bg-amber-400"
                    }`}
                  />

                  {isPaid ? "Paid" : "Unpaid"}
                </span>
              </td>

         
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
</div>
    </section>
  );
}
