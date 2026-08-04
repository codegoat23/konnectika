"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { LogoutButton } from "@/components/logoutButton";

export default function OtpOnboardingPage() {
  const router = useRouter();

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);

  const canResend = resendCooldown === 0;

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown === 0) return;

    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    // allow only digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    // move to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // clear current
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // move back
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    // focus last filled or last box
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  }

  async function handleSubmit() {
    const code = otp.join("");

    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/otp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code. Please try again.");
        // shake — clear and refocus
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
        return;
      }

      router.push(data.redirectTo || "/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;

    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/phone/resend", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        setError("Failed to resend code. Please try again.");
        return;
      }

      // reset timer
      setOtp(["", "", "", "", "", ""]);
      setResendCooldown(30);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  const isFilled = otp.every((d) => d !== "");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <LogoutButton/>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center">
            <ShieldCheck size={28} className="text-white" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-center">Verify your number</h1>
        <p className="text-gray-500 text-center mt-2 text-sm">
          We sent a 6-digit code to your phone.{" "}
          <br className="hidden sm:block" />
          Enter it below to continue.
        </p>

        {/* OTP inputs */}
        <div className="mt-8 flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                ${digit ? "border-black " : "border-white/10 "}
                focus:border-white/20 focus:ring-2 focus:ring-white/10
                ${error ? "border-red-400 bg-red-50" : ""}
              `}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 text-center mt-4">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !isFilled}
          className="mt-6 w-full bg-black text-white rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify & Continue
              <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Resend */}
        <div className="mt-5 flex justify-center">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center gap-1.5 text-sm text-black font-medium hover:underline disabled:opacity-50"
            >
              {resending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RotateCcw size={14} />
              )}
              Resend code
            </button>
          ) : (
            <p className="text-sm text-gray-400">
              Resend code in{" "}
              <span className="font-medium text-gray-600">
                {resendCooldown}s
              </span>
            </p>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-10">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all ${
                step === 4 ? "w-6 bg-black" : "w-3 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">Step 4 of 4</p>
      </div>
    </div>
  );
}