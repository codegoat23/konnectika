"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { LogoutButton } from "@/components/logoutButton";

export default function PhoneOnboardingPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+255"); // Tanzania default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const countryCodes = [
    { code: "+255", flag: "🇹🇿", name: "TZ" },
    { code: "+1", flag: "🇺🇸", name: "US" },
    { code: "+44", flag: "🇬🇧", name: "GB" },
    { code: "+91", flag: "🇮🇳", name: "IN" },
    { code: "+234", flag: "🇳🇬", name: "NG" },
    { code: "+254", flag: "🇰🇪", name: "KE" },
    { code: "+27", flag: "🇿🇦", name: "ZA" },
    { code: "+233", flag: "🇬🇭", name: "GH" },
  ];

  async function handleSubmit() {
    setError("");

    const digits = phone.replace(/\s/g, "");

    if (!digits || digits.length < 7) {
      setError("Enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `${countryCode}${digits}`;

      const res = await fetch("/api/onboarding/phone", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save phone number.");
        return;
      }

      router.push("/onboarding/otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <LogoutButton/>
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <Phone size={28} className="text-orange-500" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center">
          What&apos;s your number?
        </h1>
        <p className="text-muted-foreground text-center mt-2 text-sm">
          We&apos;ll send a verification code to confirm it&apos;s you.
        </p>

        {/* Input */}
        <div className="mt-8 space-y-4">
          <div className="flex gap-2">

            {/* Country code selector */}
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="border border-border rounded-xl px-3 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              {countryCodes.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>

            {/* Phone input */}
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                // allow digits and spaces only
                const val = e.target.value.replace(/[^\d\s]/g, "");
                setPhone(val);
              }}
              placeholder="712 345 678"
              className="flex-1 border border-border rounded-xl px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          {/* Preview */}
          {phone.trim() && (
            <p className="text-xs text-muted-foreground pl-1">
              Full number: <span className="text-foreground font-medium">{countryCode}{phone.replace(/\s/g, "")}</span>
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-orange-500 text-white rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:bg-orange-400"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending code...
              </>
            ) : (
              <>
                Send verification code
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-10">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all ${
                step === 3 ? "w-6 bg-orange-500" : "w-3 bg-muted"
              }`}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Step 3 of 4
        </p>

      </div>
    </div>
  );
}