"use client";

import { useState } from "react";
import { Users, X } from "lucide-react";
import {
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaGlobe,
} from "react-icons/fa";
import { SiTiktok } from "react-icons/si";
import type { Prisma } from "@prisma/client";
import type { IconType } from "react-icons";

type AdminApplicationDetails = Prisma.CampaignApplicationGetPayload<{
  include: {
    creator: { include: { socialAccounts: true } };
    submission: true;
  };
}>;

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
    ? "bg-green-500/10 text-green-400 border-green-500/20"
    : status === "REJECTED"
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : "bg-amber-500/10 text-amber-400 border-amber-500/20";

export default function AdminApplications({
  applications,
  page,
  totalPages,
  onPageChange,
}: {
  applications: AdminApplicationDetails[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [selected, setSelected] =
    useState<AdminApplicationDetails | null>(null);

  return (
    <>
      <div className="rounded-3xl border border-border bg-card/60 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-foreground font-semibold flex items-center gap-2">
            <Users size={16} />
            Applications
            <span className="text-xs font-light text-muted-foreground">
              ({applications.length})
            </span>
          </h2>
        </div>

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={32} className="text-muted-foreground mb-3" />
            <h3 className="text-foreground font-medium">No applications yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Creators who apply to this campaign will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card text-muted-foreground text-xs">
                <tr>
                  <th className="p-3 text-left w-[35%]">Creator</th>
                  <th className="p-3 text-left w-[25%]">Status</th>
                  <th className="p-3 text-left w-[25%]">Date</th>
                  <th className="p-3 text-right w-[15%]">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className="border-t border-border cursor-pointer hover:bg-card/60 transition"
                  >
                    <td className="p-3 text-foreground truncate">
                      {a.creator?.username || "Unknown"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs rounded-full border ${statusClass(a.status)}`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right text-muted-foreground text-xs">
                      View
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border p-4">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-muted text-sm text-foreground hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl bg-muted text-sm text-foreground hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
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
                <p className="text-muted-foreground text-xs">Viewing application</p>
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
