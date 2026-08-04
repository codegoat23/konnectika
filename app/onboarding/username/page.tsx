"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { LogoutButton } from "@/components/logoutButton";

type ValidationState = "idle" | "checking" | "available" | "taken";

export default function UsernamePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<ValidationState>("idle");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // lowercase, no spaces, alphanumeric + underscore only
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(val);
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
          `/api/onboarding/username/check?username=${val}`,
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

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (validation === "taken") {
      setError("That username is already taken.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/username", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save username.");
        return;
      }

      router.push("/onboarding/socials");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputBorderColor =
    validation === "available"
      ? "border-green-500 focus:ring-green-500"
      : validation === "taken"
      ? "border-red-400 focus:ring-red-400"
      : "border-gray-200 focus:ring-black";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
<LogoutButton/>
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center">
            <AtSign size={28} className="text-white" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center">Choose a username</h1>
        <p className="text-gray-500 text-center mt-2 text-sm">
          This will be your public identity on Konnectika.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">

          {/* Input */}
          <div className="relative">
            <div className="flex items-center border rounded-xl overflow-hidden focus-within:ring-2 transition-all border-white/10">
              <span className="pl-4 text-gray-400 text-sm select-none">@</span>
              <input
                value={username}
                onChange={handleChange}
                placeholder="yourhandle"
                maxLength={30}
                className={`flex-1 px-2 py-3 text-sm outline-none  focus:ring-2 rounded-xl ${inputBorderColor}`}
              />

              {/* Validation icon */}
              <div className="pr-4">
                {validation === "checking" && (
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                )}
                {validation === "available" && (
                  <CheckCircle2 size={16} className="text-green-500" />
                )}
                {validation === "taken" && (
                  <XCircle size={16} className="text-red-400" />
                )}
              </div>
            </div>

            {/* Character count */}
            {username.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                {username.length}/30
              </p>
            )}
          </div>

          {/* Inline validation message */}
          {validation === "available" && (
            <p className="text-sm text-green-600">✓ @{username} is available</p>
          )}
          {validation === "taken" && (
            <p className="text-sm text-red-500">✗ @{username} is already taken</p>
          )}

          {/* Rules hint */}
          <p className="text-xs text-gray-400">
            Only lowercase letters, numbers, and underscores. Min 3 characters.
          </p>

          {/* Error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || validation === "taken" || validation === "checking"}
            className="w-full bg-black text-white rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
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
                step === 1 ? "w-6 bg-black" : "w-3 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Step 1 of 4</p>
      </div>
    </div>
  );
}