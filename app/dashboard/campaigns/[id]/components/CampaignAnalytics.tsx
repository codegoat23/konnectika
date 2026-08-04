"use client";

import { Eye, MousePointerClick, TrendingUp, Users } from "lucide-react";

export default function CampaignAnalytics({
  role,
  applicantsCount,
}: {
  role: string;
  applicantsCount: number;
}) {
  // NOTE: views/clicks/conversion are placeholder values carried over from
  // the original page — wire these up to real analytics data when available.
  return (
    <div
      className="bg-zinc-900 border border-white/10 p-5"
      style={{ borderRadius: 24 }}
    >
      <h3 className="text-white font-semibold mb-4">Campaign Analytics</h3>

      <div className="grid gap-4">
        <div
          className="flex justify-between items-center bg-zinc-800/40 p-3 rounded-xl border border-white/5"
          style={{ borderRadius: 16 }}
        >
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <Eye size={16} />
            <span>Total Views</span>
          </div>
          <span className="text-white font-semibold">12,450</span>
        </div>

        <div
          className="flex justify-between items-center bg-zinc-800/40 p-3 rounded-xl border border-white/5"
          style={{ borderRadius: 16 }}
        >
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <MousePointerClick size={16} />
            <span>Clicks</span>
          </div>
          <span className="text-white font-semibold">3,210</span>
        </div>

        <div
          className="flex justify-between items-center bg-zinc-800/40 p-3 rounded-xl border border-white/5"
          style={{ borderRadius: 16 }}
        >
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <TrendingUp size={16} />
            <span>Conversion Rate</span>
          </div>
          <span className="text-emerald-400 font-semibold">18.4%</span>
        </div>

        {role === "BRAND" && (
          <div
            className="flex justify-between items-center bg-zinc-800/40 p-3 rounded-xl border border-white/5"
            style={{ borderRadius: 16 }}
          >
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <Users size={16} />
              <span>Applicants</span>
            </div>
            <span className="text-white font-semibold">
              {applicantsCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}