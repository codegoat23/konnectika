"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

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
  SUBMITTED: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  CHANGES_REQUESTED: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border border-red-500/20",
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-all focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10"
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
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="border border-border overflow-hidden" style={{ borderRadius: 24 }}>
        <table className="w-full text-sm">
          <thead className="bg-card text-muted-foreground text-xs tracking-wider">
            <tr>
              <th className="p-3 text-left">Creator</th>
              <th className="p-3 text-left">Campaign</th>
              <th className="p-3 text-left">Brand</th>
              <th className="p-3 text-left">Proof</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                onClick={() => setSelected(s)}
                className="group border-t border-border transition-all duration-200 hover:bg-card/60 cursor-pointer"
              >
                <td className="p-3 text-foreground">
                  {s.creator.displayName ?? s.creator.username ?? "Unnamed"}
                </td>
                <td className="p-3 text-muted-foreground">{s.campaign.name}</td>
                <td className="p-3 text-muted-foreground">
                  {s.campaign.businessProfile?.companyName ?? "—"}
                </td>
                <td className="p-3">
                  <span className="text-xs text-orange-400 hover:underline">
                    {s.screenshots.length} img · {s.postLinks.length} link — View
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs border ${STATUS_STYLES[s.status]}`}
                  >
                    {s.status.replace("_", " ")}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No submissions match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
                        className="break-all text-sm text-orange-400 hover:text-orange-300 hover:underline"
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
