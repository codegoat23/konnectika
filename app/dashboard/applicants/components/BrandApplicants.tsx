"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, X, Check, Eye } from "lucide-react";
import {
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaGlobe,
} from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import type { IconType } from "react-icons";
import type { ApplicantApplication } from "./types";

const platformIcons: Record<string, IconType> = {
  instagram: FaInstagram,
  youtube: FaYoutube,
  twitter: FaTwitter,
  x: FaTwitter,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  tiktok: SiTiktok,
};

const statusClass = (status: string) =>
  status === "APPROVED"
    ? "bg-success/15 text-success border-success/25"
    : status === "REJECTED"
      ? "bg-destructive/15 text-destructive border-destructive/25"
      : "bg-warning/15 text-warning border-warning/25";

const submissionStatusClass = (status: string) =>
  status === "APPROVED"
    ? "bg-success/15 text-success border-success/25"
    : status === "REJECTED"
      ? "bg-destructive/15 text-destructive border-destructive/25"
      : status === "CHANGES_REQUESTED"
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-warning/15 text-warning border-warning/25";

interface BrandApplicantsProps {
  applications: ApplicantApplication[];
  page: number;
  totalPages: number;
  start: number;
}

export default function BrandApplicants({
  applications,
  page,
  totalPages,
  start,
}: BrandApplicantsProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ApplicantApplication | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [submissionActionLoading, setSubmissionActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  async function handleAction(status: string, applicationId: string) {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to update application");
        return;
      }
      setSelected((prev) =>
        prev
          ? { ...prev, status: data?.application?.status ?? status }
          : prev
      );
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  }

  async function reviewSubmission(
    status: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED",
    submissionId: string
  ) {
    setSubmissionActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to update submission");
        return;
      }
      setSelected((prev) =>
        prev
          ? { ...prev, submission: { ...prev.submission!, status } }
          : prev
      );
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmissionActionLoading(false);
    }
  }

  return (
    <>
      <div className="overflow-hidden p-4 sm:p-6">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-foreground font-semibold flex items-center gap-2 text-base sm:text-lg">
            <Users size={18} />
            Applicants
            <span className="text-xs font-light text-muted-foreground">
              ({applications.length})
            </span>
          </h2>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/25 bg-destructive/15 px-4 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-border rounded-2xl bg-card">
            <Users size={32} className="text-muted-foreground mb-3" />
            <h3 className="text-foreground font-medium">No applications yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Creators who apply to your campaigns will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[620px]">
                <thead className="bg-card">
                  <tr className="border-b border-border">
                    <th className="w-[6%] px-4 sm:px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      No.
                    </th>
                    <th className="w-[20%] px-4 sm:px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Creator
                    </th>
                    <th className="w-[22%] px-4 sm:px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Campaign
                    </th>
                    <th className="w-[16%] px-4 sm:px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Application
                    </th>
                    <th className="w-[16%] px-4 sm:px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Submission
                    </th>
                    <th className="w-[10%] px-4 sm:px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="w-[10%] px-4 sm:px-5 py-3.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/60">
                  {applications.map((a, index) => (
                    <tr
                      key={a.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`View application from ${a.creator?.username || "creator"} for ${a.campaign.name}`}
                      onClick={() => setSelected(a)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(a);
                        }
                      }}
                      className="group cursor-pointer transition-colors duration-150 hover:bg-muted/50 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      {/* No. */}
                      <td className="px-4 sm:px-5 py-4">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {String(start + index).padStart(2, "0")}
                        </span>
                      </td>

                      {/* Creator */}
                      <td className="px-4 sm:px-5 py-4">
                        <span className="block max-w-[180px] truncate font-medium text-foreground">
                          {a.creator?.username || "Unknown"}
                        </span>
                      </td>

                      {/* Campaign */}
                      <td className="px-4 sm:px-5 py-4">
                        <span className="block max-w-[200px] truncate text-foreground">
                          {a.campaign.name}
                        </span>
                      </td>

                      {/* Application */}
                      <td className="px-4 sm:px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass(
                            a.status
                          )}`}
                        >
                          {a.status}
                        </span>
                      </td>

                      {/* Submission */}
                      <td className="px-4 sm:px-5 py-4">
                        {a.submission ? (
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${submissionStatusClass(
                              a.submission.status
                            )}`}
                          >
                            {a.submission.status.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not submitted
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 sm:px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="px-4 sm:px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(a);
                          }}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={`View details for ${a.creator?.username || "creator"}`}
                        >
                          <Eye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border mt-4 pt-4">
            {page > 1 ? (
              <Link
                href={`/dashboard/applicants?page=${page - 1}`}
                className="px-4 py-2 rounded-xl bg-muted text-sm text-foreground hover:bg-muted/80 transition min-h-[40px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/dashboard/applicants?page=${page + 1}`}
                className="px-4 py-2 rounded-xl bg-muted text-sm text-foreground hover:bg-muted/80 transition min-h-[40px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Next
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </div>

      {/* REVIEW MODAL */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="applicant-modal-title"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div
            className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-2xl bg-popover border border-border p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto shadow-xl"
            style={{ borderRadius: 24 }}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <h2 id="applicant-modal-title" className="text-foreground font-semibold text-base sm:text-lg">
                  Creator Application
                </h2>
                <p className="text-muted-foreground text-xs">
                  {selected.campaign.name}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close application dialog"
                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="bg-muted/60 border border-border p-4"
              style={{ borderRadius: 20 }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center text-foreground font-bold shrink-0">
                  {selected.creator?.displayName?.charAt(0) ||
                    selected.creator?.username?.charAt(0) ||
                    "C"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-foreground font-medium truncate">
                    {selected.creator?.displayName ||
                      selected.creator?.username ||
                      "Creator"}
                  </p>
                  <p className="text-muted-foreground text-xs truncate">
                    @{selected.creator?.username}
                  </p>
                </div>

                <div className="ml-auto shrink-0">
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full border ${statusClass(selected.status)}`}
                  >
                    {selected.status}
                  </span>
                </div>
              </div>

              {selected.creator?.socialAccounts && selected.creator.socialAccounts.length > 0 && (
                <div className="mt-4">
                  <p className="text-muted-foreground text-xs mb-2 uppercase tracking-wider font-medium">
                    Social Platforms
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {selected.creator.socialAccounts.map((acc) => {
                      const Icon =
                        platformIcons[acc.platform?.toLowerCase()] || FaGlobe;
                      return (
                        <a
                          key={acc.id}
                          href={acc.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Icon />
                          <span>@{acc.handle}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {selected.message && (
              <div className="p-3.5 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground text-xs mb-1 font-medium">
                  Application Message
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {selected.message}
                </p>
              </div>
            )}

            {selected.submission && (
              <div className="bg-muted/40 border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground font-medium text-sm">Submission</p>
                  <span
                    className={`px-2.5 py-1 text-xs rounded-full border ${submissionStatusClass(selected.submission.status)}`}
                  >
                    {selected.submission.status.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p>
                    Screenshots: {selected.submission.screenshots?.length || 0}
                  </p>
                  <p>Links: {selected.submission.postLinks?.length || 0}</p>
                  {selected.submission.caption && (
                    <p className="text-muted-foreground">
                      &quot;{selected.submission.caption}&quot;
                    </p>
                  )}
                  {selected.submission.reviewNote && (
                    <p className="text-muted-foreground">
                      Note: &quot;{selected.submission.reviewNote}&quot;
                    </p>
                  )}
                </div>

                {[
                  "PENDING_REVIEW",
                  "SUBMITTED",
                  "UNDER_REVIEW",
                  "CHANGES_REQUESTED",
                ].includes(selected.submission.status) && (
                  <div className="flex flex-wrap gap-2.5 pt-2 mt-3">
                    <button
                      disabled={submissionActionLoading}
                      onClick={() =>
                        reviewSubmission("APPROVED", selected.submission!.id)
                      }
                      className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
                    >
                      Approve
                    </button>
                    <button
                      disabled={submissionActionLoading}
                      onClick={() =>
                        reviewSubmission(
                          "CHANGES_REQUESTED",
                          selected.submission!.id
                        )
                      }
                      className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Request changes
                    </button>
                    <button
                      disabled={submissionActionLoading}
                      onClick={() =>
                        reviewSubmission("REJECTED", selected.submission!.id)
                      }
                      className="flex-1 min-h-[40px] py-2 px-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {selected.status === "APPROVED" || selected.status === "REJECTED" ? (
              <div
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium ${
                  selected.status === "APPROVED"
                    ? "bg-success/15 text-success border-success/25"
                    : "bg-destructive/15 text-destructive border-destructive/25"
                }`}
              >
                {selected.status === "APPROVED" ? (
                  <Check size={16} />
                ) : (
                  <X size={16} />
                )}
                Application{" "}
                {selected.status === "APPROVED" ? "Approved" : "Rejected"}
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction("APPROVED", selected.id)}
                  className="flex-1 min-h-[44px] py-2 rounded-xl bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
                >
                  Approve
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction("REJECTED", selected.id)}
                  className="flex-1 min-h-[44px] py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
