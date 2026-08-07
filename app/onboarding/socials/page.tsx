"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Camera,
  PlayCircle,
  Music2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { LogoutButton } from "@/components/logoutButton";

const platforms = [
  {
    key: "TWITTER",
    label: "Twitter / X",
    icon: X,
    placeholder: "yourhandle",
    base: "https://x.com/",
    color: "bg-black",
  },
  {
    key: "INSTAGRAM",
    label: "Instagram",
    icon: Camera,
    placeholder: "yourhandle",
    base: "https://instagram.com/",
    color: "bg-pink-500",
  },
  {
    key: "YOUTUBE",
    label: "YouTube",
    icon: PlayCircle,
    placeholder: "yourchannel",
    base: "https://youtube.com/@",
    color: "bg-red-500",
  },
  {
    key: "TIKTOK",
    label: "TikTok",
    icon: Music2,
    placeholder: "yourhandle",
    base: "https://tiktok.com/@",
    color: "bg-gray-900",
  },
];

export default function SocialsOnboardingPage() {
  const router = useRouter();

  const [open, setOpen] = useState<string | null>(null);
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateHandle(platform: string, value: string) {
    const clean = value.replace(/^@/, "");
    setHandles((prev) => ({ ...prev, [platform]: clean }));
  }

  const filledCount = Object.values(handles).filter((v) => v?.trim()).length;

  async function handleSubmit() {
    setError("");

    const socials = Object.entries(handles)
      .filter(([_, value]) => value?.trim())
      .map(([platform, handle]) => ({ platform, handle }));

    if (socials.length === 0) {
      setError("Add at least one social account to continue.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/socials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socials }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save. Please try again.");
        return;
      }

      router.push("/onboarding/phone");
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
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <Camera size={28} className="text-orange-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center">
          Add your social presence
        </h1>

        <p className="text-muted-foreground text-center mt-2 text-sm">
          Connect platforms so brands can discover you.
        </p>

        {filledCount > 0 && (
          <div className="flex justify-center mt-4">
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
              {filledCount} platform{filledCount > 1 ? "s" : ""} added
            </span>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {platforms.map((p) => {
            const Icon = p.icon;
            const isOpen = open === p.key;
            const hasValue = !!handles[p.key]?.trim();

            return (
              <div
                key={p.key}
                className={`border rounded-xl overflow-hidden transition-shadow ${
                  hasValue ? "border-green-400 shadow-sm" : "border-border"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : p.key)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center`}
                    >
                      <Icon size={16} className="text-white" />
                    </div>

                    <span className="font-medium text-sm">{p.label}</span>

                    {hasValue && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        @{handles[p.key]}
                      </span>
                    )}
                  </div>

                  {isOpen ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t  pt-3 space-y-2">
                    <div className="flex items-center border rounded-lg  overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/30">
                      <span className="pl-3 text-muted-foreground text-sm select-none">
                        @
                      </span>
                      <input
                        value={handles[p.key] || ""}
                        onChange={(e) =>
                          updateHandle(p.key, e.target.value)
                        }
                        placeholder={p.placeholder}
                        className="flex-1 px-2 py-2.5 outline-none text-sm"
                        autoFocus
                      />
                    </div>

                    {handles[p.key]?.trim() && (
                      <p className="text-xs text-muted-foreground">
                        Preview:{" "}
                        <a
                          href={`${p.base}${handles[p.key]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-500 underline"
                        >
                          {p.base}
                          {handles[p.key]}
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full bg-orange-500 text-white rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:bg-orange-400"
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

        <div className="flex justify-center gap-2 mt-10">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all ${
                step === 2 ? "w-6 bg-orange-500" : "w-3 "
              }`}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Step 2 of 4
        </p>
      </div>
    </div>
  );
}