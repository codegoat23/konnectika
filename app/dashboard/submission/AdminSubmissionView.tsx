"use client";

// app/dashboard/submission/AdminSubmissionView.tsx
//
// Admin's view of /dashboard/submission:
// - Every submission across the entire platform, regardless of brand
// - Shows campaign + the brand (company) that owns it + the creator
// - Read-mostly: admins can see everything, status filter included.
//   (If you want admins to override brand decisions too, the PATCH
//   route already allows it — just reuse the review() pattern from
//   BrandSubmissionView here.)

import { useEffect, useMemo, useState } from "react";

type Submission = {
  id: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
  screenshots: string[];
  postLinks: string[];
  caption: string | null;
  createdAt: string;
  creator: { id: string; displayName: string | null; username: string | null };
  campaign: { id: string; name: string; businessProfile?: { companyName: string | null } };
};

const STATUS_STYLES: Record<Submission["status"], string> = {
  SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CHANGES_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminSubmissionView() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/submissions");
        if (!res.ok) throw new Error("Couldn't load submissions");
        const data = await res.json();
        setSubmissions(data.submissions ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, statusFilter]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All submissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every submission across all brands and campaigns.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="APPROVED">Approved</option>
          <option value="CHANGES_REQUESTED">Changes requested</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Creator</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Campaign</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Brand</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Proof</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-gray-500">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-gray-900">
                  {s.creator.displayName ?? s.creator.username ?? "Unnamed"}
                </td>
                <td className="px-4 py-3 text-gray-700">{s.campaign.name}</td>
                <td className="px-4 py-3 text-gray-700">
                  {s.campaign.businessProfile?.companyName ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {s.screenshots.length} img · {s.postLinks.length} link
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status]}`}
                  >
                    {s.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No submissions match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-64 w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}
