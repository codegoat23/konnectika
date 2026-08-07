"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LogoUpload from "@/components/logoUpload";
import { Label } from "@/components/ui/label";
import Logo from "@/public/assets/logo-plain.svg"
import Image from "next/image";
import { useRouter } from "next/navigation";


export default function BrandOnboardingPage() {
const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      const data = {
        website: formData.get("website"),
        industry: formData.get("industry"),
        description: formData.get("description"),
      };

      const res = await fetch(
        "/api/onboarding/brand",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json().catch(() => null);

      if (res.ok) {
        router.push(result?.nextStep || "/onboarding/welcome");
      } else {
        console.error(result?.error || "Failed to save brand profile");
      }

    } catch (error) {
      console.error(error);

    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
          <div className="w-16 h-16 rounded-2xl  flex items-center justify-center">
                      <Image
                                       src={Logo}
                                       alt="Konnectika"
                                       
                                       priority
                                       className="h-auto w-full max-w-[60px]"
                                     />
                  </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl space-y-6"
      >

        <div>
          <h1 className="text-3xl font-bold">
            Tell us about your brand
          </h1>

          <p className="text-muted-foreground text-sm">
            This helps creators understand who they are working with.
          </p>
        </div>


        <div className="space-y-2 flex ">
            <LogoUpload/>
         
        </div>


        <div className="space-y-2">
          <Label>
            <span>Website</span>
            <span className="text-xs">(optional)</span>
            
          </Label>

          <Input
            name="website"
            placeholder="https://example.com"
            className="border-border h-11"
          />
        </div>


        <div className="space-y-2">
          <Label>
            Industry
          </Label>

          <Input
            name="industry"
            placeholder="Fashion, Tech, Food..."
             className="border-border h-11"
          />
        </div>


        <div className="space-y-2">
          <Label>
            About your company
          </Label>

          <Textarea
            name="description"
            placeholder="Tell creators about your brand..."
             className="border-border h-30"
          />
        </div>


        <Button
          disabled={loading}
          className="w-full bg-primary text-primary-foreground h-10 rounded-[14] hover:text-white hover:bg-black/30"
        >
          {loading ? "Saving..." : "Complete setup"}
        </Button>

      </form>

    </div>
  );
}