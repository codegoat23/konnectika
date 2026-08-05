// app/api/submissions/[id]/route.ts
//
// GET   /api/submissions/:id  -> fetch one submission (role-checked)
// PATCH /api/submissions/:id  -> brand/admin reviews it
//        (approve / request changes / reject)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { z } from "zod";
import { SETTLEMENT_PERIOD_DAYS, addDays } from "@/lib/wallet";
import { computeCreatorFeeSplit } from "@/lib/pricing";
import { recordCreatorFee } from "@/lib/platform-revenue";

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

    // 💰 CREATE CREATOR EARNING + PLATFORM REVENUE AFTER BRAND APPROVAL
    if (parsed.data.status === "APPROVED") {
      const existingEarning = await tx.earning.findUnique({
        where: {
          submissionId: updated.id,
        },
      });

      if (!existingEarning) {
        const approvedAt = new Date();
        const split = computeCreatorFeeSplit(updated.campaign.paymentRate);

        const earning = await tx.earning.create({
          data: {
            submissionId: updated.id,
            creatorId: updated.creatorId,
            ...split,
            status: "PENDING",
            approvedAt,
            availableAt: addDays(approvedAt, SETTLEMENT_PERIOD_DAYS),
          },
        });

        // Permanent, immutable record of the platform's cut from this earning.
        // Upserts on (earningId, CREATOR_FEE) so retries cannot duplicate it.
        await recordCreatorFee(tx, {
          earningId: earning.id,
          creatorId: earning.creatorId,
          campaignId: updated.campaignId,
          grossAmount: split.amount,
          feeRate: split.platformFeeRate,
          feeAmount: split.platformFee,
        });
      }
    }

    return updated;
  });

  return NextResponse.json({
    submission: updated,
  });
}