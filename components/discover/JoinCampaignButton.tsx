import Link from "next/link";
import { ArrowRight, Check, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Server-rendered Join Campaign state. Decided in the page from the auth
 * cookie + application status, then rendered here:
 *  - logged out        -> link to login, preserving the campaign URL
 *  - creator, new      -> link to the apply flow
 *  - creator, applied  -> "Application Submitted" (disabled)
 *  - brand/admin       -> blocked, brands cannot apply as creators
 *  - closed            -> "Campaign Closed" (disabled)
 */
export type CampaignCta =
  | { type: "login"; href: string }
  | { type: "join"; href: string }
  | { type: "applied" }
  | { type: "brand" }
  | { type: "closed" };

export function JoinCampaignButton({ cta }: { cta: CampaignCta }) {
  if (cta.type === "login" || cta.type === "join") {
    return (
      <Button   className="bg-white text-zinc-900 p-6 rounded-full ">
        <Link href={cta.href} className="flex items-center gap-2 font-regular text-lg">
          Join Campaign
          
        </Link>
      </Button>
    );
  }

  if (cta.type === "applied") {
    return (
      <Button size="lg" variant="secondary" disabled className="cursor-default">
        <Check className="size-4 text-emerald-500" />
        Application Submitted
      </Button>
    );
  }

  if (cta.type === "brand") {
    return (
      <Button
        size="lg"
        variant="outline"
        disabled
        className="cursor-not-allowed p-6 rounded-[24]"
        title="Brand accounts cannot apply to campaigns as creators"
      >
        Brand accounts can&apos;t apply
      </Button>
    );
  }

  return (
    <Button size="lg" variant="secondary" disabled className="cursor-default">
      <LockKeyhole className="size-4" />
      Campaign Closed
    </Button>
  );
}
