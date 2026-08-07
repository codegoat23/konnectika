"use client"

import { AllCampaign } from "@/lib/campaigns";
import { useRouter } from "next/navigation";

const BADGE_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  hot: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  new: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  featured: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
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
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="border border-border rounded-[24] p-4 flex justify-between items-start bg-card/60"
            onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
          >
            <div>
              <h3 className="font-medium text-foreground text-sm">
                {campaign.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {campaign.description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {campaign.businessProfile.companyName ?? "Unknown brand"} ·
                Budget ${campaign.budgetFunded}/{campaign.budgetTotal} ·{" "}
                {campaign.category}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap border ${
                  campaign.paymentStatus === "PAID"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {campaign.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
              </span>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                  BADGE_STYLES[campaign.badge] ??
                  "bg-zinc-500/10 text-muted-foreground border border-border/20"
                }`}
              >
                {campaign.badge}
              </span>
              <span className="text-xs text-muted-foreground">
                {campaign._count.applications} application
                {campaign._count.applications === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
