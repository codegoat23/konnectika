"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { LogoutButton } from "@/components/logoutButton";
import Logo from "@/public/assets/logo-plain.svg"
import Image from "next/image";

type ValidationState = "idle" | "checking" | "available" | "taken";

export default function CompanyNamePage() {
  const router = useRouter();

  const [companyName, setcompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<ValidationState>("idle");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // lowercase, no spaces, alphanumeric + underscore only
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setcompanyName(val);
    setError("");

    if (debounceTimer) clearTimeout(debounceTimer);

    if (val.length < 3) {
      setValidation("idle");
      return;
    }

    setValidation("checking");

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/onboarding/brand/companyname/check?companyname=${val}`,
          { credentials: "include" }
        );
        const data = await res.json();
        setValidation(data.available ? "available" : "taken");
      } catch {
        setValidation("idle");
      }
    }, 500);

    setDebounceTimer(timer);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (companyName.length < 3) {
      setError("Brand must be at least 3 characters.");
      return;
    }

    if (validation === "taken") {
      setError("That Brand name is already taken.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/brand/companyname", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save username.");
        return;
      }

      router.push("/onboarding/brand-socials");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputBorderColor =
    validation === "available"
      ? "border-success focus:ring-success"
      : validation === "taken"
      ? "border-destructive focus:ring-destructive"
      : "border-border focus:ring-orange-500/30";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="absolute right-10 top-15 bg-orange-500 p-2.5 rounded-[10]">
          <LogoutButton/>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl  flex items-center justify-center">
            <Image
                   src={Logo}
                   alt="Konnectika"
                   
                   priority
                   className="h-auto w-full max-w-[60px]"
                 />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center">Enter your Brand Name</h1>
        <p className="text-muted-foreground text-center mt-2 text-sm">
          This will be your public identity on Konnectika.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">

          {/* Input */}
          <div className="relative">
            <div className="flex items-center border rounded-xl overflow-hidden focus-within:ring-2 transition-all border-border">
              <span className="pl-4 text-muted-foreground text-sm select-none">@</span>
              <input
                value={companyName}
                onChange={handleChange}
                placeholder="Brand Name"
                maxLength={30}
                className={`flex-1 px-2 py-3 text-sm outline-none  focus:ring-2 rounded-xl ${inputBorderColor}`}
              />

              {/* Validation icon */}
              <div className="pr-4">
                {validation === "checking" && (
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                )}
                {validation === "available" && (
                  <CheckCircle2 size={16} className="text-success" />
                )}
                {validation === "taken" && (
                  <XCircle size={16} className="text-destructive" />
                )}
              </div>
            </div>

            {/* Character count */}
            {companyName.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {companyName.length}/30
              </p>
            )}
          </div>

          {/* Inline validation message */}
          {validation === "available" && (
            <p className="text-sm text-success">✓ @{companyName} is available</p>
          )}
          {validation === "taken" && (
            <p className="text-sm text-destructive">✗ @{companyName} is already taken</p>
          )}

          {/* Rules hint */}
          <p className="text-xs text-muted-foreground">
            Only lowercase letters, numbers, and underscores. Min 3 characters.
          </p>

          {/* Error */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || validation === "taken" || validation === "checking"}
            className="w-full bg-orange-500 text-white rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:bg-orange-400"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-10">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all ${
                step === 1 ? "w-6 bg-orange-500" : "w-3 bg-muted"
              }`}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">Step 1 of 4</p>
      </div>
    </div>
  );
}