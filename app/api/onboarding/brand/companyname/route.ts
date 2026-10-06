import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { companyName } = await req.json();

    if (!companyName || companyName.trim().length < 3) {
      return NextResponse.json(
        { error: "Company name must be at least 3 characters" },
        { status: 400 }
      );
    }


    const existing = await prisma.businessProfile.findUnique({
      where: {
        companyName: companyName.trim(),
      },
    });


    if (existing) {
      return NextResponse.json(
        { error: "Company name already taken" },
        { status: 409 }
      );
    }


    // Update business profile
    await prisma.businessProfile.update({
      where: {
        userId: authUser.userId,
      },
      data: {
        companyName: companyName.trim(),
      },
    });


    // Update onboarding progress
    await prisma.user.update({
      where: {
        id: authUser.userId,
      },
      data: {
        onboardingStep: 2,
      },
    });


    const response = NextResponse.json({
      success: true,
      nextStep: "/onboarding/companydetails",
    });

    return response;


  } catch (error) {
    console.error("COMPANY NAME ERROR:", error);

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}