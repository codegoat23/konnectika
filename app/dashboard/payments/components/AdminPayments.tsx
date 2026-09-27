"use client";

import { useEffect, useState } from "react";
import { OverviewHeader } from "@/app/dashboard/balance/components/Overviewheader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PaymentMethodDisplay } from "@/components/payment-method-display";
import { formatTZS } from "@/lib/utils";
import {
  CheckCircle2,
  Eye,
  Landmark,
  Loader2Icon,
  PlusIcon,
  ShieldCheck,
  Smartphone,
  Trash2,
  XCircle,
} from "lucide-react";

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

type PendingProof = {
  id: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  proofUrl: string | null;
  note: string | null;
  status: "PROOF_SUBMITTED";
  createdAt: string;
  campaign: {
    id: string;
    name: string;
    totalCharge: number;
    paymentStatus: string;
    businessProfile: { companyName: string | null };
  };
  submittedBy: { email: string } | null;
};

type AccountFormState = {
  id: string | null;
  type: "MOBILE_MONEY" | "BANK";
  provider: string;
  accountName: string;
  phone: string;
  accountNumber: string;
  branchDetail: string;
  extraDetails: string;
  isActive: boolean;
};

const EMPTY_ACCOUNT: AccountFormState = {
  id: null,
  type: "MOBILE_MONEY",
  provider: "",
  accountName: "",
  phone: "",
  accountNumber: "",
  branchDetail: "",
  extraDetails: "",
  isActive: true,
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminPayments() {
  const [accounts, setAccounts] = useState<ReceivingAccount[]>([]);
  const [proofs, setProofs] = useState<PendingProof[]>([]);
  const [loading, setLoading] = useState(true);

  // Account form
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormState>(EMPTY_ACCOUNT);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Proof review
  const [reviewing, setReviewing] = useState<PendingProof | null>(null);
  const [reviewAction, setReviewAction] = useState<"VERIFY" | "REJECT">("VERIFY");
  const [reason, setReason] = useState("");
  const [reviewingLoading, setReviewingLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [accountsRes, proofsRes] = await Promise.all([
        fetch("/api/payment-receiving-accounts"),
        fetch("/api/admin/payment-proofs"),
      ]);
      if (!accountsRes.ok) return;
      if (!proofsRes.ok) return;
      const accountsData = await accountsRes.json().catch(() => ({ accounts: [] }));
      const proofsData = await proofsRes.json().catch(() => ({ proofs: [] }));
      setAccounts(accountsData.accounts ?? []);
      setProofs(proofsData.proofs ?? []);
    } catch {
      setAccounts([]);
      setProofs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [accountsRes, proofsRes] = await Promise.all([
          fetch("/api/payment-receiving-accounts"),
          fetch("/api/admin/payment-proofs"),
        ]);
        const accountsData = await accountsRes
          .json()
          .catch(() => ({ accounts: [] }));
        const proofsData = await proofsRes.json().catch(() => ({ proofs: [] }));
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
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setAccountForm(EMPTY_ACCOUNT);
    setAccountError(null);
    setAccountDialogOpen(true);
  };

  const openEdit = (account: ReceivingAccount) => {
    setAccountForm({
      id: account.id,
      type: account.type,
      provider: account.provider,
      accountName: account.accountName,
      phone: account.phone ?? "",
      accountNumber: account.accountNumber ?? "",
      branchDetail: account.branchDetail ?? "",
      extraDetails: account.extraDetails ?? "",
      isActive: account.isActive,
    });
    setAccountError(null);
    setAccountDialogOpen(true);
  };

  const saveAccount = async () => {
    setSavingAccount(true);
    setAccountError(null);
    try {
      const res = await fetch("/api/payment-receiving-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountForm),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAccountError(data?.error ?? "Failed to save account.");
        setSavingAccount(false);
        return;
      }
      setAccountDialogOpen(false);
      setSavingAccount(false);
      await load();
    } catch {
      setAccountError("Something went wrong. Please try again.");
      setSavingAccount(false);
    }
  };

  const toggleActive = async (account: ReceivingAccount) => {
    try {
      const res = await fetch(`/api/payment-receiving-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      if (!res.ok) return;
      await load();
    } catch {
      /* ignore */
    }
  };

  const deleteAccount = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/payment-receiving-accounts/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  const openReview = (proof: PendingProof, action: "VERIFY" | "REJECT") => {
    setReviewing(proof);
    setReviewAction(action);
    setReason("");
    setReviewError(null);
  };

  const submitReview = async () => {
    if (!reviewing) return;
    setReviewingLoading(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/admin/payment-proofs/${reviewing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewAction,
          rejectionReason:
            reviewAction === "REJECT" ? reason.trim() : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setReviewError(data?.error ?? "Failed to update. Please try again.");
        setReviewingLoading(false);
        return;
      }
      setReviewing(null);
      setReviewingLoading(false);
      await load();
    } catch {
      setReviewError("Something went wrong. Please try again.");
      setReviewingLoading(false);
    }
  };

  const mobileCount = accounts.filter((a) => a.type === "MOBILE_MONEY" && a.isActive).length;
  const bankCount = accounts.filter((a) => a.type === "BANK" && a.isActive).length;

  return (
    <div className="space-y-6">
      <OverviewHeader title="Payments" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 sm:grid-cols-3">
        <Card className="rounded-2xl bg-orange-500 p-4 text-white shadow-xs gap-2">
          <div className="text-xs font-medium">Pending Proofs</div>
          <div className="mt-2 text-xl font-semibold tabular-nums">
            {proofs.length}
          </div>
          <div className="text-[11px] text-white/80">
            Brand payments awaiting verification
          </div>
        </Card>
        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Active Mobile Money Accounts
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">{mobileCount}</div>
          <div className="text-[11px] text-muted-foreground">
            Brands pay to these numbers
          </div>
        </Card>
        <Card className="rounded-2xl bg-card p-4 shadow-xs gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            Active Bank Accounts
          </div>
          <div className="mt-2 text-xl font-semibold tabular-nums">{bankCount}</div>
          <div className="text-[11px] text-muted-foreground">
            For Bank Transfer payments
          </div>
        </Card>
      </div>

      {/* Receiving accounts */}
      <div className="px-4 lg:px-6">
        <Card className="rounded-[24px] border border-border bg-card p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                <ShieldCheck className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Incoming Payment Accounts
                </h2>
                <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                  These are Konnectika&apos;s numbers / banks that brands see when
                  paying their campaign fee. Only active accounts are shown to
                  brands — never hardcode these.
                </p>
              </div>
            </div>

            <Button
              onClick={openCreate}
              className="h-9 shrink-0 rounded-xl bg-orange-500 px-3 text-xs font-medium text-white hover:bg-orange-600"
            >
              <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
              Add Account
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              Loading accounts...
            </div>
          ) : accounts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No receiving accounts configured yet. Add one so brands can pay.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-border bg-background/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {account.type === "BANK" ? (
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {account.provider}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          account.isActive
                            ? "bg-success/15 text-success border-success/25"
                            : "bg-muted/50 text-muted-foreground border-border"
                        }`}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(account)}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(account)}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
                      >
                        {account.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteAccount(account.id)}
                        disabled={deletingId === account.id}
                        className="rounded-lg border border-destructive/25 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {deletingId === account.id ? (
                          <Loader2Icon className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <dl className="mt-3 space-y-1.5 text-sm">
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
                    {[account.branchDetail, account.extraDetails]
                      .filter(Boolean)
                      .join(" · ") && (
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Details</dt>
                        <dd className="text-right text-xs text-muted-foreground">
                          {[account.branchDetail, account.extraDetails]
                            .filter(Boolean)
                            .join(" · ")}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Pending proofs */}
      <div className="px-4 lg:px-6">
        <Card className="rounded-[24px] border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Payment Proofs Awaiting Verification
            </h2>
            <span className="rounded-lg bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {proofs.length}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              Loading proofs...
            </div>
          ) : proofs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No proofs awaiting verification. You&apos;re all caught up.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="rounded-2xl border border-border bg-muted/30 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <PaymentMethodDisplay method={proof.paymentMethod} size="sm" />
                      <span className="truncate font-medium text-foreground">
                        {proof.campaign?.name ?? "Campaign"}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        TZS {formatTZS(proof.amount)}
                      </span>
                    </div>

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
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Brand:{" "}
                      {proof.campaign?.businessProfile?.companyName ?? "—"}
                    </span>
                    <span>Ref: {proof.transactionReference}</span>
                    <span>Submitted: {formatDate(proof.createdAt)}</span>
                    {proof.submittedBy?.email && (
                      <span>{proof.submittedBy.email}</span>
                    )}
                    {proof.proofUrl && (
                      <a
                        href={proof.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View receipt
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Account create/edit dialog */}
      <Dialog
        open={accountDialogOpen}
        onOpenChange={(o) => !o && setAccountDialogOpen(false)}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl p-2">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {accountForm.id ? "Edit Receiving Account" : "Add Receiving Account"}
            </DialogTitle>
            <DialogDescription>
              Brands see these details when paying their campaign fee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              <Select
                value={accountForm.type}
                onValueChange={(v) =>
                  setAccountForm({
                    ...accountForm,
                    type: v as "MOBILE_MONEY" | "BANK",
                  })
                }
              >
                <SelectTrigger className="min-h-12 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl p-3">
                  <SelectItem value="MOBILE_MONEY" className="rounded-lg py-2">
                    Mobile Money
                  </SelectItem>
                  <SelectItem value="BANK" className="rounded-lg py-2">
                    Bank Account
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Provider / bank */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {accountForm.type === "BANK" ? "Bank name" : "Provider / Network"}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                value={accountForm.provider}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, provider: e.target.value })
                }
                placeholder={
                  accountForm.type === "BANK"
                    ? "e.g. NMB, CRDB"
                    : "e.g. M-PESA, Airtel Money, Tigo Pesa, HaloPesa"
                }
                className="h-12 rounded-xl"
              />
            </div>

            {/* Account name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Account name <span className="text-destructive">*</span>
              </label>
              <Input
                value={accountForm.accountName}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, accountName: e.target.value })
                }
                placeholder="Name on the account"
                className="h-12 rounded-xl"
              />
            </div>

            {/* Mobile phone */}
            {accountForm.type === "MOBILE_MONEY" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Receiving phone <span className="text-destructive">*</span>
                </label>
                <Input
                  value={accountForm.phone}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, phone: e.target.value })
                  }
                  placeholder="0712 345 678"
                  className="h-12 rounded-xl"
                />
              </div>
            )}

            {/* Bank account number */}
            {accountForm.type === "BANK" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Account number <span className="text-destructive">*</span>
                </label>
                <Input
                  value={accountForm.accountNumber}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      accountNumber: e.target.value,
                    })
                  }
                  placeholder="Account number"
                  className="h-12 rounded-xl"
                />
              </div>
            )}

            {/* Optional details */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Branch / reference{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                value={accountForm.branchDetail}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    branchDetail: e.target.value,
                  })
                }
                placeholder="e.g. Branch name or payment reference"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Extra details{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                value={accountForm.extraDetails}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    extraDetails: e.target.value,
                  })
                }
                rows={2}
                placeholder="Anything brands must know"
                className="rounded-xl"
              />
            </div>

            {/* Active toggle */}
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={accountForm.isActive}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    isActive: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-border"
              />
              Active (visible to brands)
            </label>

            {accountError && (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
                {accountError}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4 sm:justify-between">
            <DialogClose asChild>
              <Button variant="ghost" className="cursor-pointer rounded-xl" disabled={savingAccount}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={saveAccount}
              disabled={
                savingAccount ||
                !accountForm.provider.trim() ||
                !accountForm.accountName.trim() ||
                (accountForm.type === "MOBILE_MONEY"
                  ? !accountForm.phone.trim()
                  : !accountForm.accountNumber.trim())
              }
              className="w-full cursor-pointer rounded-xl bg-orange-500 text-white hover:bg-orange-600 sm:w-auto"
            >
              {savingAccount ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof review dialog */}
      <Dialog
        open={reviewing !== null}
        onOpenChange={(o) => !o && setReviewing(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            {reviewAction === "VERIFY" ? (
              <CheckCircle2 className="h-10 w-10 text-success" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive" />
            )}
            <DialogTitle className="text-lg font-semibold">
              {reviewAction === "VERIFY"
                ? "Verify Payment Proof?"
                : "Reject Payment Proof?"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "VERIFY"
                ? "The campaign will be marked paid and the platform fee revenue recorded as received."
                : "The campaign will return to Unpaid and the brand will be notified."}
            </DialogDescription>
          </DialogHeader>

          {reviewAction === "REJECT" && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Reason <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. transaction not found, amount mismatch"
                rows={3}
                className="rounded-xl"
              />
            </div>
          )}

          {reviewError && (
            <p className="text-sm text-destructive">{reviewError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewing(null)}
              disabled={reviewingLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={
                reviewingLoading ||
                (reviewAction === "REJECT" && !reason.trim())
              }
              className={
                reviewAction === "VERIFY"
                  ? "bg-success text-success-foreground hover:bg-success/90"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {reviewingLoading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : reviewAction === "VERIFY" ? (
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