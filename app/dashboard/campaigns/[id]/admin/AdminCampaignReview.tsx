"use client";

import { useState } from "react";
import PlatformIcons from "../../components/PlatformIcons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Prisma } from "@prisma/client";
import { CheckCircle2, Star, XCircle } from "lucide-react";
import { SiTicktick } from "react-icons/si";
import AdminApplications from "./AdminApplications";

type CampaignDetails = Prisma.CampaignGetPayload<{
  include: {
    businessProfile: true;
    _count: { select: { applications: true } };
  };
}>;

type AdminApplicationDetails = Prisma.CampaignApplicationGetPayload<{
  include: {
    creator: { include: { socialAccounts: true } };
    submission: true;
  };
}>;

const STATUS_STYLES: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  COMPLETED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function AdminCampaignReview({
  campaign,
  applications,
  page,
  totalPages,
  onPageChange,
}: {
  campaign: CampaignDetails;
  applications: AdminApplicationDetails[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const [status, setStatus] = useState<CampaignDetails["status"]>(
    campaign.status
  );
  const [featured, setFeatured] = useState(campaign.isFeatured);
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<
    "APPROVED" | "REJECTED" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"APPROVED" | "REJECTED" | null>(null);

  async function updateStatus(newStatus: CampaignDetails["status"]) {
    const res = await fetch(`/api/admin/campaign/${campaign.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: newStatus,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to update status");
    }

    setStatus(newStatus);
  }

  function openReview(target: "APPROVED" | "REJECTED") {
    setPendingTarget(target);
    setResult(null);
    setActionError(null);
    setConfirmOpen(true);
  }

  async function confirmReview() {
    if (!pendingTarget) return;
    setSubmitting(true);
    setActionError(null);

    try {
      await updateStatus(pendingTarget);
      setResult(pendingTarget);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  function closeReview() {
    setConfirmOpen(false);
    setPendingTarget(null);
    setResult(null);
    setActionError(null);
  }

  async function toggleFeatured() {
    setSavingFeatured(true);
    setActionError(null);

    try {
      const res = await fetch(
        `/api/admin/campaign/${campaign.id}/featured`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ featured: !featured }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update featured status");
      }

      setFeatured(!featured);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSavingFeatured(false);
    }
  }

  const approved = pendingTarget === "APPROVED";

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {actionError}
        </div>
      )}

      {/* CAMPAIGN CARD */}
      <div
        className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-900"
        style={{ borderRadius: 24 }}
      >
        <div
          className="h-52 bg-cover bg-center relative"
          style={{
            backgroundImage: `url(${campaign.thumbnailPic})`,
          }}
        >
          {featured && (
            <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              Featured
            </div>
          )}

          <div className="absolute bottom-5 left-5">
            <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>

            <p className="text-zinc-300 text-sm">
              {campaign.businessProfile?.companyName}
            </p>
          </div>
        </div>

        <div className="p-5 text-sm text-zinc-300 space-y-4">
          <p>{campaign.description}</p>

          <PlatformIcons platforms={campaign.platforms} />

          {/* Budget Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div
              className="bg-zinc-800/50 border border-white/10 p-3 rounded-xl"
              style={{ borderRadius: 16 }}
            >
              <p className="text-xs text-zinc-500">Total Budget</p>
              <p className="text-white font-semibold">
                TZS {campaign.budgetTotal.toLocaleString()}
              </p>
            </div>

            <div
              className="bg-zinc-800/50 border border-white/10 p-3 rounded-xl"
              style={{ borderRadius: 16 }}
            >
              <p className="text-xs text-zinc-500">Funded</p>
              <p className="text-emerald-400 font-semibold">
                TZS {campaign.budgetFunded.toLocaleString()}
              </p>
            </div>

            <div
              className="bg-zinc-800/50 border border-white/10 p-3 rounded-xl"
              style={{ borderRadius: 16 }}
            >
              <p className="text-xs text-zinc-500">Remaining</p>
              <p className="text-amber-400 font-semibold">
                TZS {(
                  campaign.budgetTotal - campaign.budgetFunded
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={toggleFeatured}
          disabled={savingFeatured}
          className={`px-5 py-3 rounded-[10] text-sm border border-orange-500 text-orange-500 font-medium transition ${
            featured
              ? " text-black hover:bg-amber-400"
              : "bg-zinc-800 text-zinc-200 border border-white/10 hover:bg-zinc-700"
          } disabled:opacity-50`}
        >
          <span className="flex items-center gap-2">
            <Star className={`h-4 w-4 ${featured ? "fill-orange-500" : ""}`} />
            {featured ? "Unfeature" : "Feature"}
          </span>
        </button>

        {status === "PENDING_REVIEW" && (
          <>
            <button
              onClick={() => openReview("APPROVED")}
              className="bg-green-500 px-5 py-3 rounded-xl text-sm font-medium text-black hover:bg-green-400"
            >
              Approve
            </button>

            <button
              onClick={() => openReview("REJECTED")}
              className="bg-red-500 px-5 py-3 rounded-xl text-sm font-medium text-white hover:bg-red-400"
            >
              Reject
            </button>
          </>
        )}

        {status === "APPROVED" && (
          <button
            onClick={() => updateStatus("COMPLETED")}
            className="bg-white px-5 py-3  text-sm font-medium text-black hover:bg-zinc-200 rounded-[10]"
          >
            Complete
          </button>
        )}

        <div
          className={`ml-auto px-4 py-2 rounded-full flex justify-center items-center  text-xs font-light ${STATUS_STYLES[status]}`}
        >
          {status === "APPROVED" && (
            <span className="inline-block mr-1">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          )}
          {status === "REJECTED" && (
            <span className="inline-block mr-1">
              <XCircle className="h-4 w-4" />
            </span>
          )}
          {status.replace("_", " ")}
        </div>
      </div>

      {/* APPLICATIONS */}
      <AdminApplications
        applications={applications}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      {/* REVIEW CONFIRMATION MODAL */}
      <Dialog open={confirmOpen} onOpenChange={(open) => !open && closeReview()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            {result ? (
              <>
                {result === "APPROVED" ? (
                  <CheckCircle2 className="h-10 w-10 text-green-400" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-400" />
                )}
                <DialogTitle className="text-lg font-semibold">
                  Campaign {result === "APPROVED" ? "Approved" : "Rejected"}
                </DialogTitle>
                <DialogDescription>
                  {result === "APPROVED"
                    ? `${campaign.name} has been approved and is now visible to creators.`
                    : `${campaign.name} has been rejected and will not be shown to creators.`}
                </DialogDescription>
              </>
            ) : (
              <>
                {approved ? (
                  <CheckCircle2 className="h-10 w-10 text-green-400" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-400" />
                )}
                <DialogTitle className="text-lg font-semibold">
                  {approved ? "Approve Campaign?" : "Reject Campaign?"}
                </DialogTitle>
                <DialogDescription>
                  {approved
                    ? `${campaign.name} will be marked as Approved and become visible to creators.`
                    : `${campaign.name} will be marked as Rejected and will not be shown to creators.`}
                </DialogDescription>
              </>
            )}
          </DialogHeader>

          {result ? (
            <DialogFooter>
              <button
                onClick={closeReview}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Done
              </button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <button
                onClick={closeReview}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReview}
                disabled={submitting}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 ${
                  approved
                    ? "bg-green-500 text-black hover:bg-green-400"
                    : "bg-red-500 hover:bg-red-400"
                }`}
              >
                {submitting
                  ? "Updating..."
                  : approved
                    ? "Approve"
                    : "Reject"}
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
