import { getAuthUser } from "@/lib/auth";
import {
  getBrandFeePercent,
  getCreatorFeePercent,
} from "@/lib/pricing";

// Exposes the current platform fee config so client forms can render a live
// payment summary. The backend remains the single source of truth — final
// amounts are always recomputed server-side via lib/pricing.ts at write time.
export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({
    brandFeePercent: getBrandFeePercent(),
    creatorFeePercent: getCreatorFeePercent(),
  });
}
