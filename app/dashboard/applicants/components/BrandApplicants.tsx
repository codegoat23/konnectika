"use client";

import { useState } from "react";
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
    ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
    : status === "REJECTED"
      ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";

const submissionStatusClass = (status: string) =>
  status === "APPROVED"
    ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
    : status === "REJECTED"
      ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      : status === "CHANGES_REQUESTED"
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";

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
      <div className="overflow-hidden p-6">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-foreground font-semibold flex items-center gap-2">
            <Users size={16} />
            Applicants
            <span className="text-xs font-light text-muted-foreground">
              ({applications.length})
            </span>
          </h2>
        </div>

        {error && (
          <div className="mx-6 mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={32} className="text-muted-foreground mb-3" />
            <h3 className="text-foreground font-medium">No applications yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Creators who apply to your campaigns will appear here.
            </p>
          </div>
        ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-card">
        <tr className="border-b border-border">
          <th className="w-[6%] px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            No.
          </th>
          <th className="w-[20%] px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Creator
          </th>
          <th className="w-[20%] px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Campaign
          </th>
          <th className="w-[16%] px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Application
          </th>
          <th className="w-[18%] px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Submission
          </th>
          <th className="w-[10%] px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Date
          </th>
          <th className="w-[10%] px-5 py-3.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Action
          </th>
        </tr>
      </thead>

      <tbody>
        {applications.map((a, index) => (
         <tr
  key={a.id}
  onClick={() => setSelected(a)}
  className="
    group
    cursor-pointer
    border-b border-border/60
    last:border-b-0
    transition-colors duration-150
    hover:bg-muted/50
  "
>
            {/* No. */}
            <td className="px-5 py-4">
              <span className="text-xs tabular-nums text-muted-foreground">
                {String(start + index).padStart(2, "0")}
              </span>
            </td>

            {/* Creator */}
            <td className="px-5 py-4">
              <span className="block max-w-[180px] truncate font-medium text-foreground">
                {a.creator?.username || "Unknown"}
              </span>
            </td>

            {/* Campaign */}
            <td className="px-5 py-4">
              <span className="block max-w-[200px] truncate text-foreground">
                {a.campaign.name}
              </span>
            </td>

            {/* Application */}
            <td className="px-5 py-4">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass(
                  a.status
                )}`}
              >
                {a.status}
              </span>
            </td>

            {/* Submission */}
            <td className="px-5 py-4">
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
            <td className="px-5 py-4 text-xs text-muted-foreground">
              {new Date(a.createdAt).toLocaleDateString()}
            </td>

            {/* Action */}
            <td className="px-5 py-4 text-right">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(a);
                }}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground"
                aria-label="View application"
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
          <div className="flex items-center justify-between border-t border-border p-4">
            {page > 1 ? (
              <Link
                href={`/dashboard/applicants?page=${page - 1}`}
                className="px-4 py-2 rounded-xl bg-muted text-sm text-foreground hover:bg-muted/80"
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
                className="px-4 py-2 rounded-xl bg-muted text-sm text-foreground hover:bg-muted/80"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="w-full max-w-2xl bg-popover border border-border p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: 24 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-foreground font-semibold text-lg">
                  Creator Application
                </h2>
                <p className="text-muted-foreground text-xs">
                  {selected.campaign.name}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="bg-muted/60 border border-border p-4"
              style={{ borderRadius: 24 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center text-foreground font-bold">
                  {selected.creator?.displayName?.charAt(0) ||
                    selected.creator?.username?.charAt(0) ||
                    "C"}
                </div>

                <div>
                  <p className="text-foreground font-medium">
                    {selected.creator?.displayName ||
                      selected.creator?.username ||
                      "Creator"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    @{selected.creator?.username}
                  </p>
                </div>

                <div className="ml-auto">
                  <span
                    className={`px-3 py-1 text-xs rounded-full border ${statusClass(selected.status)}`}
                  >
                    {selected.status}
                  </span>
                </div>
              </div>

              {selected.creator?.socialAccounts?.length > 0 && (
                <div className="mt-4">
                  <p className="text-muted-foreground text-xs mb-2 uppercase tracking-wider">
                    Social Platforms
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {selected.creator.socialAccounts.map((acc) => {
                      const Icon =
                        platformIcons[acc.platform?.toLowerCase()] || FaGlobe;
                      return (
                        <a
                          key={acc.id}
                          href={acc.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground"
                        >
                          <Icon />
                          <span className="text-xs">@{acc.handle}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {selected.message && (
              <div className="p-3 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground text-xs mb-1">
                  Application Message
                </p>
                <p className="text-muted-foreground text-sm">
                  {selected.message}
                </p>
              </div>
            )}

            {selected.submission && (
              <div className="bg-muted/40 border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground font-medium">Submission</p>
                  <span
                    className={`px-3 py-1 text-xs rounded-full border ${submissionStatusClass(selected.submission.status)}`}
                  >
                    {selected.submission.status.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
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
                  <div className="flex gap-3 pt-2 mt-3">
                    <button
                      disabled={submissionActionLoading}
                      onClick={() =>
                        reviewSubmission("APPROVED", selected.submission!.id)
                      }
                      className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm disabled:opacity-50"
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
                      className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm disabled:opacity-50"
                    >
                      Request changes
                    </button>
                    <button
                      disabled={submissionActionLoading}
                      onClick={() =>
                        reviewSubmission("REJECTED", selected.submission!.id)
                      }
                      className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm disabled:opacity-50"
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
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
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
                  className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction("REJECTED", selected.id)}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm disabled:opacity-50"
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
