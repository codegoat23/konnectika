// app/api/platform/pricing/route.ts
//
// GET  -> the effective fee configuration, so client forms can render a live
//         payment summary. Reads the admin overrides first, then env, then
//         defaults (see lib/pricing.ts).
// PATCH -> admin-only. Persists a new fee percentage.
//
// Amounts are always recomputed server-side at write time from these values and
// snapshotted onto the transaction, so changing a percentage only affects NEW
// payments and payouts — existing records keep the rates they were created with.

import { getAuthUser } from "@/lib/auth";
import {
  getPlatformPricing,
  updatePlatformPricing,
  type PlatformPricing,
} from "@/lib/pricing";

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(await getPlatformPricing());
}

/** Which percentages an admin may change. All optional; omitted keys are kept. */
function parsePricingInput(body: unknown): Partial<PlatformPricing> {
  const raw = (body ?? {}) as Record<string, unknown>;
  const out: Partial<PlatformPricing> = {};

  for (const key of [
    "brandFeePercent",
    "creatorFeePercent",
    "snippeCollectionFeePercent",
  ] as const) {
    const value = raw[key];
    if (value === undefined || value === null || value === "") continue;

    // Reject junk loudly rather than silently falling back to a default — a
    // mistyped "ten" must not look like a successful save.
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) {
      throw new Error(`${key} must be a number.`);
    }
    out[key] = n;
  }

  return out;
}

export async function PATCH(req: Request) {
  const user = await getAuthUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return Response.json(
      { error: "Forbidden: only admins can change platform pricing" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);

  let input: Partial<PlatformPricing>;
  try {
    input = parsePricingInput(body);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid input" },
      { status: 400 }
    );
  }

  if (Object.keys(input).length === 0) {
    return Response.json(
      { error: "Provide at least one fee percentage to update." },
      { status: 400 }
    );
  }

  const result = await updatePlatformPricing(input);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json(result.pricing);
}