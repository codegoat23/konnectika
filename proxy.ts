// proxy.ts
//
// Next 16's renamed middleware convention (middleware -> proxy). Runs before
// routes render, on the Node runtime by default in v16 — which is what lets
// clerkMiddleware() run here.
//
// Responsibilities, unchanged in behaviour from the pre-Clerk version:
//   - unauthenticated visitors are bounced to sign-in
//   - Clerk owns the signed-in/anonymous behavior on its auth routes
//   - onboarding gates redirect to the correct step
//   - ADMIN is not pushed through the onboarding flow (it has none)
//
// What changed: identity now comes from Clerk instead of a hand-rolled HS256
// `token` cookie. Role and onboarding state still come from Prisma, which is
// why this file does a scoped lookup rather than trusting a token claim.
//
// Note the documented Next.js caveat that a proxy matcher is not a substitute
// for per-route checks: every route handler and server component still
// re-checks identity and role via lib/auth.ts. This file is for redirect UX,
// not for securing data.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FIRST_STEP_BY_ROLE } from "@/lib/auth";

const isPublicRoute = createRouteMatcher([
  "/",
  "/discover(.*)",
  "/brand-campaign-inquiry(.*)",
  "/api/brand-campaign-inquiry",
  "/login(.*)",
  "/signup(.*)",
  // Clerk's own mounted flows (sign-in, sign-up, captcha, OAuth callbacks).
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Must stay public: Clerk cannot authenticate a request to verify the
  // signature of an unsigned webhook.
  "/api/webhooks/clerk",
  "/api/webhooks/snippe",
  // UploadThing uses this route for client validation and upload callbacks.
  // It must reach its handler directly; onboarding redirects return HTML where
  // the UploadThing client expects JSON. Each file route still checks its role.
  "/api/uploadthing(.*)",
  // Health check.
  "/api/health(.*)",
]);

const ONBOARDING_STEPS: Record<string, Record<number, string>> = {
  CREATOR: {
    1: "/onboarding/username",
    2: "/onboarding/socials",
  },
  BRAND: {
    1: "/onboarding/companyname",
    2: "/onboarding/brand-socials",
    3: "/onboarding/brand-details",
    4: "/onboarding/welcome",
  },
};

function isValidStep(step: number): boolean {
  return step >= 1 && step <= 4;
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Clerk must be allowed to serve its own catch-all auth routes, including
  // for unauthenticated visitors. Running the redirect logic here would send
  // /sign-in straight back to /sign-in forever.
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // API handlers enforce their own auth and return JSON errors. Applying page
  // onboarding redirects to these requests turns JSON responses into HTML.
  if (pathname.startsWith("/api/onboarding/")) {
    return NextResponse.next();
  }

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    // Unauthenticated on a protected route -> send to Clerk sign-in, keeping
    // the intended destination so the user lands where they were headed.
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Role + onboarding state are Konnectika's, not Clerk's, so read them from
  // Prisma. Scoped to the two columns needed.
  //
  // A transient database/Neon failure must not turn every protected route into
  // a 500. Authentication already succeeded above (Clerk), and each page and
  // route handler re-enforces authorization, so on a lookup failure we fall
  // through the "no row yet" path (skip the redirect UX) instead of crashing.
  const user = await prisma.user
    .findUnique({
      where: { clerkUserId },
      select: {
        role: true,
        onboardingDone: true,
        onboardingStep: true,
      },
    })
    .catch((error) => {
      console.error(
        "[proxy] user lookup failed; skipping onboarding gates:",
        error
      );
      return null;
    });

  // Signed in with Clerk but no Konnectika row. Don't bounce them to sign-in
  // (they ARE signed in) and don't hard-fail; send them to onboarding so the
  // first request that hydrates their row completes the setup.
  if (!user) {
    return NextResponse.next();
  }

  if (!user.onboardingDone && user.onboardingStep === 0) {
    if (
      pathname === "/api/onboarding/role" ||
      pathname === "/api/auth/session"
    ) {
      return NextResponse.next();
    }
    if (pathname !== "/onboarding/role") {
      return NextResponse.redirect(new URL("/onboarding/role", request.url));
    }
    return NextResponse.next();
  }

  const isOnboarding = pathname.startsWith("/onboarding");

  // Before phone verification was removed, creator step 3 meant socials were
  // already saved and only the phone/OTP step remained. Complete those legacy
  // accounts once so they can continue without being sent back through setup.
  if (
    user.role === "CREATOR" &&
    !user.onboardingDone &&
    user.onboardingStep >= 3
  ) {
    try {
      await prisma.user.update({
        where: { clerkUserId },
        data: { onboardingDone: true, onboardingStep: 3 },
      });
    } catch (error) {
      console.error("[proxy] creator onboarding backfill failed:", error);
      return NextResponse.next();
    }

    if (isOnboarding) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (user.onboardingDone && isOnboarding) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user.onboardingDone) {
    // Admins have no onboarding flow.
    if (user.role === "ADMIN") {
      if (isOnboarding || pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.next();
    }

    const step = isValidStep(user.onboardingStep) ? user.onboardingStep : 1;
    const routes = ONBOARDING_STEPS[user.role];
    const target = routes?.[step] ?? FIRST_STEP_BY_ROLE[user.role];

    if (target && pathname !== target) {
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match everything except static assets and image files — mirroring the
     * previous matcher, widened so Clerk's mounted routes are covered too.
     */
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|mov)).*)",
    "/(api|trpc)(.*)",
    /*
     * Clerk's auto-proxy path for production *.vercel.app hosts. Requests like
     * /__clerk/npm/@clerk/clerk-js@<v>/dist/clerk.browser.js end in .js and
     * match the static-asset exclusion above, so this explicit entry is what
     * routes them into clerkMiddleware (Clerk docs require it).
     */
    "/__clerk/(.*)",
  ],
};
