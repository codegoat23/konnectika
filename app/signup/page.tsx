"use client"

import { Suspense } from "react"
import { SignupForm } from "@/components/signup-form"
import { Bricolage_Grotesque } from "next/font/google";
import Logo from "@/public/assets/logo-plain.svg"
import Image from "next/image";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
              <div className="w-full flex items-center justify-center  py-1">
      <Image
        src={Logo}
        alt="Konnectika"
        
        priority
        className="h-auto w-full max-w-[60px]"
      />
    </div>
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
