"use client";

// app/dashboard/submission/BrandSubmissionView.tsx
//
// Brand's view of /dashboard/submission:
// - All submissions for campaigns this brand owns
// - Filterable by campaign
// - Shows creator name/handle/followers alongside each submission
// - Approve / request changes / reject actions

import { useEffect, useMemo, useState } from "react";
import { FiLink2 } from "react-icons/fi";
import { IoInformationCircleOutline } from "react-icons/io5";

type Submission = {
  id: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
  screenshots: string[];
  postLinks: string[];
  caption: string | null;
  reviewNote: string | null;
  createdAt: string;
  creator: {
    id: string;
    displayName: string | null;
    username: string | null;
    socialAccounts: { platform: string; handle: string; followers: number | null }[];
  };
  campaign: { id: string; name: string };
};

const STATUS_STYLES: Record<Submission["status"], string> = {
  SUBMITTED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CHANGES_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export default function BrandSubmissionView() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [actingOn, setActingOn] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/submissions");
        if (!res.ok) throw new Error("Couldn't load submissions");
        const data = await res.json();
        if (!cancelled) setSubmissions(data.submissions ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const campaigns = useMemo(() => {
    const map = new Map<string, string>();
    submissions.forEach((s) => map.set(s.campaign.id, s.campaign.name));
    return Array.from(map.entries());
  }, [submissions]);

  const filtered = useMemo(() => {
    if (campaignFilter === "all") return submissions;
    return submissions.filter((s) => s.campaign.id === campaignFilter);
  }, [submissions, campaignFilter]);

  async function review(id: string, status: Submission["status"], reviewNote?: string) {
    setActingOn(id);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote }),
      });
      if (!res.ok) throw new Error("Couldn't update this submission");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setActingOn(null);
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Submissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Proof submitted by creators across your campaigns.
          </p>
        </div>
        <select
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="rounded-[14] border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        >
          <option value="all">All campaigns</option>
          {campaigns.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </header>

      {error && (
        <div className="rounded-[14] border  border-red-500/10 bg-red-500/10 px-4 py-3 text-sm text-red-700 flex flex-row gap-3">
          <IoInformationCircleOutline size={20}/>
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No submissions yet for this view.</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((s) => (
            <li key={s.id} className="rounded-[24] border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    {s.creator.displayName ?? s.creator.username ?? "Unnamed creator"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{s.creator.username ?? "unknown"} · {s.campaign.name}
                  </p>
                  {s.creator.socialAccounts.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.creator.socialAccounts
                        .map((a) => `${a.platform} (${a.followers ?? 0})`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[s.status]}`}
                >
                  {s.status.replace("_", " ")}
                </span>
              </div>

              {s.caption && <p className="mt-3 text-sm text-muted-foreground">{s.caption}</p>}

              <div className="mt-3 flex flex-wrap gap-2">
                {s.screenshots.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt={`Screenshot ${i + 1}`}
                      className="h-20 w-20 rounded-[14] border border-border object-cover"
                    />
                  </a>
                ))}
              </div>

              <ul className="mt-6 space-y-1 border border-border bg-black/20 p-2 rounded-[14]">
                {s.postLinks.map((link, i) => (
                  <li key={i} className="flex flex-row gap-3 items-center px-1">
                    <FiLink2 />
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-muted-foreground underline"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>

              {(s.status === "SUBMITTED" || s.status === "UNDER_REVIEW") && (
                <div className="mt-4 flex gap-2">
                  <button
                    disabled={actingOn === s.id}
                    onClick={() => review(s.id, "APPROVED")}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={actingOn === s.id}
                    onClick={() => {
                      const note = window.prompt("What needs to change?");
                      if (note !== null) review(s.id, "CHANGES_REQUESTED", note);
                    }}
                    className="rounded-md bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-200 disabled:opacity-50"
                  >
                    Request changes
                  </button>
                  <button
                    disabled={actingOn === s.id}
                    onClick={() => {
                      const note = window.prompt("Reason for rejecting (optional)") ?? undefined;
                      review(s.id, "REJECTED", note);
                    }}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}

              {s.reviewNote && (
                <p className="mt-3 text-sm text-muted-foreground">Your note: {s.reviewNote}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="h-32 w-full animate-pulse rounded bg-muted" />
      <div className="h-32 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}
