import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { issueOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: authUser.userId },
      select: { phone: true },
    });

    if (!creatorProfile?.phone) {
      return NextResponse.json(
        { error: "No phone number saved yet" },
        { status: 400 }
      );
    }

    const otp = await issueOtp(creatorProfile.phone);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Resent OTP for ${creatorProfile.phone}: ${otp}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("RESEND OTP ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
