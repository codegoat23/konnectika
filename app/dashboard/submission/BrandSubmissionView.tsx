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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Submission = {
  id: string;
  status: "PENDING_REVIEW" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
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
  PENDING_REVIEW: "bg-orange-50 text-orange-700 border-orange-200",
  SUBMITTED: "bg-orange-50 text-orange-700 border-orange-200",
  UNDER_REVIEW: "bg-warning/15 text-warning border-warning/25",
  APPROVED: "bg-success/15 text-success border-success/25",
  CHANGES_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/25",
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
    // Initial load via the shared load() used by review actions, so the list
    // always comes from one code path. Deferred so the effect doesn't call
    // setState synchronously on mount.
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
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
     <Select
  value={campaignFilter}
  onValueChange={setCampaignFilter}
>
  <SelectTrigger className="h-10 w-[30px] min-w-[150px] rounded-[14px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All campaigns</SelectItem>

    {campaigns.map(([id, name]) => (
      <SelectItem key={id} value={id}>
        {name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
      </header>

      {error && (
        <div className="rounded-[14] border  border-destructive/25 bg-destructive/15 px-4 py-3 text-sm text-destructive flex flex-row gap-3">
          <IoInformationCircleOutline size={20}/>
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No submissions yet for this view.</p>
      ) : (
       <ul className="space-y-4">
  {filtered.map((s) => (
    <li
      key={s.id}
      className="overflow-hidden rounded-[24px] border border-border bg-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
              {(s.creator.displayName ??
                s.creator.username ??
                "U")[0].toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {s.creator.displayName ??
                  s.creator.username ??
                  "Unnamed creator"}
              </p>

              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                @{s.creator.username ?? "unknown"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{s.campaign.name}</span>

            {s.creator.socialAccounts.length > 0 && (
              <>
                <span className="text-border">•</span>

                <span>
                  {s.creator.socialAccounts
                    .map(
                      (a) =>
                        `${a.platform} ${a.followers ?? 0} followers`
                    )
                    .join(" · ")}
                </span>
              </>
            )}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${STATUS_STYLES[s.status]}`}
        >
          {s.status.replaceAll("_", " ")}
        </span>
      </div>

      {/* Content */}
      <div className="border-t border-border px-5 py-5">
        {s.caption && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Caption
            </p>

            <p className="text-sm leading-6 text-foreground/80">
              {s.caption}
            </p>
          </div>
        )}

        {/* Screenshots */}
        {s.screenshots.length > 0 && (
          <div className={s.caption ? "mt-5" : ""}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Screenshots
            </p>

            <div className="flex flex-wrap gap-2">
              {s.screenshots.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative overflow-hidden rounded-[14px] border border-border bg-muted"
                >
                  <img
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="h-24 w-24 object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                    <span className="text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      View
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Post links */}
        {s.postLinks.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Submitted links
            </p>

            <div className="space-y-2 rounded-[16px] border border-border bg-muted/30 p-2">
              {s.postLinks.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <FiLink2 className="size-4 shrink-0" />

                  <span className="truncate">{link}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review actions */}
      {(s.status === "PENDING_REVIEW" ||
        s.status === "SUBMITTED" ||
        s.status === "UNDER_REVIEW" ||
        s.status === "CHANGES_REQUESTED") && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-4">
          <p className="text-xs text-muted-foreground">
            Review this submission
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={actingOn === s.id}
              onClick={() => review(s.id, "APPROVED")}
              className="rounded-[12px] bg-success px-4 py-2 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90 disabled:pointer-events-none disabled:opacity-50"
            >
              Approve
            </button>

            <button
              disabled={actingOn === s.id}
              onClick={() => {
                const note = window.prompt("What needs to change?");

                if (note !== null) {
                  review(s.id, "CHANGES_REQUESTED", note);
                }
              }}
              className="rounded-[12px] border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              Request changes
            </button>

            <button
              disabled={actingOn === s.id}
              onClick={() => {
                const note =
                  window.prompt("Reason for rejecting (optional)") ??
                  undefined;

                review(s.id, "REJECTED", note);
              }}
              className="rounded-[12px] border border-destructive/25 bg-destructive/15 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/25 disabled:pointer-events-none disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Review note */}
      {s.reviewNote && (
        <div className="border-t border-border px-5 py-4">
          <div className="rounded-[14px] bg-muted/40 px-4 py-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Review note
            </p>

            <p className="text-sm leading-5 text-foreground/80">
              {s.reviewNote}
            </p>
          </div>
        </div>
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
