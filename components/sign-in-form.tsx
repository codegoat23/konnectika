// components/sign-in-form.tsx
//
// Clerk-hosted sign-in, wrapped in the existing Konnectika card so the page
// keeps its visual identity instead of dropping to a bare Clerk widget.
//
// Clerk owns credential handling entirely — this component never sees or
// forwards a password. The role toggle that used to live here is gone on
// purpose: picking CREATOR vs BRAND is a Konnectika concern, so it moved to
// the sign-up page where a role is actually chosen.

"use client";

import { SignIn } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6 items-center", className)} {...props}>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        // Where Clerk sends the user once the session exists. /dashboard does
        // its own role/onboarding redirect, so this needs no extra logic.
        forceRedirectUrl="/dashboard"
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
              "h-11 rounded-[14px] bg-primary text-primary-foreground hover:bg-orange-400",
            footerActionLink: "text-primary hover:text-orange-400",
          },
        }}
      />
    </div>
  );
}
