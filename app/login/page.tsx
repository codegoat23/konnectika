"use client"

import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { GalleryVerticalEndIcon } from "lucide-react"
import { Bricolage_Grotesque } from "next/font/google";
import Logo from "@/public/assets/logo-plain.svg"
import Image from "next/image";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items gap-6">
                 <div className="w-full flex items-center justify-center  py-1">
      <Image
        src={Logo}
        alt="Konnectika"
        
        priority
        className="h-auto w-full max-w-[60px]"
      />
    </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
