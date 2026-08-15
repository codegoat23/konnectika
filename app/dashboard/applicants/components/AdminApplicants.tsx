"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, X, Loader2, Eye } from "lucide-react";
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
import { EARNING_STATUS_STYLES } from "@/lib/status-styles";
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
    ? "bg-green-50 text-green-700 border-green-200"
    : status === "REJECTED"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

interface AdminApplicantsProps {
  applications: ApplicantApplication[];
  page: number;
  totalPages: number;
  start: number;
}

export default function AdminApplicants({
  applications,
  page,
  totalPages,
  start,
}: AdminApplicantsProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ApplicantApplication | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const makeAvailable = async (app: ApplicantApplication) => {
    if (!app.earning) return;
    setApprovingId(app.earning.id);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/admin/campaign/${app.campaignId}/earnings/${app.earning.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "AVAILABLE" }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError(data?.error ?? "Failed to make earning available.");
        setApprovingId(null);
        return;
      }
      router.refresh();
    } catch {
      setActionError("Something went wrong. Please try again.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <>
      <div className=" overflow-hidden p-6">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-foreground font-semibold flex items-center gap-2">
            <Users size={16} />
            Applicants
            <span className="text-xs font-light text-muted-foreground">
              ({applications.length})
            </span>
          </h2>
        </div>

        {actionError && (
          <div className="mx-6 mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={32} className="text-muted-foreground mb-3" />
            <h3 className="text-foreground font-medium">No applications yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Applications from creators will appear here.
            </p>
          </div>
        ) : (
           <div className="overflow-x-auto rounded-xl border border-border bg-card">
  <table className="w-full text-sm">
  <thead className="bg-[#FAFAF9] text-muted-foreground text-xs">
    <tr>
      <th className="w-[6%] px-4 py-3 text-left font-medium">No.</th>
      <th className="w-[20%] px-4 py-3 text-left font-medium">Creator</th>
      <th className="w-[20%] px-4 py-3 text-left font-medium">Campaign</th>
      <th className="w-[16%] px-4 py-3 text-left font-medium">Application</th>
      <th className="w-[18%] px-4 py-3 text-left font-medium">Earning</th>
      <th className="w-[10%] px-4 py-3 text-left font-medium">Date</th>
      <th className="w-[10%] px-4 py-3 text-right font-medium">Action</th>
    </tr>
  </thead>

  <tbody>
    {applications.map((a, index) => (
      <tr
        key={a.id}
        onClick={() => setSelected(a)}
        className="cursor-pointer border-t border-border/70 transition-colors hover:bg-[#FAFAF9]"
      >
        {/* Number */}
        <td className="px-4 py-4 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {start + index}
          </span>
        </td>

        {/* Creator */}
        <td className="px-4 py-4">
          <span className="block max-w-[180px] truncate font-medium text-foreground">
            {a.creator?.username || "Unknown"}
          </span>
        </td>

        {/* Campaign */}
        <td className="px-4 py-4">
          <span className="block max-w-[180px] truncate text-foreground">
            {a.campaign.name}
          </span>
        </td>

        {/* Application */}
        <td className="px-4 py-4">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
              a.status
            )}`}
          >
            {a.status}
          </span>
        </td>

        {/* Earning */}
        <td className="px-4 py-4">
          {a.earning ? (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${EARNING_STATUS_STYLES[
                a.earning.status
              ] ?? ""}`}
            >
              {a.earning.status}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>

        {/* Date */}
        <td className="px-4 py-4 text-xs text-muted-foreground">
          {new Date(a.createdAt).toLocaleDateString()}
        </td>

        {/* Action */}
        <td
          className="px-4 py-4 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          {a.earning?.status === "APPROVED" ? (
            <button
              onClick={() => makeAvailable(a)}
              disabled={approvingId !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {approvingId === a.earning!.id && (
                <Loader2 className="size-3 animate-spin" />
              )}
              Make Available
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="View application"
            >
              <Eye className="size-4" />
            </button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
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

      {/* READ-ONLY REVIEW MODAL */}
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

            {selected.earning && (
              <div className="bg-muted/40 border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-foreground font-medium">Earning</p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border ${EARNING_STATUS_STYLES[selected.earning.status] ?? ""}`}
                  >
                    {selected.earning.status}
                  </span>
                </div>
                <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Gross</span>
                    <span className="text-foreground font-medium">
                      TZS {selected.earning.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee ({selected.earning.platformFeeRate}%)</span>
                    <span className="text-foreground font-medium">
                      TZS {selected.earning.platformFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5">
                    <span>Creator Net</span>
                    <span className="text-foreground font-semibold">
                      TZS {selected.earning.creatorAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selected.message && (
              <div className="p-3 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground text-xs mb-1">
                  Application Message
                </p>
                <p className="text-muted-foreground text-sm">{selected.message}</p>
              </div>
            )}

            {selected.submission && (
              <div className="bg-muted/40 border border-border rounded-xl p-4">
                <p className="text-foreground font-medium mb-2">Submission</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Screenshots: {selected.submission.screenshots?.length || 0}
                  </p>
                  <p>
                    Links: {selected.submission.postLinks?.length || 0}
                  </p>
                  {selected.submission.caption && (
                    <p className="text-muted-foreground">
                      &quot;{selected.submission.caption}&quot;
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
