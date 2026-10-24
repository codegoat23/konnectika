import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (user.role !== "CREATOR" || !user.creatorProfileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const application = await prisma.campaignApplication.findUnique({
    where: { id },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          brand: true,
          paymentRate: true,
          description: true,
          contentFormat: true,
          requirements: true,
          thumbnailPic:true,
          platforms:true,
        },
      },
      submission: { select: { id: true, status: true, reviewNote: true } },
    },
  });

  if (!application || application.creatorId !== user.creatorProfileId) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  if (application.status !== "APPROVED") {
    return NextResponse.json(
      { error: "This application isn't approved yet" },
      { status: 400 }
    );
  }

  if (
    application.submission &&
    application.submission.status !== "CHANGES_REQUESTED"
  ) {
    return NextResponse.json(
      { error: "Proof has already been submitted for this campaign" },
      { status: 409 }
    );
  }

  return NextResponse.json({ application });
}