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
  DialogTrigger,
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
import { PaymentMethodDisplay } from "@/components/payment-method-display";
import { isMobileMoneyMethod, PAYMENT_METHODS } from "@/lib/payment";
import {
  CheckCircle2,
  Landmark,
  Loader2Icon,
  MapPin,
  Phone,
  PlusIcon,
  Smartphone,
  WalletIcon,
} from "lucide-react";

export type PayoutAccount = {
  id: string;
  method: string;
  phone: string | null;
  accountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
};

export function CreatePayoutAccountDialog({
  account,
  onSaved,
  trigger,
}: {
  account: PayoutAccount | null;
  onSaved: (account: PayoutAccount) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<string>(account?.method ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [accountName, setAccountName] = useState(account?.accountName ?? "");
  const [bankName, setBankName] = useState(account?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(
    account?.accountNumber ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPhone = isMobileMoneyMethod(method);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/payout-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          phone: needsPhone ? phone : null,
          accountName,
          bankName: needsPhone ? null : bankName,
          accountNumber: needsPhone ? null : accountNumber,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to save payout account.");
        setSaving(false);
        return;
      }
      onSaved(data?.payoutAccount ?? {
        id: account?.id ?? "",
        method,
        phone: needsPhone ? phone : null,
        accountName,
        bankName: needsPhone ? null : bankName,
        accountNumber: needsPhone ? null : accountNumber,
      });
      setSaving(false);
      setOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const validMobile = needsPhone && phone.trim();
  const validBank =
    !needsPhone && bankName.trim() && accountNumber.trim();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            className="rounded-xl border-border text-xs font-medium"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Set Payout Account
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl p-2">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {account ? "Edit Payout Account" : "Add Payout Account"}
          </DialogTitle>
          <DialogDescription>
            Where an admin will send your creator payouts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {/* Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Payment method <span className="text-destructive">*</span>
            </label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="min-h-12 w-full rounded-xl">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent className="rounded-xl p-3">
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem
                    key={m}
                    value={m}
                    className="rounded-lg py-2.5"
                  >
                    <PaymentMethodDisplay method={m} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile money: phone */}
          {needsPhone && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Phone number <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-xl pl-10"
                />
              </div>
            </div>
          )}

          {/* Bank details */}
          {!needsPhone && method && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Bank name <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="e.g. NMB, CRDB, TPB"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="h-12 rounded-xl pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Account number <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="h-12 rounded-xl pl-10"
                  />
                </div>
              </div>
            </>
          )}

          {/* Account name (any method) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Account name
            </label>
            <Input
              placeholder="Name on the account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
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
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="cursor-pointer rounded-xl"
              disabled={saving}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={save}
            disabled={
              saving ||
              !method ||
              (needsPhone ? !validMobile : !validBank)
            }
            className="w-full cursor-pointer rounded-xl bg-orange-500 text-white hover:bg-orange-600 sm:w-auto"
          >
            {saving ? (
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
  );
}

export default function PayoutAccountSection({
  setAccount,
}: {
  setAccount?: (account: PayoutAccount | null) => void;
}) {
  const [account, setAccountState] = useState<PayoutAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/payout-account");
        const data = await res.json().catch(() => ({ payoutAccount: null }));
        const loaded = data.payoutAccount ?? null;
        setAccountState(loaded);
        setAccount?.(loaded);
      } catch {
        setAccountState(null);
        setAccount?.(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [setAccount]);

  const onSaved = (next: PayoutAccount) => {
    setAccountState(next);
    setAccount?.(next);
  };

  const needsPhone = account ? isMobileMoneyMethod(account.method) : false;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
            <WalletIcon className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Payout Account
            </p>
            <p className="text-xs text-muted-foreground">
              Where admins send your payouts.
            </p>
          </div>
        </div>

        {!loading && (
          <CreatePayoutAccountDialog
            account={account}
            onSaved={onSaved}
            trigger={
              <Button
                variant="outline"
                size={account ? "sm" : "icon"}
                aria-label={account ? "Edit payout account" : "Add payout account"}
                title={account ? "Edit payout account" : "Add payout account"}
                className={account
                  ? "h-9 shrink-0 rounded-xl border-border px-3 text-xs font-medium"
                  : "size-9 shrink-0 rounded-full border-border"}
              >
                {account ? "Edit" : <PlusIcon className="size-4" />}
              </Button>
            }
          />
        )}
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2Icon className="h-4 w-4 animate-spin" />
          Loading your payout account...
        </div>
      ) : account ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <PaymentMethodDisplay method={account.method} size="sm" />
            {needsPhone ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Smartphone className="h-3.5 w-3.5" />
                {account.phone}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                {account.bankName} · {account.accountNumber}
              </span>
            )}
          </div>
          {account.accountName && (
            <p className="mt-1 text-xs text-muted-foreground">
              {account.accountName}
            </p>
          )}
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-success">
            <CheckCircle2 className="h-3 w-3" />
            Saved
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
          No payout account saved yet. Add one so admins can pay you.
        </div>
      )}
    </div>
  );
}
