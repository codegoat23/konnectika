"use client";

import Link from "next/link";
import { ApprovedCampaigns } from "@/lib/campaigns";
import CampaignCard from "./components/CampaignCard";
import SocialFolderGrid from "@/components/social/SocialFolder";
import EmptyDashboardState from "@/app/dashboard/components/EmptyDashboardState";
import { BiSolidMegaphone } from "react-icons/bi";

type ActiveCampaignsProps ={ 
  active_campaigns: ApprovedCampaigns[];
}




export default function ActiveCampaigns({active_campaigns}:ActiveCampaignsProps) {
  return (
    <div className="mt-6 lg:mt-8 w-full flex flex-col lg:flex-row justify-between gap-6 px-4 lg:px-6">
      <section className="w-full min-w-0 flex-1 rounded-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Active Campaigns
          </h2>

          <Link
            href="/discover"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-1.5 rounded-xl hover:bg-muted"
          >
            View All
          </Link>
        </div>

        <div>
          {active_campaigns.length === 0 ? (
            <EmptyDashboardState
              title="No campaigns joined"
              description="Campaigns you join will appear here."
              icon={<BiSolidMegaphone aria-hidden="true" className="size-8" />}
              actionHref="/discover"
              actionLabel="Browse campaigns"
            />
          ) : (
            <>
              {/* Mobile: horizontal swipeable row */}
              <div className="lg:hidden overflow-hidden">
                <div
                  className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2
                             [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {active_campaigns.slice(0, 3).map((campaign) => (
                    <div key={campaign.id} className="w-[80%] shrink-0 snap-start">
                      <CampaignCard
                        campaign={campaign}
                        onClick={() => {}}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: grid */}
              <div className="hidden lg:grid grid-cols-3 gap-4">
                {active_campaigns.slice(0, 3).map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onClick={() => {}}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="hidden w-full shrink-0 justify-center md:flex md:w-auto md:justify-start">
        <SocialFolderGrid />
      </section>
    </div>
  );
}
