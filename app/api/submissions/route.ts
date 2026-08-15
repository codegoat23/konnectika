// app/api/submissions/route.ts
//
// GET  /api/submissions  -> role-aware list
//   - CREATOR: only their own submissions (+ their approved applications
//              that DON'T have a submission yet, so the UI can show
//              "ready to submit" cards)
//   - BRAND:   submissions for campaigns owned by their BusinessProfile,
//              optionally filtered by ?campaignId=
//   - ADMIN:   every submission on the platform
//
// POST /api/submissions  -> creator creates a submission (proof) for
//              one of their APPROVED applications.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const SUBMISSION_STATUSES = [
  "PENDING_REVIEW",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "CHANGES_REQUESTED",
  "REJECTED",
] as const;

function parseStatusFilter(
  status?: string
): Prisma.SubmissionWhereInput["status"] {
  if (status && (SUBMISSION_STATUSES as readonly string[]).includes(status)) {
    return status as Prisma.SubmissionWhereInput["status"];
  }
  return undefined;
}

// ---------- GET ----------
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;
  const status = parseStatusFilter(searchParams.get("status") ?? undefined);

  const baseInclude = {
    creator: {
      select: {
        id: true,
        displayName: true,
        username: true,
        userId: true,
        socialAccounts: {
          select: { platform: true, handle: true, followers: true },
        },
      },
    },
    campaign: {
      select: { id: true, name: true, businessProfileId: true },
    },
    application: {
      select: { id: true, status: true, message: true, createdAt: true },
    },
  } as const;

  // ---- CREATOR: only their own ----
  if (user.role === "CREATOR") {
    if (!user.creatorProfileId) {
      return NextResponse.json({ error: "No creator profile found" }, { status: 403 });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        creatorId: user.creatorProfileId,
        ...(campaignId ? { campaignId } : {}),
        ...(status ? { status } : {}),
      },
      include: baseInclude,
      orderBy: { createdAt: "desc" },
    });

    // Also surface approved applications with no submission yet,
    // so the creator's page can render a "submit proof" action for them.
    const approvedWithoutSubmission = await prisma.campaignApplication.findMany({
      where: {
        creatorId: user.creatorProfileId,
        status: "APPROVED",
        submission: null, // requires the 1-submission-per-application relation
      },
      include: {
        campaign: { select: { id: true, name: true, brand: true, paymentRate: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ submissions, readyToSubmit: approvedWithoutSubmission });
  }

  // ---- BRAND: only campaigns they own ----
  if (user.role === "BRAND") {
    if (!user.businessProfileId) {
      return NextResponse.json({ error: "No business profile found" }, { status: 403 });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        campaign: { businessProfileId: user.businessProfileId },
        ...(campaignId ? { campaignId } : {}),
        ...(status ? { status } : {}),
      },
      include: baseInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ submissions });
  }

  // ---- ADMIN: everything ----
  if (user.role === "ADMIN") {
    const submissions = await prisma.submission.findMany({
      where: {
        ...(campaignId ? { campaignId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        ...baseInclude,
        campaign: {
          select: {
            id: true,
            name: true,
            businessProfile: { select: { companyName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ submissions });
  }

  return NextResponse.json({ error: "Unknown role" }, { status: 403 });
}

// ---------- POST ----------
const createSubmissionSchema = z.object({
  applicationId: z.string().min(1),
  screenshots: z.array(z.string().url()).min(1, "At least one screenshot is required"),
  postLinks: z.array(z.string().url()).min(1, "At least one post link is required"),
  caption: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (user.role !== "CREATOR" || !user.creatorProfileId) {
    return NextResponse.json(
      { error: "Only creators can submit proof" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { applicationId, screenshots, postLinks, caption } = parsed.data;

  // Confirm the application belongs to THIS creator and is APPROVED.
  const application = await prisma.campaignApplication.findUnique({
    where: { id: applicationId },
    include: { submission: true },
  });

  if (!application || application.creatorId !== user.creatorProfileId) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  if (application.status !== "APPROVED") {
    return NextResponse.json(
      { error: "You can only submit proof for an approved application" },
      { status: 400 }
    );
  }

  // --- If you removed the @@unique on applicationId to allow
  // resubmissions after CHANGES_REQUESTED, delete this block. ---
  if (application.submission) {
    return NextResponse.json(
      { error: "A submission already exists for this application" },
      { status: 409 }
    );
  }

  const submission = await prisma.submission.create({
    data: {
      applicationId,
      creatorId: user.creatorProfileId,
      campaignId: application.campaignId,
      screenshots,
      postLinks,
      caption,
      status: "PENDING_REVIEW",
    },
  });

  return NextResponse.json({ submission }, { status: 201 });
}
