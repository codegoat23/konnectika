import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const PUBLIC_PATHS = ["/", "/login", "/signup"];

type Role = "CREATOR" | "BRAND";

type OnboardingStep = 1 | 2 | 3 | 4;

const ONBOARDING_ROUTES: Record<
  Role,
  Record<OnboardingStep, string>
> = {
  CREATOR: {
    1: "/onboarding/username",
    2: "/onboarding/socials",
    3: "/onboarding/phone",
    4: "/onboarding/otp",
  },

  BRAND: {
    1: "/onboarding/companyname",
    2: "/onboarding/brand-socials",
    3: "/onboarding/brand-details",
    4: "/onboarding/welcome",
  },
};


function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}


function isValidStep(step: number): step is OnboardingStep {
  return step >= 1 && step <= 4;
}


export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("token")?.value;

  const isLogin = pathname.startsWith("/login");
  const isSignup = pathname.startsWith("/signup");
  const isOnboarding = pathname.startsWith("/onboarding");


  // Logged-in users should not access login/signup
  if (token && (isLogin || isSignup)) {
    return NextResponse.redirect(
      new URL("/dashboard", req.url)
    );
  }


  // Allow public pages
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }


  // Protected routes need authentication
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);

    return NextResponse.redirect(url);
  }


  try {
    const { payload } = await jwtVerify(
      token,
      JWT_SECRET
    );


    const role = payload.role as Role;

    const onboardingDone = Boolean(
      payload.onboardingDone
    );


    const rawStep = Number(
      payload.onboardingStep ?? 1
    );


    const onboardingStep: OnboardingStep =
      isValidStep(rawStep)
        ? rawStep
        : 1;


    // If onboarding completed, block onboarding pages
    if (
      onboardingDone &&
      isOnboarding
    ) {
      return NextResponse.redirect(
        new URL("/dashboard", req.url)
      );
    }


    // If onboarding incomplete, force correct step
    if (!onboardingDone) {

      const routes = ONBOARDING_ROUTES[role];

      const targetRoute =
        routes?.[onboardingStep] ??
        routes?.[1];


      if (
        targetRoute &&
        pathname.startsWith(targetRoute)
      ) {
        return NextResponse.next();
      }


      return NextResponse.redirect(
        new URL(
          targetRoute ?? "/onboarding/username",
          req.url
        )
      );
    }


    return NextResponse.next();


  } catch (error) {

    const response = NextResponse.redirect(
      new URL("/login", req.url)
    );

    response.cookies.delete("token");

    return response;
  }
}


export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
  ],
};