import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

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
      creator: { select: { userId: true } },
      campaign: {
        select: {
          name: true,
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

  const updated = await prisma.campaignApplication.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  // Notify the creator about their application status.
  if (parsed.data.status === "APPROVED" || parsed.data.status === "REJECTED") {
    await prisma.notification.create({
      data: {
        userId: application.creator.userId,
        title:
          parsed.data.status === "APPROVED"
            ? "Application Approved"
            : "Application Rejected",
        message: `Your application for "${application.campaign.name}" was ${
          parsed.data.status === "APPROVED" ? "approved" : "rejected"
        }.`,
        type: parsed.data.status === "APPROVED" ? "SUCCESS" : "WARNING",
      },
    });
  }

  return NextResponse.json(updated);
}
