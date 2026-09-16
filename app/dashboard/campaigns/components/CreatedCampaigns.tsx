"use client"

import { CreatedCampaign } from "@/lib/campaigns";

import { BadgeCheck, Megaphone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { TbFileDescription } from "react-icons/tb";

const BADGE_STYLES: Record<string, string> = {
  active: "text-success",
  hot: "text-orange-700",
  new: " text-orange-700",
  featured: "text-orange-700",
};

export default function CreatedCampaigns({
  campaigns,
  limit,
}: {
  campaigns: CreatedCampaign[];
  limit?: number;
}) {
  const router = useRouter();
  const visibleCampaigns =
    limit && campaigns.length > limit ? campaigns.slice(0, limit) : campaigns;
  const hasMore = !!limit && campaigns.length > limit;
  if (campaigns.length === 0) {
    return (
      <section className="px-4 lg:px-6 mt-6 sm:mt-7">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Your Campaigns
        </h2>
        <div className="flex flex-col items-center justify-center gap-3 border border-border p-8 sm:p-12 rounded-3xl bg-card text-center">
          <p className="text-sm text-muted-foreground">
            You haven&apos;t created any campaigns yet.
          </p>
          <button
            onClick={() => router.push("/dashboard/campaigns/new")}
            className="rounded-xl bg-orange-500 text-white px-5 py-2.5 text-sm font-medium hover:bg-orange-600 transition min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{
              borderRadius: 14,
            }}
          >
            + Create your First Campaign
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 lg:px-6 mt-6 sm:mt-7">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Your Campaigns
        </h2>

        <div className="flex items-center gap-2 sm:gap-3">
          {hasMore && (
            <button
              onClick={() => router.push("/dashboard/campaigns")}
              className="rounded-xl border border-border px-3.5 py-2 text-sm text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted transition min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ borderRadius: 14 }}
            >
              View More
            </button>
          )}

          <button
            onClick={() => router.push("/dashboard/campaigns/new")}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-orange-600 transition min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{
              borderRadius: 14,
            }}
          >
            + New Campaign
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm min-w-[580px]">
          <thead className="bg-card">
            <tr className="border-b border-border">
              <th className="p-4 text-left text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Megaphone size={14} />
                  <span>Campaign</span>
                </div>
              </th>

              <th className="p-4 text-left text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <TbFileDescription size={14} />
                  <span>Description</span>
                </div>
              </th>

              <th className="p-4 text-left text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BadgeCheck size={14} />
                  <span>Badge</span>
                </div>
              </th>

              <th className="p-4 text-center text-xs font-medium text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Users size={14} />
                  <span>Applicants</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {visibleCampaigns.map((campaign) => (
              <tr
                key={campaign.id}
                tabIndex={0}
                role="link"
                aria-label={`View campaign ${campaign.name}`}
                onClick={() =>
                  router.push(`/dashboard/campaigns/${campaign.id}`)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/dashboard/campaigns/${campaign.id}`);
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:outline-none"
              >
                {/* Campaign */}
                <td className="p-4 align-middle">
                  <div className="flex min-w-[200px] items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted">
                      <img
                        src={campaign.thumbnailPic}
                        alt={campaign.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-foreground">
                        {campaign.name}
                      </h3>
                    </div>
                  </div>
                </td>

                {/* Description */}
                <td className="p-4 align-middle">
                  <p className="line-clamp-2 max-w-[340px] text-xs leading-5 text-muted-foreground">
                    {campaign.description}
                  </p>
                </td>

                {/* Badge */}
                <td className="p-4 align-middle">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      BADGE_STYLES[campaign.badge] ??
                      "border border-border/40 bg-muted text-muted-foreground"
                    }`}
                  >
                    {campaign.badge}
                  </span>
                </td>

                {/* Applicants */}
                <td className="p-4 text-center align-middle">
                  <span className="inline-flex min-w-8 items-center justify-center rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-foreground tabular-nums">
                    {campaign._count.applications}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
