"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PaymentMethodDisplay } from "@/components/payment-method-display";
import { formatTZS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  CheckCircle2,
  Eye,
  Loader2Icon,
  XCircle,
} from "lucide-react";

type Proof = {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  proofUrl: string | null;
  note: string | null;
  status: "PROOF_SUBMITTED" | "VERIFIED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  submittedBy: { email: string } | null;
};

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_BADGE: Record<Proof["status"], string> = {
  PROOF_SUBMITTED: "bg-warning/15 text-warning border-warning/25",
  VERIFIED: "bg-success/15 text-success border-success/25",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/25",
};

export default function AdminPaymentProofPanel({
  campaignId,
  onReviewed,
}: {
  campaignId: string;
  onReviewed: () => void;
}) {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);

  const [reviewing, setReviewing] = useState<Proof | null>(null);
  const [action, setAction] = useState<"VERIFY" | "REJECT">("VERIFY");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch(
        `/api/admin/campaign/${campaignId}/payment-proofs`
      );
      const data = await res.json().catch(() => ({ proofs: [] }));
      setProofs(data.proofs ?? []);
    } catch {
      setProofs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/campaign/${campaignId}/payment-proofs`
        );
        const data = await res.json().catch(() => ({ proofs: [] }));
        if (!cancelled) setProofs(data.proofs ?? []);
      } catch {
        if (!cancelled) setProofs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const openReview = (proof: Proof, action: "VERIFY" | "REJECT") => {
    setReviewing(proof);
    setAction(action);
    setReason("");
    setActionError(null);
  };

  const submit = async () => {
    if (!reviewing) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/payment-proofs/${reviewing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejectionReason: action === "REJECT" ? reason.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError(data?.error ?? "Failed to update. Please try again.");
        setSubmitting(false);
        return;
      }
      setReviewing(null);
      setSubmitting(false);
      await load();
      onReviewed();
    } catch {
      setActionError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-[24px] border border-border bg-card p-5 text-sm text-muted-foreground">
        <Loader2Icon className="h-4 w-4 animate-spin" />
        Loading payment proofs...
      </div>
    );
  }

  if (proofs.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-orange-500" />
        <h3 className="text-sm font-semibold text-foreground">
          Payment Proofs
        </h3>
        <span className="rounded-lg bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {proofs.length}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Verify the brand&apos;s payment to mark this campaign as paid, or reject
        it with a reason so the brand can resubmit.
      </p>

      <div className="mt-4 space-y-3">
        {proofs.map((proof) => (
          <div
            key={proof.id}
            className="rounded-2xl border border-border bg-muted/30 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <PaymentMethodDisplay method={proof.paymentMethod} size="sm" />
                <span className="font-semibold text-foreground">
                  TZS {formatTZS(proof.amount)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    STATUS_BADGE[proof.status]
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {proof.status.replace("_", " ")}
                </span>
              </div>

              {proof.status === "PROOF_SUBMITTED" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => openReview(proof, "VERIFY")}
                    className="h-8 rounded-lg bg-success px-3 text-xs font-medium text-success-foreground hover:bg-success/90"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReview(proof, "REJECT")}
                    className="h-8 rounded-lg border-destructive/25 px-3 text-xs text-destructive hover:bg-destructive/15 hover:text-destructive"
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              )}
            </div>

            <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="font-mono text-xs text-foreground">
                  {proof.transactionReference}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="text-xs text-foreground">
                  {formatDate(proof.createdAt)}
                  {proof.submittedBy?.email ? ` · ${proof.submittedBy.email}` : ""}
                </dd>
              </div>
              {proof.note && (
                <div className="flex justify-between gap-2 sm:col-span-2">
                  <dt className="text-muted-foreground">Note</dt>
                  <dd className="max-w-[70%] text-right text-xs text-foreground">
                    {proof.note}
                  </dd>
                </div>
              )}
              {proof.status === "REJECTED" && proof.rejectionReason && (
                <div className="flex justify-between gap-2 sm:col-span-2">
                  <dt className="text-muted-foreground">Rejection reason</dt>
                  <dd className="max-w-[70%] text-right text-xs text-destructive">
                    {proof.rejectionReason}
                  </dd>
                </div>
              )}
            </dl>

            {proof.proofUrl && (
              <a
                href={proof.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <Eye className="h-3.5 w-3.5" />
                View receipt
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Review dialog */}
      <Dialog
        open={reviewing !== null}
        onOpenChange={(o) => !o && setReviewing(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            {action === "VERIFY" ? (
              <CheckCircle2 className="h-10 w-10 text-success" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive" />
            )}
            <DialogTitle className="text-lg font-semibold">
              {action === "VERIFY"
                ? "Verify Payment Proof?"
                : "Reject Payment Proof?"}
            </DialogTitle>
            <DialogDescription>
              {action === "VERIFY"
                ? "The campaign will be marked as paid and its platform fee revenue recorded as received."
                : "The campaign will return to Unpaid and the brand will be notified."}
            </DialogDescription>
          </DialogHeader>

          {action === "REJECT" && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Reason <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Transaction not found, amount mismatch"
                rows={3}
                className="rounded-xl"
              />
            </div>
          )}

          {actionError && (
            <p className="text-sm text-destructive">{actionError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewing(null)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={
                submitting ||
                (action === "REJECT" && !reason.trim())
              }
              className={
                action === "VERIFY"
                  ? "bg-success text-success-foreground hover:bg-success/90"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {submitting ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : action === "VERIFY" ? (
                "Confirm Verified"
              ) : (
                "Reject Proof"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}