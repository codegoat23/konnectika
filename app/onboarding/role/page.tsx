"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Building2, Loader2, Sparkles, UserRound } from "lucide-react";
import Logo from "@/public/assets/logo-plain.svg";
import { cn } from "@/lib/utils";

type Role = "CREATOR" | "BRAND";

export default function ChooseRolePage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hint = document.cookie
      .split("; ")
      .find((item) => item.startsWith("kk_signup_role="))
      ?.split("=")[1];
    if (hint !== "CREATOR" && hint !== "BRAND") return;

    setRole(hint);
    void fetch("/api/onboarding/role", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: hint }),
    }).then(async (response) => {
      const data = await response.json();
      if (response.ok) {
        document.cookie = "kk_signup_role=; path=/; max-age=0; samesite=lax";
        router.replace(data.nextStep);
      }
      else if (response.status !== 409) setError(data.error ?? "We couldn't save your account type.");
    }).catch(() => setError("Something went wrong. Please choose your account type to continue."));
  }, [router]);

  async function continueOnboarding() {
    if (!role || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/onboarding/role", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "We couldn't save your account type.");
        return;
      }
      document.cookie = "kk_signup_role=; path=/; max-age=0; samesite=lax";
      router.push(data.nextStep);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted px-4 py-12">
      <section className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <Image src={Logo} alt="Konnectika" priority className="mx-auto mb-5 size-14" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">How will you use Konnectika?</h1>
          
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={role === "CREATOR"}
            onClick={() => setRole("CREATOR")}
            className={cn(
              "rounded-3xl border bg-card p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400/70",
              role === "CREATOR" ? "border-orange-500 ring-2 ring-orange-500/20" : "border-border"
            )}
          >
            <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500"><UserRound size={22} /></span>
            <span className="block text-lg font-semibold">I’m a Creator</span>
            <span className="mt-2 block text-sm leading-6 text-muted-foreground">Build your profile, connect your socials, and earn from brand campaigns.</span>
          </button>

          <button
            type="button"
            aria-pressed={role === "BRAND"}
            onClick={() => setRole("BRAND")}
            className={cn(
              "rounded-3xl border bg-card p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400/70",
              role === "BRAND" ? "border-orange-500 ring-2 ring-orange-500/20" : "border-border"
            )}
          >
            <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500"><Building2 size={22} /></span>
            <span className="block text-lg font-semibold">I’m a Brand</span>
            <span className="mt-2 block text-sm leading-6 text-muted-foreground">Set up your business profile and launch campaigns with creators.</span>
          </button>
        </div>

        {error && <p role="alert" className="mt-4 text-center text-sm text-destructive">{error}</p>}
        <button
          type="button"
          onClick={continueOnboarding}
          disabled={!role || loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : <>Continue <ArrowRight size={18} /></>}
        </button>
      
      </section>
    </main>
  );
}
