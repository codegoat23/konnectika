"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye, ImageIcon, Link2, X } from "lucide-react";

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
  SUBMITTED: "bg-orange-50 text-orange-700 border border-orange-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border border-green-200",
  CHANGES_REQUESTED: "bg-orange-50 text-orange-700 border border-orange-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
};

export default function AdminSubmissionView() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Submission | null>(null);

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
          <h1 className="text-2xl font-semibold text-foreground">All submissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every submission across all brands and campaigns.
          </p>
        </div>
        <div className="relative">
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="h-10 min-w-[170px] appearance-none rounded-xl border border-border bg-card px-3.5 pr-9 text-sm font-medium text-foreground outline-none transition-all hover:border-orange-500/30 focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/10"
  >
    <option value="all">All statuses</option>
    <option value="SUBMITTED">Submitted</option>
    <option value="UNDER_REVIEW">Under review</option>
    <option value="APPROVED">Approved</option>
    <option value="CHANGES_REQUESTED">Changes requested</option>
    <option value="REJECTED">Rejected</option>
  </select>

  <ChevronDown
    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
    strokeWidth={1.8}
  />
</div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

     <div className="overflow-hidden rounded-[24px] border border-border bg-card">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[900px] text-sm">
      <thead>
        <tr className="border-b border-border bg-[#FAFAF9]">
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Creator
          </th>
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Campaign
          </th>
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Brand
          </th>
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Proof
          </th>
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Status
          </th>
          <th className="h-12 px-5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Submitted
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-border">
        {filtered.map((s) => {
          const creatorName =
            s.creator.displayName ?? s.creator.username ?? "Unnamed";

          return (
            <tr
              key={s.id}
              onClick={() => setSelected(s)}
              className="group cursor-pointer transition-colors duration-150 hover:bg-[#FAFAF9]"
            >
              {/* Creator */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-xs font-semibold text-orange-500">
                    {creatorName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {creatorName}
                    </p>

                    {s.creator.username && (
                      <p className="truncate text-xs text-muted-foreground">
                        @{s.creator.username}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              {/* Campaign */}
              <td className="px-5 py-4">
                <p className="max-w-[220px] truncate font-medium text-foreground">
                  {s.campaign.name}
                </p>
              </td>

              {/* Brand */}
              <td className="px-5 py-4">
                <span className="text-muted-foreground">
                  {s.campaign.businessProfile?.companyName ?? "—"}
                </span>
              </td>

              {/* Proof */}
            <td className="px-5 py-4">
  <div className="flex items-center gap-3">
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <ImageIcon className="h-3.5 w-3.5" />
      {s.screenshots.length}
    </span>

    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link2 className="h-3.5 w-3.5" />
      {s.postLinks.length}
    </span>

    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 transition-colors group-hover:text-orange-600">
      <Eye className="h-3.5 w-3.5" />
      
    </span>
  </div>
</td>

              {/* Status */}
              <td className="px-5 py-4">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${
                    STATUS_STYLES[s.status]
                  }`}
                >
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                  {s.status.replace("_", " ").toLowerCase()}
                </span>
              </td>

              {/* Submitted */}
              <td className="px-5 py-4">
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </td>
            </tr>
          );
        })}

        {filtered.length === 0 && (
          <tr>
            <td
              colSpan={6}
              className="px-5 py-14 text-center"
            >
              <div className="mx-auto max-w-sm">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  —
                </div>

                <p className="text-sm font-medium text-foreground">
                  No submissions found
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  No submissions match the current filter.
                </p>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

      {/* SUBMISSION DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border p-6 space-y-5"
            style={{ borderRadius: 24 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {selected.campaign.name}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {selected.creator.displayName ?? selected.creator.username ?? "Unnamed"}{" "}
                  · {selected.campaign.businessProfile?.companyName ?? "—"}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded-full text-xs border ${STATUS_STYLES[selected.status]}`}
              >
                {selected.status.replace("_", " ")}
              </span>
              <span className="text-xs text-muted-foreground">
                Submitted {new Date(selected.createdAt).toLocaleDateString()}
              </span>
            </div>

            {selected.screenshots.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Screenshots ({selected.screenshots.length})
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {selected.screenshots.map((src, i) => (
                    <a
                      key={i}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Screenshot ${i + 1}`}
                        className="h-32 w-full rounded-xl border border-border object-cover transition group-hover:opacity-80"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selected.postLinks.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  Post Links ({selected.postLinks.length})
                </h3>
                <ul className="space-y-1.5">
                  {selected.postLinks.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selected.caption && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">Caption</h3>
                <p className="text-sm text-muted-foreground">{selected.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="h-64 w-full animate-pulse rounded bg-card" />
    </div>
  );
}
