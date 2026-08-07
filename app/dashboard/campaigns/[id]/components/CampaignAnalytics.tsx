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
      className="bg-card border border-border p-5"
      style={{ borderRadius: 24 }}
    >
      <h3 className="text-foreground font-semibold mb-4">Campaign Analytics</h3>

      <div className="grid gap-4">
        <div
          className="flex justify-between items-center bg-muted/40 p-3 rounded-xl border border-border"
          style={{ borderRadius: 16 }}
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Eye size={16} />
            <span>Total Views</span>
          </div>
          <span className="text-foreground font-semibold">12,450</span>
        </div>

        <div
          className="flex justify-between items-center bg-muted/40 p-3 rounded-xl border border-border"
          style={{ borderRadius: 16 }}
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MousePointerClick size={16} />
            <span>Clicks</span>
          </div>
          <span className="text-foreground font-semibold">3,210</span>
        </div>

        <div
          className="flex justify-between items-center bg-muted/40 p-3 rounded-xl border border-border"
          style={{ borderRadius: 16 }}
        >
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp size={16} />
            <span>Conversion Rate</span>
          </div>
          <span className="text-orange-500 font-semibold">18.4%</span>
        </div>

        {role === "BRAND" && (
          <div
            className="flex justify-between items-center bg-muted/40 p-3 rounded-xl border border-border"
            style={{ borderRadius: 16 }}
          >
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users size={16} />
              <span>Applicants</span>
            </div>
            <span className="text-foreground font-semibold">
              {applicantsCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}