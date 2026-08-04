// app/api/auth/login/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { isSafeRedirect, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, redirectTo } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // 🔐 Create JWT
    const token = await signToken({
      userId: user.id,
      role: user.role,
      onboardingStep: user.onboardingStep,
      onboardingDone: user.onboardingDone,
      type: "access",
    });

    // 🎯 Smart redirect logic
    let redirect = "/dashboard";

    if (!user.onboardingDone) {
      // /onboarding index page routes users to their correct step
      redirect = "/onboarding";
    } else if (redirectTo) {
      // sanitize: only allow safe local paths
      redirect = isSafeRedirect(redirectTo) ?? "/dashboard";
    }

    const response = NextResponse.json({
      message: "Login successful",
      redirectTo: redirect,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    // 🍪 set cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}