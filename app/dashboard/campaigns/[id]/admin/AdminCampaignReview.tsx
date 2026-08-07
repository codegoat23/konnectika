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
import PaymentBreakdown from "../../components/PaymentBreakdown";

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
  COMPLETED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
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
        className="rounded-3xl overflow-hidden border border-border bg-card"
        style={{ borderRadius: 24 }}
      >
        <div
          className="h-52 bg-cover bg-center relative"
          style={{
            backgroundImage: `url(${campaign.thumbnailPic})`,
          }}
        >
          {featured && (
            <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 text-xs font-medium text-orange-400">
              <Star className="h-3.5 w-3.5 fill-orange-400" />
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

        <div className="p-5 text-sm text-muted-foreground space-y-4">
          <p>{campaign.description}</p>

          <PlatformIcons platforms={campaign.platforms} />

          {/* Budget Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div
              className="bg-muted/50 border border-border p-3 rounded-xl"
              style={{ borderRadius: 16 }}
            >
              <p className="text-xs text-muted-foreground">Total Budget</p>
              <p className="text-foreground font-semibold">
                TZS {campaign.budgetTotal.toLocaleString()}
              </p>
            </div>

            <div
              className="bg-muted/50 border border-border p-3 rounded-xl"
              style={{ borderRadius: 16 }}
            >
              <p className="text-xs text-muted-foreground">Funded</p>
              <p className="text-emerald-400 font-semibold">
                TZS {campaign.budgetFunded.toLocaleString()}
              </p>
            </div>

            <div
              className="bg-muted/50 border border-border p-3 rounded-xl"
              style={{ borderRadius: 16 }}
            >
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-amber-400 font-semibold">
                TZS {(
                  campaign.budgetTotal - campaign.budgetFunded
                ).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment breakdown + status */}
          <div className="mt-4">
            <PaymentBreakdown
              budget={campaign.budgetTotal}
              feeRate={campaign.platformFeeRate}
              fee={campaign.platformFee}
              total={campaign.totalCharge}
              paymentStatus={campaign.paymentStatus}
              showStatus
              title="Payment"
              showNote={false}
            />
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
              ? "bg-orange-500 text-white hover:bg-orange-400"
              : "bg-muted text-foreground border border-border hover:bg-muted"
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
              className="bg-green-500 px-5 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-green-400"
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
            className="bg-orange-500 px-5 py-3  text-sm font-medium text-white hover:bg-orange-400 rounded-[10]"
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
                    ? `${campaign.name} has been approved, payment confirmed, and is now visible to creators.`
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
                  {approved ? "Approve & Confirm Payment?" : "Reject Campaign?"}
                </DialogTitle>
                <DialogDescription>
                  {approved
                    ? `Approving "${campaign.name}" confirms the brand's manual payment has been received. It will be marked as PAID and become visible to creators.`
                    : `${campaign.name} will be marked as Rejected and will not be shown to creators.`}
                </DialogDescription>
              </>
            )}
          </DialogHeader>

          {result ? (
            <DialogFooter>
              <button
                onClick={closeReview}
                className="px-5 py-2.5 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted"
              >
                Done
              </button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <button
                onClick={closeReview}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReview}
                disabled={submitting}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50 ${
                  approved
                    ? "bg-green-500 text-white hover:bg-green-400"
                    : "bg-red-500 hover:bg-red-400"
                }`}
              >
                {submitting
                  ? "Updating..."
                  : approved
                    ? "Approve & Mark Paid"
                    : "Reject"}
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
