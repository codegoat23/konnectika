"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { FilterState, Platform } from "@/types";
import { categories, paymentRates, campaignTypes, sortOptions } from "@/lib/data";

import {
  FaInstagram,
  FaTiktok,
  FaFacebook,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";

interface FilterToolbarProps {
  filters: FilterState;
  onChange: (filters: Partial<FilterState>) => void;
  onClear: () => void;
  activeFilterCount: number;
}

const platforms: {
  id: Platform;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "instagram", label: "Instagram", icon: <FaInstagram /> },
  { id: "tiktok", label: "TikTok", icon: <FaTiktok /> },
  { id: "facebook", label: "Facebook", icon: <FaFacebook /> },
  { id: "youtube", label: "YouTube", icon: <FaYoutube /> },
  { id: "x", label: "X", icon: <FaXTwitter /> },
];

export default function FilterToolbar({
  filters,
  onChange,
  onClear,
  activeFilterCount,
}: FilterToolbarProps) {
  return (
    <div className="space-y-4 mb-6">

      {/* TOP ROW */}
      <div className="flex gap-3 items-center">

        {/* SEARCH */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search campaigns, brands or keywords..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full bg-zinc-900 border border-white/10 rounded-full pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {/* FILTER BUTTON */}
        <button className="relative flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-white/10 rounded-full text-sm text-zinc-300 hover:border-white/25 transition-colors shrink-0">
          <SlidersHorizontal size={15} />

          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* SORT */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-zinc-500 text-sm">Sort</span>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value })}
            className="bg-zinc-900 border border-white/10 rounded-full px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50 transition-colors cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECOND ROW (FILTERS) */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* CATEGORY */}
        <select
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="bg-zinc-900 border border-white/10 rounded-full px-3 py-2 text-xs text-zinc-300 outline-none focus:border-red-500/50 transition-colors cursor-pointer"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* SOCIAL ICON FILTERS */}
        <div className="flex items-center gap-1 p-1   rounded-full">
          {platforms.map((p) => {
            const active = filters.socialMedia === p.id;

            return (
              <button
                key={p.id}
                onClick={() =>
                  onChange({
                    socialMedia: active ? "" : p.id,
                  })
                }
                className={`w-9 h-9 flex items-center justify-center rounded-full border border-white/10 transition-all text-sm ${
                  active
                    ? "bg-red-500 text-white scale-105"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
                title={p.label}
              >
                {p.icon}
              </button>
            );
          })}
        </div>

        {/* PAYMENT RATE */}
        <select
          value={filters.paymentRate}
          onChange={(e) => onChange({ paymentRate: e.target.value })}
          className="bg-zinc-900 border border-white/10 rounded-full px-3 py-2 text-xs text-zinc-300 outline-none focus:border-red-500/50 transition-colors cursor-pointer"
        >
          {paymentRates.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* TYPE */}
        <select
          value={filters.campaignType}
          onChange={(e) =>
            onChange({
              campaignType: e.target.value as FilterState["campaignType"],
            })
          }
          className="bg-zinc-900 border border-white/10 rounded-full px-3 py-2 text-xs text-zinc-300 outline-none focus:border-red-500/50 transition-colors cursor-pointer"
        >
          {campaignTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* CLEAR */}
        {activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors ml-2"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}