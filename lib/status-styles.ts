import { Check, CheckCheck, Clock3, DollarSign, Dot, X } from "lucide-react";

export const EARNING_STATUS_STYLES: Record<string, string> = {
  PENDING:
    " text-warning ",

  APPROVED:
    " text-info ",

  AVAILABLE:
    " text-orange-700",

  PAID:
    " text-success ",

  REJECTED:
    " text-destructive ",
};

export const EARNING_STATUS_DOT: Record<string, string> = {
  PENDING:
    "bg-warning",

  APPROVED:
    "bg-info",

  AVAILABLE:
    "bg-orange-500 dark:bg-orange-400",

  PAID:
    "bg-success",

  REJECTED:
    "bg-destructive",
};

export const PAYOUT_STATUS_STYLES: Record<string, string> = {
  PENDING:
    "bg-warning/15 text-warning border-warning/25",

  APPROVED:
    "bg-info/15 text-info border-info/25",

  PAID:
    "bg-success/15 text-success border-success/25",

  REJECTED:
    "bg-destructive/15 text-destructive border-destructive/25",
};

export const EARNING_STATUS_ICONS = {
  PENDING: Clock3,
  APPROVED: Check,
  AVAILABLE: DollarSign,
  PAID: CheckCheck,
  REJECTED: X,
};