"use client";

import Link from "next/link";
import { ApprovedCampaigns } from "@/lib/campaigns";
import CampaignCard from "./components/CampaignCard";
import SocialFolderGrid from "@/components/social/SocialFolder";

type ActiveCampaignsProps ={ 
  active_campaigns: ApprovedCampaigns[];
}




export default function ActiveCampaigns({active_campaigns}:ActiveCampaignsProps) {
   
 
  return (
    <div className="mt-8 w-full flex flex-row justify-between px-6">
    <section className="mt-8 w-[70%]  rounded-2xl  flex flex-col gap-4" 
    style={{ borderRadius: "24px" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Active Campaigns
        </h2>

        <Link
          href="/discover"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors border p-2  " 
          style={{ borderRadius: "12px" }}
        >
          View All
        </Link>
      </div>

      <div>
        {active_campaigns.length === 0 ? 
        <div className="flex flex-col justify-center items-center gap-3 border border-border p-18 rounded-[24] bg-card">
          <span className="text-sm font-normal">You haven&apos;t applied to any campaigns yet</span>
            <a
    href="/discover"
    target="_blank"
    rel="noopener noreferrer"
    className="px-5 py-2 rounded-xl text-sm bg-primary text-primary-foreground font-medium hover:bg-orange-600 transition flex items-center gap-2"
    style={{
      borderRadius:10
    }}
  >
    Browse campaigns
  </a>
        </div>
        
        : 
        
        <div  className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-7">
         {active_campaigns.slice(0, 3).map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onClick={() => {}}
          />
        ))}
        </div>
        }
        
       
      </div>
    </section>
    <section className="mt-8 w-[25%]">
      <div className="flex items-center justify-between mb-4">
       <SocialFolderGrid />
        </div>
    </section>    
    </div>
  );
}