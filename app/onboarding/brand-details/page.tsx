"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import LogoUpload from "@/components/logoUpload";
import { useRouter } from "next/navigation";

export default function BrandOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/onboarding/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: formData.get("website"),
          industry: formData.get("industry"),
          description: formData.get("description"),
          logo,
        }),
      });
      const result = await res.json().catch(() => null);

      if (res.ok) {
        router.push(result?.nextStep || "/onboarding/welcome");
      } else {
        setError(result?.error || "Failed to save brand profile. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#141414] text-[#f5f5f5]">
     

      <div className="flex flex-1 justify-center overflow-y-auto px-6 py-14 sm:px-10 sm:py-16">
        <div className="w-full max-w-[780px]">
          <div className="mb-9">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[32px]">
              Tell us about your brand
            </h1>
            <p className="mt-2 text-base text-[#b7b7b7] sm:text-lg">
              One place to launch campaigns, manage budget, and track submissions.
            </p>
          </div>

          <form id="brand-details-form" onSubmit={handleSubmit} className="flex min-h-[490px] flex-col">
            <div className="mb-10 flex flex-col items-center pt-1">
              <LogoUpload compact value={logo} onChange={setLogo} />
            </div>

            <div className="space-y-3">
              <input
                name="website"
                type="url"
                placeholder="Website (optional)"
                aria-label="Website (optional)"
                className="h-[60px] w-full rounded-[20px] border border-transparent bg-[#202020] px-5 text-base text-[#f5f5f5] outline-none transition placeholder:text-[#777] focus:border-[#ff6b0b]/60 focus:ring-2 focus:ring-[#ff6b0b]/20"
              />
              <input
                name="industry"
                placeholder="Industry (optional)"
                aria-label="Industry (optional)"
                className="h-[60px] w-full rounded-[20px] border border-transparent bg-[#202020] px-5 text-base text-[#f5f5f5] outline-none transition placeholder:text-[#777] focus:border-[#ff6b0b]/60 focus:ring-2 focus:ring-[#ff6b0b]/20"
              />
            </div>

            <textarea
              name="description"
              placeholder="Add a short description (optional)"
              aria-label="Add a short description (optional)"
              rows={2}
              className="mt-20 min-h-[60px] w-full resize-y rounded-[20px] border border-transparent bg-[#202020] px-5 py-[10px] text-base text-[#f5f5f5] outline-none transition placeholder:text-[#777] focus:border-[#ff6b0b]/60 focus:ring-2 focus:ring-[#ff6b0b]/20"
            />

            {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
          </form>
        </div>
      </div>

      <footer className="flex min-h-[100px] items-center justify-end border-t border-white/[0.07] px-6 sm:px-10">
        <button
          type="submit"
          form="brand-details-form"
          disabled={loading}
          className="flex h-[60px] min-w-[148px] items-center justify-center gap-2 rounded-full bg-[#ff6b0b] px-7 text-base font-semibold text-white transition hover:bg-[#f05e00] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Next <ArrowRight className="h-5 w-5" /></>}
        </button>
      </footer>
    </main>
  );
}
