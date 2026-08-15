import { formatTZS } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type PaymentBreakdownProps = {
  budget: number;
  feeRate: number;
  fee: number;
  total: number;
  paymentStatus?: "UNPAID" | "PAID" | null;
  title?: string;
  showStatus?: boolean;
  showNote?: boolean;
  className?: string;
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  UNPAID: "bg-warning/15 text-warning border-warning/25",
  PAID: "bg-success/15 text-success border-success/25",
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
  className,
}: PaymentBreakdownProps) {
  return (
    <div
      className={cn("bg-card border border-border p-5", className)}
      style={{ borderRadius: 24 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-semibold">{title}</h3>

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
          <span className="text-muted-foreground">Campaign Budget</span>
          <span className="text-foreground font-medium">
            TZS {formatTZS(budget)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            Platform Fee ({feeRate}%)
          </span>
          <span className="text-muted-foreground">
            TZS {formatTZS(fee)}
          </span>
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <span className="text-foreground font-medium">
            Total Payment Required
          </span>
          <span className="text-foreground font-semibold">
            TZS {formatTZS(total)}
          </span>
        </div>
      </div>

      {showNote && (
        <p className="mt-4 text-xs text-muted-foreground">
          Payments are handled manually. Your campaign will be created as{" "}
          <span className="font-medium text-warning">Unpaid</span> and becomes active
          once an admin confirms payment.
        </p>
      )}
    </div>
  );
}
