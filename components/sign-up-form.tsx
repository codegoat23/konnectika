// components/sign-up-form.tsx
//
// Clerk-hosted sign-up inside the existing Konnectika card.
//
// CTA intent is parked in a cookie because it must survive Clerk's
// verification round trip. Generic sign-up stores SELECT, so role choice is
// presented after verification during onboarding.
//
// ADMIN is therefore not selectable here AND not reachable through the cookie:
// a tampered value collapses to CREATOR in normalizeRequestedRole().

"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export const SIGNUP_ROLE_COOKIE = "kk_signup_role";

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "";
  const requestedRole = searchParams.get("role");
  const role = requestedRole === "BRAND" || requestedRole === "CREATOR" ? requestedRole : "SELECT";

  // Persist CTA intent across Clerk's verification flow. Without an explicit
  // intent, defer role selection until after the account is verified.
  useEffect(() => {
    document.cookie = `${SIGNUP_ROLE_COOKIE}=${role}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, [role]);

  return (
    <div
      className={cn("flex flex-col gap-6 items-center", className)}
      {...props}
    >
      <p className="w-full max-w-md text-center text-sm text-muted-foreground">
        {role === "CREATOR" ? "Creator account selected" : role === "BRAND" ? "Brand account selected" : "After email verification, choose whether you’re joining as a creator or a brand."}
      </p>

      <SignUp
        routing="path"
        path="/sign-up"
        forceRedirectUrl={redirectTo || "/onboarding"}
        signInUrl="/sign-in"
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full max-w-md",
            card: "w-full max-w-md rounded-[32px] shadow-xl border border-border backdrop-blur-xl",
            headerTitle: "text-2xl font-semibold tracking-tight",
            headerSubtitle: "text-sm text-muted-foreground",
            formFieldInput:
              "h-11 rounded-[14px] border-1 border-border bg-background",
            formButtonPrimary:
              "h-11 rounded-[14px] bg-primary text-primary-foreground hover:bg-orange-600",
            footerActionLink: "text-primary hover:text-orange-400",
          },
        }}
      />
    </div>
  );
}
