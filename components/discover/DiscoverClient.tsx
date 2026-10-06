"use client";

import { useState, useMemo, useEffect } from "react";
import type { Campaign, FilterState, Platform } from "@/types";

import DiscoverHero from "@/components/discover/DiscoverHero";
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

type ApiCampaign = {
  id: string;
  name: string;
  category: string | null;
  campaignType: string;
  description: string | null;
  badge: string | null;
  thumbnailColor: string | null;
  thumbnailPic: string | null;
  platforms: string[];
  paymentRate: number | null;
  budgetFunded: number | null;
  budgetTotal: number | null;
  daysLeft: number | null;
  tags: string[];
  requirements: string[];
  applicationsClose: string | null;
  contentFormat: string | null;
  duration: string | null;
  isOpenToAll: boolean | null;
  isFeatured: boolean | null;
  businessProfile: { companyName: string | null; logo: string | null } | null;
  _count?: { applications: number };
};

function toCampaign(c: ApiCampaign): Campaign {
  return {
    id: c.id,
    name: c.name,
    brand: c.businessProfile?.companyName ?? "Unknown",
    brandLogo: c.businessProfile?.logo ?? null,
    category: c.category ?? "",
    campaignType: c.campaignType as Campaign["campaignType"],
    description: c.description ?? "",
    badge: (c.badge ?? "new") as Campaign["badge"],
    thumbnailColor: c.thumbnailColor ?? "#18181b",
    thumbnailPic: c.thumbnailPic ?? "",
    thumbnailInitials: c.name?.slice(0, 2).toUpperCase() ?? "??",
    platforms: c.platforms as Campaign["platforms"],
    paymentRate: c.paymentRate ?? 0,
    budgetFunded: c.budgetFunded ?? 0,
    budgetTotal: c.budgetTotal ?? 0,
    daysLeft: c.daysLeft ?? 0,
    tags: c.tags ?? [],
    requirements: c.requirements ?? [],
    _count: { applications: c._count?.applications ?? 0 },
    creatorsJoined: c._count?.applications ?? 0,
    applicationsClose: c.applicationsClose
      ? new Date(c.applicationsClose).toLocaleDateString()
      : "",
    contentFormat: c.contentFormat ?? "",
    duration: c.duration ?? "",
    isOpenToAll: c.isOpenToAll ?? false,
    isFeatured: c.isFeatured ?? false,
  };
}

export default function DiscoverClient() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 6;

  // 📡 FETCH FROM DATABASE
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/campaigns");
        const data = (await res.json()) as ApiCampaign[];
        const mapped = data.map(toCampaign);

        setAllCampaigns(mapped);
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // 🎯 FEATURED CAMPAIGNS
  const featuredCampaigns = useMemo(() => {
    return allCampaigns
      .filter((c) => c.isFeatured || c.badge === "featured" || c.badge === "hot")
      .slice(0, 4);
  }, [allCampaigns]);

  const handleFilterChange = (partial: Partial<FilterState>) => {
    setVisibleCount(PAGE_SIZE);
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleClear = () => {
    setVisibleCount(PAGE_SIZE);
    setFilters(defaultFilters);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== "All Categories") count++;
    if (filters.socialMedia) count++;
    if (filters.paymentRate !== "All Rates") count++;
    if (filters.campaignType) count++;
    return count;
  }, [filters]);

  // 🔍 FILTER LOGIC
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
      result = result.filter((c) =>
        c.platforms?.includes(filters.socialMedia as Platform)
      );
    }

    if (filters.campaignType) {
      result = result.filter((c) => c.campaignType === filters.campaignType);
    }

    if (filters.paymentRate === "Under TZS 300K") {
      result = result.filter((c) => c.paymentRate < 300000);
    } else if (filters.paymentRate === "TZS 300K – 600K") {
      result = result.filter(
        (c) => c.paymentRate >= 300000 && c.paymentRate <= 600000
      );
    } else if (filters.paymentRate === "TZS 600K+") {
      result = result.filter((c) => c.paymentRate > 600000);
    }

    if (filters.sortBy === "Highest Payout") {
      result.sort((a, b) => b.paymentRate - a.paymentRate);
    } else if (filters.sortBy === "Most Funded") {
      result.sort(
        (a, b) =>
          b.budgetFunded / b.budgetTotal -
          a.budgetFunded / a.budgetTotal
      );
    } else if (filters.sortBy === "Ending Soon") {
      result.sort((a, b) => a.daysLeft - b.daysLeft);
    }

    return result;
  }, [filters, allCampaigns]);

  return (
    <div className="min-h-screen bg-background">
      <DiscoverHero
        featuredCampaigns={featuredCampaigns}
        onJoin={setSelectedCampaign}
      />

      <div className="w-full px-4 py-6 sm:px-6 sm:py-8">
        <FilterToolbar
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClear}
          activeFilterCount={activeFilterCount}
        />

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground font-semibold text-lg">
            {filtered.length === allCampaigns.length
              ? "All Campaigns"
              : `${filtered.length} Campaign${
                  filtered.length !== 1 ? "s" : ""
                } Found`}
          </h2>
        </div>

        <CampaignGrid
          campaigns={filtered.slice(0, visibleCount)}
          onCardClick={setSelectedCampaign}
          isLoading={loading}
        />

        {filtered.length > visibleCount && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="flex items-center gap-2 px-6 py-2.5 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:border-border transition-colors"
              style={{ borderRadius: "9999px" }}
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
