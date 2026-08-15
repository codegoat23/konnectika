// app/api/submissions/[id]/route.ts
//
// GET   /api/submissions/:id  -> fetch one submission (role-checked)
// PATCH /api/submissions/:id  -> brand/admin reviews it
//        (approve / request changes / reject)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { z } from "zod";
import {
  approveContentForEarning,
  rejectContentForEarning,
} from "@/lib/payment-flow";
import { NotifyAdmin } from "@/lib/notification";

async function loadSubmissionWithAccessCheck(
  id: string,
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>
) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          displayName: true,
          username: true,
          userId: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
          businessProfileId: true,
          paymentRate: true,
        },
      },
      application: true,
    },
  });

  if (!submission) {
    return {
      submission: null,
      allowed: false,
    };
  }

  if (user.role === "ADMIN") {
    return {
      submission,
      allowed: true,
    };
  }

  if (user.role === "CREATOR") {
    return {
      submission,
      allowed: submission.creatorId === user.creatorProfileId,
    };
  }

  if (user.role === "BRAND") {
    return {
      submission,
      allowed:
        submission.campaign.businessProfileId === user.businessProfileId,
    };
  }

  return {
    submission,
    allowed: false,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { submission, allowed } =
    await loadSubmissionWithAccessCheck(id, user);

  if (!submission) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json({ submission });
}

const reviewSchema = z.object({
  status: z.enum([
    "UNDER_REVIEW",
    "APPROVED",
    "CHANGES_REQUESTED",
    "REJECTED",
  ]),
  reviewNote: z.string().max(2000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  if (user.role !== "BRAND" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only brands or admins can review submissions" },
      { status: 403 }
    );
  }

  const { submission, allowed } =
    await loadSubmissionWithAccessCheck(id, user);

  if (!submission) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);

  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid review data",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  let contentApproved = false;
  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: {
        id,
      },
      data: {
        status: parsed.data.status,
        reviewNote: parsed.data.reviewNote,
        reviewedAt: new Date(),
        reviewedBy: user.id,
      },
      include: {
        creator: true,
        campaign: true,
        application: true,
      },
    });

    // Content approved -> the earning (created at application approval) flips
    // PENDING -> APPROVED and the platform CREATOR_FEE is recorded. The money
    // itself is settled later through the scheduled payout flow. Atomic +
    // idempotent: re-approving already-approved content re-runs cleanly.
    if (parsed.data.status === "APPROVED") {
      const result = await approveContentForEarning(tx, {
        submissionId: updated.id,
        applicationId: updated.applicationId,
        creatorId: updated.creatorId,
        campaignId: updated.campaignId,
        paymentRate: updated.campaign.paymentRate,
      });
      contentApproved = result.contentApproved;
    }

    // Content rejected -> a PENDING earning flips to REJECTED so it can never
    // be paid. (Approved/paid earnings are left untouched.)
    if (parsed.data.status === "REJECTED") {
      await rejectContentForEarning(tx, updated.applicationId);
    }

    return updated;
  });

  // Approval just makes the creator's earnings eligible for a scheduled
  // payout; the admin settles them in the payout flow. Tell the admins a new
  // creator earning is accruing toward their balance.
  if (contentApproved) {
    await NotifyAdmin({
      title: "Creator Content Approved",
      message: `A submission for "${updated.campaign.name}" was approved. The creator's earnings will now accrue toward their scheduled payout.`,
      type: "INFO",
    });
  }

  return NextResponse.json({
    submission: updated,
  });
}