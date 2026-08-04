"use client";

import { useState, useMemo } from "react";
import type { Campaign, FilterState } from "@/types";
import { campaigns as allCampaigns, statsOverview } from "@/lib/data";
import DiscoverHero from "@/components/discover/DiscoverHero";
import StatsBar from "@/components/discover/StatsBar";
import FilterToolbar from "@/components/discover/FilterToolbar";
import CampaignGrid from "@/components/discover/CampaignGrid";
import CampaignModal from "@/components/discover/CampaignModal";

const defaultFilters: FilterState = {
  search: "",
  category: "All Categories",
  socialMedia: "",
  budgetMin: 0,
  budgetMax: 10000000000,
  paymentRate: "All Rates",
  campaignType: "",
  badge: "",
  sortBy: "Newest",
};

export default function DiscoverClient() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Top featured campaigns shown in the hero carousel
  const featuredCampaigns = useMemo(
    () =>
      allCampaigns
        .filter((c) => c.isFeatured || c.badge === "featured" || c.badge === "hot")
        .slice(0, 4),
    []
  );

  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleClear = () => setFilters(defaultFilters);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== "All Categories") count++;
    if (filters.socialMedia) count++;
    if (filters.paymentRate !== "All Rates") count++;
    if (filters.campaignType) count++;
    return count;
  }, [filters]);

  const filtered = useMemo(() => {
    let result = [...allCampaigns];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.brand.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    if (filters.category && filters.category !== "All Categories") {
      result = result.filter((c) => c.category === filters.category);
    }

    if (filters.socialMedia) {
      result = result.filter((c) => c.platforms.includes(filters.socialMedia as any));
    }

    if (filters.campaignType && filters.campaignType !== "All Types") {
      result = result.filter((c) => c.campaignType === filters.campaignType);
    }

    if (filters.paymentRate === "Under TZS 300K") {
      result = result.filter((c) => c.paymentRate < 300000);
    } else if (filters.paymentRate === "TZS 300K – 600K") {
      result = result.filter((c) => c.paymentRate >= 300000 && c.paymentRate <= 600000);
    } else if (filters.paymentRate === "TZS 600K+") {
      result = result.filter((c) => c.paymentRate > 600000);
    }

    if (filters.sortBy === "Highest Payout") {
      result.sort((a, b) => b.paymentRate - a.paymentRate);
    } else if (filters.sortBy === "Most Funded") {
      result.sort((a, b) => b.budgetFunded / b.budgetTotal - a.budgetFunded / a.budgetTotal);
    } else if (filters.sortBy === "Ending Soon") {
      result.sort((a, b) => a.daysLeft - b.daysLeft);
    }

    return result;
  }, [filters]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div>
     <DiscoverHero
          featuredCampaigns={featuredCampaigns}
          onJoin={setSelectedCampaign}
        />
      </div>
      <div className="w-full  px-6 py-8">
       
        

        <FilterToolbar
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClear}
          activeFilterCount={activeFilterCount}
        />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">
            {filtered.length === allCampaigns.length
              ? "All Campaigns"
              : `${filtered.length} Campaign${filtered.length !== 1 ? "s" : ""} Found`}
          </h2>
        </div>

        <CampaignGrid campaigns={filtered} onCardClick={setSelectedCampaign} />

        {filtered.length >= 6 && (
          <div className="flex justify-center mt-8">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 border border-white/8 rounded-xl text-sm text-zinc-300 hover:border-white/20 transition-colors"
            style={{
              borderRadius: "9999px"
            }}
            >
              Load more campaigns
            </button>
          </div>
        )}
      </div>

      <CampaignModal
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
      />
    </div>
  );
}
