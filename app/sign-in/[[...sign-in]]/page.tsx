import { Suspense } from "react";
import { SignInForm } from "@/components/sign-in-form";
import Logo from "@/public/assets/logo-plain.svg";
import Image from "next/image";

// Mount point for Clerk's path-based sign-in (`routing="path"`). /login
// redirects here so existing links and bookmarks keep working.
export default function ClerkSignInPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
       
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
