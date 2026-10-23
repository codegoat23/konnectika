"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { InfoIcon, PlusIcon, X } from "lucide-react";
import { FaInstagram, FaYoutube, FaTiktok, FaFacebook } from "react-icons/fa";
import { SiX } from "react-icons/si";
import { AiFillLinkedin } from "react-icons/ai";
import type { SocialAccount, SocialPlatform } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PlatformConfig = {
  id: SocialPlatform;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
};

const PLATFORMS: PlatformConfig[] = [
  {
    id: "TWITTER",
    name: "Twitter / X",
    icon: SiX,
    color: "text-sky-500",
    bg: "#0f172a",
  },
  {
    id: "INSTAGRAM",
    name: "Instagram",
    icon: FaInstagram,
    color: "text-pink-500",
    bg: "#e1306c",
  },
  {
    id: "YOUTUBE",
    name: "YouTube",
    icon: FaYoutube,
    color: "text-red-500",
    bg: "#ff0000",
  },
  {
    id: "TIKTOK",
    name: "TikTok",
    icon: FaTiktok,
    color: "text-zinc-700",
    bg: "#000000",
  },
  {
    id: "FACEBOOK",
    name: "Facebook",
    icon: FaFacebook,
    color: "text-blue-600",
    bg: "#1877f2",
  },
  {
    id: "LINKEDIN",
    name: "LinkedIn",
    icon: AiFillLinkedin,
    color: "text-sky-700",
    bg: "#0a66c2",
  },
];

function CornerDot({ className }: { className?: string }) {
  return (
    <span className={`absolute size-1.5 rounded-full bg-white/70 ${className}`} />
  );
}

export default function SocialFolderGrid({
  mobileFavoritesOnly = false,
}: {
  mobileFavoritesOnly?: boolean;
}) {
  const [socials, setSocials] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAll, setShowAll] = useState(false);
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformConfig | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformConfig | null>(null);
  const [form, setForm] = useState({
    platform: "INSTAGRAM" as SocialPlatform,
    handle: "",
    url: "",
  });
  const [saving, setSaving] = useState(false);

  const loadSocials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/socials");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSocials(data.socials ?? []);
      setError(null);
    } catch {
      setError("Couldn't load your social platforms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/socials");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (!cancelled) {
          setSocials(data.socials ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Couldn't load your social platforms");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isConnected = (platform: SocialPlatform) =>
    socials.some((s) => s.platform === platform);

  const selectedAccount = selectedPlatform
    ? socials.find((s) => s.platform === selectedPlatform.id) ?? null
    : null;

  function openAdd(platform?: PlatformConfig) {
    setEditing(platform ?? null);
    setForm({
      platform: platform?.id ?? "INSTAGRAM",
      handle: platform
        ? socials.find((s) => s.platform === platform.id)?.handle ?? ""
        : "",
      url: platform
        ? socials.find((s) => s.platform === platform.id)?.url ?? ""
        : "",
    });
    setFormOpen(true);
  }

  async function saveSocial(e: FormEvent) {
    e.preventDefault();
    if (!form.handle.trim() || saving) return;

    setSaving(true);
    try {
      const res = await fetch("/api/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.platform,
          handle: form.handle.trim(),
          url: form.url.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }

      await loadSocials();
      setFormOpen(false);
      setSelectedPlatform(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function removeSocial(platform: SocialPlatform) {
    if (saving) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/socials/${platform}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");

      await loadSocials();
      setSelectedPlatform(null);
      setShowAll(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-orange-500/30";

  return (
    <div className="flex flex-col gap-5">
      {mobileFavoritesOnly && (
        <section className="mx-4 rounded-3xl border border-white/5 bg-zinc-900 px-4 py-4 text-white shadow-lg md:hidden" aria-label="Favorite social platforms">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Social Platforms</h2>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-xs text-white/60 transition hover:text-white"
            >
              View all
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const connected = isConnected(platform.id);
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setSelectedPlatform(platform)}
                  aria-label={`${platform.name}: ${connected ? "connected" : "not connected"}`}
                  className="flex w-14 shrink-0 flex-col items-center gap-1.5 rounded-xl py-1 text-[10px] text-white/65 transition hover:bg-white/5 hover:text-white"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-white/10">
                    <Icon className={`size-4 ${connected ? (platform.id === "TIKTOK" ? "text-white" : platform.color) : "text-zinc-500"}`} />
                  </span>
                  <span className="max-w-full truncate">{platform.name.split(" /")[0]}</span>
                </button>
              );
            })}
          </div>
          {loading && <p className="mt-2 text-[10px] text-white/45">Loading connected platforms…</p>}
          {error && <p className="mt-2 text-[10px] text-red-300">{error}</p>}
        </section>
      )}

      <div className={mobileFavoritesOnly ? "hidden md:flex md:flex-col md:gap-5" : "flex flex-col gap-5"}>
      <h2 className="text-lg font-semibold text-foreground">Social platforms</h2>

      {error && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/15 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* CARD */}
      <div className="w-full max-w-[240px] sm:w-[225px] overflow-hidden rounded-[28px] bg-card p-2.5 border border-border">
        <div className="relative rounded-[20px] bg-[#ff6900] shadow-xs px-6 py-6">
          <CornerDot className="left-3 top-3" />
          <CornerDot className="right-3 top-3" />
          <CornerDot className="left-3 bottom-3" />
          <CornerDot className="right-3 bottom-3" />

          <div className="flex flex-col items-center gap-3">
            {/* Overlapping platform icons */}
            <div className="flex items-center">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const connected = isConnected(p.id);
                return (
                  <div
                    key={p.id}
                    className={`-ml-3 flex size-9 items-center justify-center rounded-full border-2 border-orange-500 text-white shadow-sm first:ml-0 ${
                      !connected ? "opacity-40 grayscale" : ""
                    }`}
                    style={{ backgroundColor: p.bg }}
                  >
                    <Icon className="size-4" />
                  </div>
                );
              })}
            </div>

          

            <div className="text-sm font-medium text-white/70">
              Platforms connected
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-center gap-4 py-3 sm:py-4 text-foreground">
          <button
            onClick={() => setShowAll(true)}
            aria-label="View platform details"
            className="flex items-center gap-2 text-sm font-medium transition hover:text-muted-foreground min-h-[44px] px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <InfoIcon className="size-4" />
            Detail
          </button>

          <span className="h-5 w-px bg-muted" />

          <button
            onClick={() => openAdd()}
            aria-label="Add a social platform"
            className="flex items-center gap-2 text-sm font-medium text-orange-500 transition hover:text-orange-400 min-h-[44px] px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          >
            <PlusIcon className="size-4" />
            Add
          </button>
        </div>
      </div>
      </div>

      {/* ALL PLATFORMS MODAL */}
      {showAll && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="all-platforms-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowAll(false)}
        >
          <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-xs rounded-[24px] border border-border bg-popover p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 id="all-platforms-title" className="text-sm font-semibold text-foreground">
                All platforms
              </h3>
              <button
                onClick={() => setShowAll(false)}
                aria-label="Close all platforms dialog"
                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const connected = isConnected(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPlatform(p);
                      setShowAll(false);
                    }}
                    className="relative flex flex-col items-center justify-center rounded-[14px] border border-border p-3 sm:p-4 transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[70px]"
                  >
                    {connected && (
                      <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-success shadow-sm" />
                    )}
                    <Icon className="text-2xl text-muted-foreground" />
                    <span className="mt-2 text-[10px] text-muted-foreground truncate max-w-full">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PLATFORM DETAIL MODAL */}
      {selectedPlatform && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="platform-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setSelectedPlatform(null)}
        >
          <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-xs rounded-[24px] border border-border bg-popover p-5 shadow-xl">
            <div className="flex items-center gap-3">
              <selectedPlatform.icon className="text-2xl text-muted-foreground" />
              <div>
                <h3 id="platform-detail-title" className="text-sm font-semibold text-foreground">
                  {selectedPlatform.name}
                </h3>
                <p
                  className={`text-xs ${
                    selectedAccount ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {selectedAccount ? "Connected" : "Not Connected"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
              {selectedAccount ? (
                <>
                  <p className="break-all">
                    <span className="text-muted-foreground">Handle: </span>
                    {selectedAccount.handle}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Followers: </span>
                    {selectedAccount.followers.toLocaleString()}
                  </p>
                  {selectedAccount.url && (
                    <a
                      href={selectedAccount.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-orange-400 hover:underline"
                    >
                      {selectedAccount.url}
                    </a>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No account connected yet.</p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedPlatform(null)}
                className="w-full rounded-xl border border-border py-2 text-sm text-muted-foreground hover:bg-muted/60 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Close
              </button>

              {selectedAccount ? (
                <>
                  <button
                    onClick={() => removeSocial(selectedPlatform.id)}
                    disabled={saving}
                    className="w-full rounded-xl border border-destructive/30 bg-destructive/15 py-2 text-sm text-destructive hover:bg-destructive/25 disabled:opacity-50 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                  >
                    {saving ? "Removing..." : "Remove"}
                  </button>
                  <button
                    onClick={() => openAdd(selectedPlatform)}
                    className="w-full rounded-xl bg-success py-2 text-sm text-success-foreground hover:bg-success/90 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
                  >
                    Edit
                  </button>
                </>
              ) : (
                <button
                  onClick={() => openAdd(selectedPlatform)}
                  className="w-full rounded-xl bg-success py-2 text-sm text-success-foreground hover:bg-success/90 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT FORM MODAL */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="social-form-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setFormOpen(false)}
        >
          <form
            onSubmit={saveSocial}
            className="w-full max-w-[calc(100vw-2rem)] sm:max-w-xs rounded-[24px] border border-border bg-popover p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="social-form-title" className="text-sm font-semibold text-foreground">
                {editing ? `Edit ${editing.name}` : "Add platform"}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close form dialog"
                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label id="platform-select-label" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Platform
                </label>
                <Select
                  value={form.platform}
                  disabled={!!editing}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      platform: value as SocialPlatform,
                    })
                  }
                >
                  <SelectTrigger aria-labelledby="platform-select-label" className={`${inputClass} bg-card focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="social-handle-input" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Handle
                </label>
                <input
                  id="social-handle-input"
                  value={form.handle}
                  onChange={(e) =>
                    setForm({ ...form, handle: e.target.value })
                  }
                  placeholder="@yourhandle"
                  className={`${inputClass} focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`}
                />
              </div>

              <div>
                <label htmlFor="social-url-input" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Profile URL (optional)
                </label>
                <input
                  id="social-url-input"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className={`${inputClass} focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="w-full rounded-xl border border-border py-2 text-sm text-muted-foreground hover:bg-muted/60 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.handle.trim()}
                className="w-full rounded-xl bg-orange-500 py-2 text-sm text-white hover:bg-orange-400 disabled:opacity-50 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
