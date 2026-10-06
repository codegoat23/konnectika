"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatTZS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Loader2Icon,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

/**
 * Brand campaign payment through Snippe.
 *
 * The brand starts a payment, Snippe pushes a USSD authorization to their
 * phone, and the campaign is marked PAID by the verified webhook — never by
 * this component. The status shown here is refreshed by polling purely so the
 * UI settles on the truth; `POST /api/campaigns/[id]/pay` returning 202 does
 * NOT mean paid, and this component never claims it is.
 */

export type CampaignPaymentStatus =
  | "UNPAID"
  | "AWAITING_PAYMENT"
  | "PROOF_SUBMITTED"
  | "PAYMENT_FAILED"
  | "PAID";

type Breakdown = {
  budget: number;
  platformFeeRate: number;
  platformFee: number;
  providerFeeRate: number;
  providerFee: number;
  totalCharge: number;
};

type Intent = {
  id: string;
  attempt: number;
  status: "AWAITING_PAYMENT" | "PROCESSING" | "PAID" | "FAILED";
  totalCharge: number;
  platformFee: number;
  providerFee: number;
  providerFeeRate: number;
  actualProviderFee: number | null;
  channel: string | null;
  customerPhone: string | null;
  failureReason: string | null;
  createdAt: string;
};

type Instructions = {
  reference: string;
  amount: number;
  phone: string;
  channel: string;
  message: string;
  expiresAt: string | null;
};

type PayResponse = {
  campaign: { id: string; name: string; paymentStatus: CampaignPaymentStatus };
  breakdown: Breakdown | null;
  intent: Intent | null;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_LABEL: Record<CampaignPaymentStatus, string> = {
  UNPAID: "Unpaid",
  AWAITING_PAYMENT: "Awaiting authorization",
  PROOF_SUBMITTED: "Verifying",
  PAYMENT_FAILED: "Payment failed",
  PAID: "Paid",
};

export default function BrandPaymentSection({
  campaignId,
  campaignName,
  initialStatus,
}: {
  campaignId: string;
  campaignName: string;
  initialStatus: CampaignPaymentStatus;
}) {
  const [status, setStatus] =
    useState<CampaignPaymentStatus>(initialStatus);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/pay`);
      if (!res.ok) return null;
      const data: PayResponse = await res.json();
      setBreakdown(data.breakdown);
      setIntent(data.intent);
      setStatus(data.campaign.paymentStatus);
      return data;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Load once on mount. The route is a read; any later refresh is user- or
  // timer-driven, so this must not be an effect that setStates synchronously.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/pay`, {
          signal: controller.signal,
        });
        if (!res.ok || cancelled) return;
        const data: PayResponse = await res.json();
        if (cancelled) return;
        setBreakdown(data.breakdown);
        setIntent(data.intent);
        setStatus(data.campaign.paymentStatus);
      } catch {
        if (!cancelled) setBreakdown(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [campaignId]);

  /**
   * While a payment is in flight, poll for the webhook's effect so the UI
   * updates without a manual reload. This is UX only — the webhook is what
   * actually settles the campaign.
   */
  useEffect(() => {
    if (status !== "AWAITING_PAYMENT") {
      if (pollRef.current) clearTimeout(pollRef.current);
      return;
    }
    pollRef.current = setTimeout(async () => {
      const data = await refresh();
      if (data?.campaign.paymentStatus === "AWAITING_PAYMENT") {
        // still pending — schedule the next check
        void refresh();
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [status, refresh]);

  const startPayment = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, firstName, lastName, email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not start the payment. Please try again.");
        setStarting(false);
        return;
      }

      if (data?.breakdown) setBreakdown(data.breakdown);
      setInstructions(data?.instructions ?? null);
      setStatus("AWAITING_PAYMENT");
      setOpen(false);
      setStarting(false);
      void refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setStarting(false);
    }
  };

  const paid = status === "PAID";
  const awaiting = status === "AWAITING_PAYMENT";
  const failed = status === "PAYMENT_FAILED";
  const canPay = !paid && !awaiting;

  const display = breakdown;

  return (
    <div
      className="bg-muted/50 border border-border p-5"
      style={{ borderRadius: 24 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Pay for this campaign
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Pay securely by mobile money. You&apos;ll get a USSD prompt to
            authorize the payment — no transfers, no receipts to upload.
          </p>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium",
            paid
              ? "bg-success/15 text-success border-success/25"
              : awaiting
                ? "bg-info/15 text-info border-info/25"
                : failed
                  ? "bg-destructive/15 text-destructive border-destructive/25"
                  : "bg-warning/15 text-warning border-warning/25"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Charge breakdown: budget + platform fee + payment fee = total */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        {loading && !display ? (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            Loading payment details...
          </div>
        ) : display ? (
          <>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Campaign budget</dt>
                <dd className="font-medium text-foreground">
                  TZS {formatTZS(display.budget)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">
                  Platform fee ({display.platformFeeRate}%)
                </dt>
                <dd className="font-medium text-foreground">
                  TZS {formatTZS(display.platformFee)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">
                  Payment processing fee ({display.providerFeeRate}%)
                </dt>
                <dd className="font-medium text-foreground">
                  TZS {formatTZS(display.providerFee)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border pt-2.5">
                <dt className="font-medium text-foreground">Total</dt>
                <dd className="text-base font-semibold text-foreground">
                  TZS {formatTZS(display.totalCharge)}
                </dd>
              </div>
            </dl>

            {intent?.actualProviderFee != null &&
              intent.actualProviderFee !== display.providerFee && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Actual processing fee charged: TZS{" "}
                  {formatTZS(intent.actualProviderFee)}
                </p>
              )}
          </>
        ) : (
          <p className="py-2 text-xs text-muted-foreground">
            Payment details unavailable.
          </p>
        )}
      </div>

      {/* Action / status */}
      <div className="mt-4 border-t border-border pt-4">
        {paid ? (
          <div className="flex items-start gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Payment confirmed</p>
              <p className="text-xs text-success/80">
                {intent?.createdAt
                  ? `Received on ${formatDate(intent.createdAt)}.`
                  : "Your payment for this campaign has been received."}
              </p>
            </div>
          </div>
        ) : awaiting ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-2xl border border-info/25 bg-info/10 px-4 py-3 text-sm text-info">
              <Loader2Icon className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
              <div>
                <p className="font-medium">Waiting for your authorization</p>
                <p className="text-xs text-info/80">
                  {instructions?.message ??
                    "Approve the USSD prompt on your phone to complete the payment."}
                </p>
                {intent?.customerPhone && (
                  <p className="mt-1 font-mono text-xs text-info/80">
                    {intent.customerPhone}
                  </p>
                )}
                {instructions?.reference && (
                  <p className="mt-1 font-mono text-[11px] text-info/60">
                    Ref {instructions.reference}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => void refresh()}
              variant="ghost"
              className="cursor-pointer rounded-xl text-xs"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Check status
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {failed && (
              <div className="flex items-start gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Payment not completed</p>
                  <p className="text-xs text-destructive/80">
                    {intent?.failureReason ||
                      "The authorization was not completed in time. You can try again."}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                {failed
                  ? "Start a new payment attempt."
                  : "Pay the total above by mobile money."}
              </p>
              <Button
                onClick={() => {
                  setError(null);
                  setOpen(true);
                }}
                disabled={!canPay || !display}
                className="shrink-0 cursor-pointer bg-primary font-medium text-primary-foreground hover:bg-primary/90 p-2"
                style={{ borderRadius: 14 }}
              >
                {failed ? "Try Again" : "Pay Now"}
              </Button>
            </div>
          </div>
        )}

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Payments are processed by Snippe and confirmed automatically — no admin
          approval needed.
        </p>
      </div>

      {/* Start payment dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl p-2">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Pay TZS {display ? formatTZS(display.totalCharge) : "—"}
            </DialogTitle>
            <DialogDescription>
              Confirm the mobile money number to charge for &quot;{campaignName}&quot;.
              We&apos;ll send a USSD prompt — approve it with your PIN.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Mobile money number <span className="text-destructive">*</span>
              </label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712 345 678"
                inputMode="tel"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  First name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Last name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@company.co.tz"
                className="h-12 rounded-xl"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4 sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={starting}
              className="cursor-pointer rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={startPayment}
              disabled={
                starting ||
                !phoneNumber.trim() ||
                !firstName.trim() ||
                !lastName.trim() ||
                !email.trim()
              }
              className="w-full cursor-pointer rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
            >
              {starting ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Send USSD prompt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}