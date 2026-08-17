// components/payment-method-display.tsx
//
// Single source of truth for how payment methods are rendered across the UI.
// Logos live in /public/payments. This is display-only: the stored method
// string is never modified here, so the backend keeps receiving exactly what
// it receives today.

import Image from "next/image";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

// Maps every known payment-method value to its human-readable label and logo.
// Unknown/unlisted values fall back to the raw string plus a generic icon.
export const PAYMENT_METHOD_META: Record<
  string,
  { label: string; image?: string }
> = {
  "M-PESA": { label: "M-Pesa", image: "/payments/mpesa.png" },
  "M-Pesa": { label: "M-Pesa", image: "/payments/mpesa.png" },
  MPESA: { label: "M-Pesa", image: "/payments/mpesa.png" },
  "Airtel Money": {
    label: "Airtel Money",
    image: "/payments/airtelMoney.png",
  },
  "Tigo Pesa": { label: "Tigo Pesa", image: "/payments/tigoPesa.jpeg" },
  HaloPesa: { label: "HaloPesa", image: "/payments/halopesa.png" },
};

export function getPaymentMethodMeta(method?: string | null): {
  label: string;
  image?: string;
} | null {
  if (!method) return null;
  return PAYMENT_METHOD_META[method] ?? { label: method };
}

const LOGO_CLASS = {
  sm: "h-5 w-8",
  md: "h-6 w-9",
  lg: "h-10 w-16",
} as const;

const FALLBACK_BOX_CLASS = {
  sm: "size-5 rounded",
  md: "size-6 rounded-md",
  lg: "size-9 rounded-lg",
} as const;

const FALLBACK_ICON_CLASS = {
  sm: "size-3",
  md: "size-3.5",
  lg: "size-4",
} as const;

const TEXT_CLASS = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm font-medium",
} as const;

export function PaymentMethodDisplay({
  method,
  size = "md",
  showLabel = true,
  className,
}: {
  method?: string | null;
  size?: keyof typeof LOGO_CLASS;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = getPaymentMethodMeta(method);
  if (!meta) return null;

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      title={meta.label}
    >
      {meta.image ? (
        <Image
          src={meta.image}
          alt={`${meta.label} logo`}
          width={64}
          height={40}
          className={cn("object-contain", LOGO_CLASS[size])}
        />
      ) : (
        <span
          className={cn(
            "flex items-center justify-center bg-muted text-muted-foreground",
            FALLBACK_BOX_CLASS[size]
          )}
        >
          <Landmark className={FALLBACK_ICON_CLASS[size]} />
        </span>
      )}
      {showLabel && (
        <span className={cn("text-foreground", TEXT_CLASS[size])}>
          {meta.label}
        </span>
      )}
    </span>
  );
}
