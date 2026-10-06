import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const role = body?.role;
  if (role !== "CREATOR" && role !== "BRAND") {
    return NextResponse.json({ error: "Choose Creator or Brand." }, { status: 400 });
  }

  if (user.onboardingStep !== 0) {
    return NextResponse.json(
      { error: "Role selection is only available during new account setup." },
      { status: 409 }
    );
  }

  await prisma.$transaction(async (tx) => {
    if (role === "CREATOR") {
      await tx.businessProfile.deleteMany({ where: { userId: user.userId } });
      await tx.creatorProfile.upsert({
        where: { userId: user.userId },
        update: {},
        create: { userId: user.userId },
      });
    } else {
      await tx.creatorProfile.deleteMany({ where: { userId: user.userId } });
      await tx.businessProfile.upsert({
        where: { userId: user.userId },
        update: {},
        create: { userId: user.userId },
      });
    }

    await tx.user.update({
      where: { id: user.userId },
      data: { role, onboardingStep: 1, onboardingDone: false },
    });
  });

  return NextResponse.json({
    success: true,
    nextStep: role === "CREATOR" ? "/onboarding/username" : "/onboarding/companyname",
  });
}
