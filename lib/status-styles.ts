export const EARNING_STATUS_STYLES: Record<string, string> = {
  PENDING:
    "bg-warning/15 text-warning border-warning/25",

  APPROVED:
    "bg-info/15 text-info border-info/25",

  AVAILABLE:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",

  PAID:
    "bg-success/15 text-success border-success/25",

  REJECTED:
    "bg-destructive/15 text-destructive border-destructive/25",
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