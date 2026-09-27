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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PaymentProofUploader from "@/components/PaymentProofUploader";
import { PaymentMethodDisplay } from "@/components/payment-method-display";
import { formatTZS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Landmark,
  Loader2Icon,
  Smartphone,
  XCircle,
} from "lucide-react";

export type CampaignPaymentStatus =
  | "UNPAID"
  | "PROOF_SUBMITTED"
  | "PAID";

type ReceivingAccount = {
  id: string;
  type: "MOBILE_MONEY" | "BANK";
  provider: string;
  accountName: string;
  phone: string | null;
  accountNumber: string | null;
  branchDetail: string | null;
  extraDetails: string | null;
  isActive: boolean;
};

type SimpleProof = {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  proofUrl: string | null;
  note: string | null;
  status: "PROOF_SUBMITTED" | "VERIFIED" | "REJECTED";
  rejectionReason: string | null;
  createdAt: string;
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BrandPaymentSection({
  campaignId,
  campaignName,
  totalCharge,
  paymentMethod,
  initialStatus,
}: {
  campaignId: string;
  campaignName: string;
  totalCharge: number;
  paymentMethod: string | null;
  initialStatus: CampaignPaymentStatus;
}) {
  const [status, setStatus] = useState<CampaignPaymentStatus>(initialStatus);
  const [accounts, setAccounts] = useState<ReceivingAccount[]>([]);
  const [proofs, setProofs] = useState<SimpleProof[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [transactionReference, setTransactionReference] = useState("");
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const methodParam = paymentMethod
      ? `?method=${encodeURIComponent(paymentMethod)}`
      : "";
    (async () => {
      try {
        const [accountsRes, proofsRes] = await Promise.all([
          fetch(`/api/payment-receiving-accounts${methodParam}`),
          fetch(`/api/brand-payments?campaignId=${campaignId}`),
        ]);
        const accountsData = await accountsRes
          .json()
          .catch(() => ({ accounts: [] }));
        const proofsData = await proofsRes
          .json()
          .catch(() => ({ proofs: [] }));
        if (!cancelled) {
          setAccounts(accountsData.accounts ?? []);
          setProofs(proofsData.proofs ?? []);
        }
      } catch {
        if (!cancelled) {
          setAccounts([]);
          setProofs([]);
        }
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, paymentMethod]);

  const latestProof = proofs[0] ?? null;
  const awaiting = status === "PROOF_SUBMITTED";
  const canSubmit = status === "UNPAID";
  const paid = status === "PAID";

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/brand-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          amount: totalCharge,
          paymentMethod,
          transactionReference,
          proofUrl,
          note,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to submit proof. Please try again.");
        setSubmitting(false);
        return;
      }
      setStatus("PROOF_SUBMITTED");
      setSubmitted(true);
      setOpen(false);
      setSubmitting(false);
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-muted/50 border border-border rounded-[24px] p-5" style={{ borderRadius: 24 }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Pay the Platform Fee
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {paymentMethod ? (
              <>
                Send{" "}
                <span className="font-medium text-foreground">
                  TZS {formatTZS(totalCharge)}
                </span>{" "}
                to Konnectika&apos;s{" "}
                <PaymentMethodDisplay method={paymentMethod} size="sm" showLabel />{" "}
                account shown below, then submit your proof for admin verification.
              </>
            ) : (
              "No payment method was selected for this campaign."
            )}
          </p>
        </div>

        {paymentMethod && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium",
              paid
                ? "bg-success/15 text-success border-success/25"
                : awaiting
                ? "bg-info/15 text-info border-info/25"
                : "bg-warning/15 text-warning border-warning/25"
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {paid ? "Paid" : awaiting ? "Proof Submitted" : "Unpaid"}
          </span>
        )}
      </div>

      {/* Konnectika receiving account(s) */}
      {paymentMethod && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {accountsLoading ? (
            <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Loading receiving account...
            </div>
          ) : accounts.length === 0 ? (
            <div className="md:col-span-2 flex items-start gap-2 rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-xs text-warning">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Konnectika has not configured a receiving account for this
                payment method yet. Please contact support before making a
                payment.
              </span>
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  {account.type === "BANK" ? (
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {account.provider} Account
                  </span>
                </div>

                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted-foreground">Account name</dt>
                    <dd className="font-medium text-foreground">
                      {account.accountName}
                    </dd>
                  </div>

                  {account.phone && (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="font-mono font-medium text-foreground">
                        {account.phone}
                      </dd>
                    </div>
                  )}

                  {account.accountNumber && (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Account number</dt>
                      <dd className="font-mono font-medium text-foreground">
                        {account.accountNumber}
                      </dd>
                    </div>
                  )}

                  {(account.branchDetail || account.extraDetails) && (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">Reference</dt>
                      <dd className="text-right text-xs text-muted-foreground">
                        {[account.branchDetail, account.extraDetails]
                          .filter(Boolean)
                          .join(" · ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ))
          )}
        </div>
      )}

      {/* Latest proof / actions */}
      <div className="mt-4 border-t border-border pt-4">
        {paid ? (
          <div className="flex items-start gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Payment confirmed</p>
              <p className="text-xs text-success/80">
                {latestProof
                  ? `Verified on ${formatDate(latestProof.createdAt)}.`
                  : "Your payment for this campaign has been confirmed."}
              </p>
            </div>
          </div>
        ) : awaiting ? (
          <div className="flex items-start gap-2 rounded-2xl border border-info/25 bg-info/10 px-4 py-3 text-sm text-info">
            <Loader2Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Payment proof submitted</p>
              <p className="text-xs text-info/80">
                {latestProof
                  ? `TZS ${formatTZS(latestProof.amount)} · Ref ${latestProof.transactionReference} — submitted on ${formatDate(latestProof.createdAt)}. Awaiting admin verification.`
                  : "Awaiting admin verification."}
              </p>
            </div>
          </div>
        ) : latestProof?.status === "REJECTED" ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Payment proof rejected</p>
                <p className="text-xs text-destructive/80">
                  {latestProof.rejectionReason || "Rejection reason not provided."}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setError(null);
                setSubmitted(false);
                setOpen(true);
              }}
              disabled={!paymentMethod || accounts.length === 0}
              className="bg-primary text-primary-foreground font-medium hover:bg-primary/90"
              style={{ borderRadius: 14 }}
            >
              Resubmit Payment Proof
            </Button>
          </div>
        ) : canSubmit ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              After sending the money, submit a screenshot / receipt with the
              transaction reference so an admin can verify it.
            </p>
            <Button
              onClick={() => {
                setError(null);
                setSubmitted(false);
                setOpen(true);
              }}
              disabled={!paymentMethod || accounts.length === 0}
              className="shrink-0 bg-primary text-primary-foreground font-medium hover:bg-primary/90"
              style={{ borderRadius: 14 }}
            >
              I&apos;ve Made the Payment
            </Button>
          </div>
        ) : null}

        {accounts.length === 0 && !accountsLoading && !paymentMethod && (
          <p className="text-xs text-muted-foreground">
            No payment method selected.
          </p>
        )}
      </div>

      {/* Submit proof dialog */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) setOpen(false);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl p-2">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Submit Payment Proof
            </DialogTitle>
            <DialogDescription>
              Confirm you sent{" "}
              <span className="font-semibold text-foreground">
                TZS {formatTZS(totalCharge)} via{" "}
                <PaymentMethodDisplay method={paymentMethod} size="sm" showLabel />
              </span>. Provide the transaction reference so admin can verify it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            {/* Konnectika receiving account — shown inside the dialog so the brand
                knows exactly where to send the money while filling out the form */}
            {accounts.length > 0 && (
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Send Payment To (Konnectika)
                </p>
                {accounts.map((account) => (
                  <div key={account.id} className="flex items-start gap-2">
                    {account.type === "BANK" ? (
                      <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {account.accountName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {account.provider}
                        </span>
                      </div>
                      {account.phone && (
                        <p className="font-mono font-medium text-foreground">
                          {account.phone}
                        </p>
                      )}
                      {account.accountNumber && (
                        <p className="font-mono font-medium text-foreground">
                          Acc: {account.accountNumber}
                        </p>
                      )}
                      {(account.branchDetail || account.extraDetails) && (
                        <p className="text-xs text-muted-foreground">
                          {[account.branchDetail, account.extraDetails]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Amount (read-only confirmation) */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <span className="text-xs text-muted-foreground">You paid</span>
              <span className="font-semibold text-foreground">
                TZS {formatTZS(totalCharge)}
              </span>
            </div>

            {/* Transaction reference */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Transaction / Reference number{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g. Airtel Money transaction ID"
                className="h-12 rounded-xl"
              />
            </div>

            {/* Receipt upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Receipt / screenshot
              </label>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3">
                <PaymentProofUploader
                  onUploadComplete={(urls) => setProofUrl(urls[0] ?? null)}
                  label={
                    proofUrl ? "Upload another receipt" : "Upload receipt / screenshot"
                  }
                />
                {proofUrl && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Receipt uploaded
                  </p>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Note <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything the admin should know"
                rows={3}
                className="rounded-xl"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4 sm:justify-between">
            <DialogClose asChild>
              <Button variant="ghost" className="cursor-pointer rounded-xl" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>

            <Button
              onClick={submit}
              disabled={submitting || !transactionReference.trim()}
              className="w-full cursor-pointer rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Proof"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={submitted} onOpenChange={(o) => !o && setSubmitted(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <CheckCircle2 className="h-10 w-10 text-success" />
            <DialogTitle className="text-lg font-semibold">
              Proof Submitted
            </DialogTitle>
            <DialogDescription>
              Thank you! Your payment proof for &quot;{campaignName}&quot; has
              been submitted and will be verified by an admin shortly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSubmitted(false)} className="rounded-xl">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}