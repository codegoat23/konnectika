"use client"

import { CreatedCampaign } from "@/lib/campaigns";

import { BadgeCheck, Megaphone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { TbFileDescription } from "react-icons/tb";

const BADGE_STYLES: Record<string, string> = {
  active: "bg-green-50 text-green-700 border border-green-200",
  hot: "bg-orange-50 text-orange-700 border border-orange-200",
  new: "bg-orange-50 text-orange-700 border border-orange-200",
  featured: "bg-orange-50 text-orange-700 border border-orange-200",
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
      <section className="px-4 lg:px-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Your Campaigns
        </h2>
        <p className="text-sm text-muted-foreground">
          You haven&apos;t created any campaigns yet.{" "}
          <button
    onClick={() => router.push("/dashboard/campaigns/new")}
      className="rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-medium hover:bg-orange-600 transition"
    style={{
      borderRadius:14
    }}
  >
    + Create your First Campaign
  </button>
        </p>
      </section>
    );
  }

  

  return (
    <section className="px-4 lg:px-6 mt-7">
     <div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-foreground">
    Your Campaigns
  </h2>

  <div className="flex items-center gap-3">
    {hasMore && (
      <button
        onClick={() => router.push("/dashboard/campaigns")}
        className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:border-border hover:text-foreground transition"
        style={{ borderRadius: 14 }}
      >
        View More
      </button>
    )}

    <button
      onClick={() => router.push("/dashboard/campaigns/new")}
    className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-[#EA580C] transition"
      style={{
        borderRadius:14
      }}
    >
      + New Campaign
    </button>
  </div>
</div>

   <div className="overflow-hidden rounded-2xl border border-border bg-card">
  <table className="w-full text-sm">
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
          onClick={() =>
            router.push(`/dashboard/campaigns/${campaign.id}`)
          }
          className="cursor-pointer transition-colors hover:bg-muted/40"
        >
          {/* Campaign */}
          <td className="p-4 align-middle">
            <div className="flex min-w-[220px] items-center gap-3">
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
            <p className="line-clamp-2 max-w-[420px] text-xs leading-5 text-muted-foreground">
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
            <span className="inline-flex min-w-8 items-center justify-center rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-semibold text-foreground">
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
