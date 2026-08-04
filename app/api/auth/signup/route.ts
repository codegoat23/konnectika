import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signToken, FIRST_STEP_BY_ROLE } from "@/lib/auth";

const VALID_ROLES = ["CREATOR", "BRAND"] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const role = typeof body?.role === "string" ? body.role : "";

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    // auto-create profile
    if (role === "CREATOR") {
      const displayName =
        typeof body.name === "string" && body.name.trim()
          ? body.name.trim()
          : null;

      await prisma.creatorProfile.create({
        data: { userId: user.id, displayName },
      });
    }

    if (role === "BRAND") {
      await prisma.businessProfile.create({
        data: { userId: user.id },
      });
    }

    // 🔐 Authenticate the user immediately by setting the session cookie
    const token = await signToken({
      userId: user.id,
      role: user.role,
      onboardingStep: user.onboardingStep,
      onboardingDone: user.onboardingDone,
      type: "access",
    });

    // New users always complete onboarding first.
    const redirect = FIRST_STEP_BY_ROLE[user.role] ?? "/onboarding";

    const response = NextResponse.json({
      message: "User created successfully",
      redirectTo: redirect,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("SIGNUP ERROR:", err);

    return NextResponse.json(
      {
        error: "Server error",
        details:
          err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
