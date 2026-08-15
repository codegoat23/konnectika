// app/dashboard/applicants/components/types.ts
//
// Shared types for the global Applicants page (admin + brand views). A single
// include shape is used by the page's server-side query so both client
// components can share the same payload type.

import type { Prisma } from "@prisma/client";

export const applicantsInclude = {
  creator: { include: { socialAccounts: true } },
  submission: true,
  earning: true,
  campaign: { select: { name: true, status: true } },
} as const;

export type ApplicantApplication = Prisma.CampaignApplicationGetPayload<{
  include: typeof applicantsInclude;
}>;
