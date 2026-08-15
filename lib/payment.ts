// lib/payment.ts
//
// Shared payment configuration and helpers used by BOTH sides of the money
// flow — creators receiving payouts and brands paying for campaigns.
// Mobile-money methods require a phone number to receive/send the money, and
// that requirement is validated in one place.

export const PAYMENT_METHODS = [
  "M-PESA",
  "Airtel Money",
  "Tigo Pesa",
  "Bank Transfer",
  "Other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Methods that need a phone number to complete the payment.
export const MOBILE_MONEY_METHODS: readonly string[] = [
  "M-PESA",
  "Airtel Money",
  "Tigo Pesa",
];

export function isMobileMoneyMethod(method?: string | null): boolean {
  if (!method) return false;
  return MOBILE_MONEY_METHODS.includes(method);
}

// Normalize a Tanzanian phone number to the +255… form, or return null when
// it does not look like one (07XXXXXXXX / 07XX XXX XXX / +2557XXXXXXXX …).
export function normalizePhoneNumber(raw?: string | null): string | null {
  if (!raw) return null;

  const digits = raw.replace(/[\s\-().]/g, "");
  let normalized: string;

  if (/^0[67]\d{8}$/.test(digits)) {
    normalized = `+255${digits.slice(1)}`;
  } else if (/^\+255[67]\d{8}$/.test(digits)) {
    normalized = digits;
  } else if (/^255[67]\d{8}$/.test(digits)) {
    normalized = `+${digits}`;
  } else {
    return null;
  }

  return normalized;
}

// Validation used at the API boundary. Returns a human-readable error string
// or null when the phone is acceptable for the chosen method.
export function validatePaymentPhone(
  method: string | null | undefined,
  phone: string | null | undefined
): string | null {
  if (!isMobileMoneyMethod(method)) return null;

  if (!phone?.trim()) {
    return "Please enter the phone number where you want to receive the payment.";
  }

  if (!normalizePhoneNumber(phone)) {
    return "Enter a valid Tanzanian phone number, e.g. 0712 345 678 or +255 712 345 678.";
  }

  return null;
}
