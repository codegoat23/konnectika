import { formatTZS } from "@/lib/utils";

export type PaymentBreakdownProps = {
  budget: number;
  feeRate: number;
  fee: number;
  total: number;
  paymentStatus?: "UNPAID" | "PAID" | null;
  title?: string;
  showStatus?: boolean;
  showNote?: boolean;
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  UNPAID:
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

// Shared payment ticket. Rendered with live values in the creation form and
// with the stored snapshot in admin/brand campaign views. Display only — the
// authoritative amounts always come from the backend (lib/pricing.ts).
export default function PaymentBreakdown({
  budget,
  feeRate,
  fee,
  total,
  paymentStatus,
  title = "Payment Summary",
  showStatus = false,
  showNote = true,
}: PaymentBreakdownProps) {
  return (
    <div className="bg-zinc-900 border border-white/10 p-5" style={{ borderRadius: 24 }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{title}</h3>

        {showStatus && paymentStatus && (
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full border ${
              PAYMENT_STATUS_STYLES[paymentStatus]
            }`}
          >
            {paymentStatus === "PAID" ? "Paid" : "Unpaid"}
          </span>
        )}
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Campaign Budget</span>
          <span className="text-white font-medium">
            TZS {formatTZS(budget)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-400">
            Platform Fee ({feeRate}%)
          </span>
          <span className="text-zinc-300">
            TZS {formatTZS(fee)}
          </span>
        </div>

        <div className="h-px bg-white/10" />

        <div className="flex items-center justify-between">
          <span className="text-zinc-200 font-medium">
            Total Payment Required
          </span>
          <span className="text-orange-400 font-semibold">
            TZS {formatTZS(total)}
          </span>
        </div>
      </div>

      {showNote && (
        <p className="mt-4 text-xs text-zinc-500">
          Payments are handled manually. Your campaign will be created as{" "}
          <span className="text-amber-400">Unpaid</span> and becomes active
          once an admin confirms payment.
        </p>
      )}
    </div>
  );
}
