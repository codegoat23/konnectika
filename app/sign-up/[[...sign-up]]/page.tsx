import { Suspense } from "react";
import { SignUpForm } from "@/components/sign-up-form";
import Logo from "@/public/assets/logo-plain.svg";
import Image from "next/image";

// Catch-all mount point for Clerk's path-based sign-up (`routing="path"`).
// The legacy /signup URL redirects here and preserves its role intent.
export default function ClerkSignUpPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
       
        <Suspense>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
