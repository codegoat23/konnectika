import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { z } from "zod";
import {
  assertCampaignBudget,
  createEarningForApprovedApplication,
  BusinessRuleError,
} from "@/lib/payment-flow";
import { notify } from "@/lib/notification";
import { getPlatformPricing } from "@/lib/pricing";

const statusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

// PATCH /api/applications/:id/status
// Brand (owner) or Admin reviews a creator's application.
//
//   APPROVED -> the creator's Earning is created (status PENDING) atomically.
//               Idempotent: re-approving never creates a second earning.
//               Budget guard: the campaign cannot exceed budgetTotal/paymentRate.
//   REJECTED -> no earning is created; the application can never be paid.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "BRAND" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only brands or admins can update applications" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await params;

  const application = await prisma.campaignApplication.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      creatorId: true,
      campaignId: true,
      creator: { select: { userId: true } },
      campaign: {
        select: {
          name: true,
          paymentRate: true,
          budgetTotal: true,
          paymentStatus: true,
          businessProfile: { select: { userId: true } },
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  // Brands may only update applications on campaigns they own.
  if (
    user.role === "BRAND" &&
    user.id !== application.campaign.businessProfile.userId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.status === "APPROVED" && application.campaign.paymentStatus !== "PAID") {
    return NextResponse.json(
      { error: "Campaign not funded (payment pending)" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Idempotent: applying the same status again is a no-op.
      if (application.status === parsed.data.status) {
        const existingEarning = await tx.earning.findUnique({
          where: { applicationId: application.id },
        });
        return { application: { ...application, status: application.status }, earning: existingEarning, changed: false };
      }

      if (parsed.data.status === "APPROVED") {
        const budget = await assertCampaignBudget(tx, {
          id: application.campaignId,
          budgetTotal: application.campaign.budgetTotal,
          paymentRate: application.campaign.paymentRate,
        });
        if (!budget.ok) {
          throw new BusinessRuleError(budget.error ?? "Campaign budget exceeded");
        }
      }

      const updated = await tx.campaignApplication.update({
        where: { id },
        data: { status: parsed.data.status },
      });

      let earning = null;
      if (parsed.data.status === "APPROVED") {
        const pricing = await getPlatformPricing();
        earning = await createEarningForApprovedApplication(
          tx,
          {
            applicationId: id,
            campaignId: application.campaignId,
            creatorId: application.creatorId,
            paymentRate: application.campaign.paymentRate,
            creatorFeePercent: pricing.creatorFeePercent,
          },
          new Date()
        );
      }

      return { application: updated, earning, changed: true };
    });

    // Notify the creator about their application status.
    if (result.changed) {
      if (parsed.data.status === "APPROVED" || parsed.data.status === "REJECTED") {
        await notify({
          userId: application.creator.userId,
          title:
            parsed.data.status === "APPROVED"
              ? "Application Approved"
              : "Application Rejected",
          message:
            parsed.data.status === "APPROVED"
              ? `Your application for "${application.campaign.name}" was approved. Submit your content to start earning.`
              : `Your application for "${application.campaign.name}" was rejected.`,
          type: parsed.data.status === "APPROVED" ? "SUCCESS" : "WARNING",
        });
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof BusinessRuleError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
