"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { InfoIcon, PlusIcon, X } from "lucide-react";
import { FaInstagram, FaYoutube, FaTiktok, FaFacebook } from "react-icons/fa";
import { SiX } from "react-icons/si";
import { AiFillLinkedin } from "react-icons/ai";
import type { SocialAccount, SocialPlatform } from "@prisma/client";

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

export default function SocialFolderGrid() {
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
    "h-11 w-full rounded-xl border border-white/10 bg-zinc-950 px-4 text-sm text-white outline-none focus:border-white/25";

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-white">Social platforms</h2>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* CARD */}
      <div className="w-[225px] overflow-hidden rounded-[28px] bg-white/10 p-2.5">
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

            {/* Connected count */}
            <div className="text-4xl font-extrabold tracking-tight text-white">
              {loading ? (
                <span className="inline-block h-9 w-10 animate-pulse rounded bg-white/20 align-middle" />
              ) : (
                <>
                  {socials.length}
                  <span className="text-2xl text-white/70">
                    /{PLATFORMS.length}
                  </span>
                </>
              )}
            </div>

            <div className="text-sm font-medium text-white/60">
              Platforms connected
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-center gap-4 py-4 text-white">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-2 text-sm font-medium transition hover:text-white/70"
          >
            <InfoIcon className="size-4" />
            Detail
          </button>

          <span className="h-5 w-px bg-white/20" />

          <button
            onClick={() => openAdd()}
            className="flex items-center gap-2 text-sm font-medium transition hover:text-white/70"
          >
            <PlusIcon className="size-4" />
            Add
          </button>
        </div>
      </div>

      {/* ALL PLATFORMS MODAL */}
      {showAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[320px] rounded-[24px] border border-white/10 bg-black/90 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">All platforms</p>
              <button
                onClick={() => setShowAll(false)}
                className="text-zinc-300 transition hover:text-white"
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
                    className="relative flex flex-col items-center justify-center rounded-[14px] border border-white/10 p-4 transition hover:bg-white/5"
                  >
                    {connected && (
                      <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm" />
                    )}
                    <Icon className={`text-2xl ${connected ? p.color : "text-zinc-600"}`} />
                    <span className="mt-2 text-[10px] text-zinc-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[320px] rounded-[24px] border border-white/10 bg-zinc-950 p-5 shadow-xl">
            <div className="flex items-center gap-3">
              <selectedPlatform.icon
                className={`text-2xl ${selectedPlatform.color}`}
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedPlatform.name}
                </p>
                <p
                  className={`text-xs ${
                    selectedAccount ? "text-emerald-400" : "text-zinc-500"
                  }`}
                >
                  {selectedAccount ? "Connected" : "Not Connected"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-zinc-300">
              {selectedAccount ? (
                <>
                  <p>
                    <span className="text-zinc-500">Handle: </span>
                    {selectedAccount.handle}
                  </p>
                  <p>
                    <span className="text-zinc-500">Followers: </span>
                    {selectedAccount.followers.toLocaleString()}
                  </p>
                  {selectedAccount.url && (
                    <a
                      href={selectedAccount.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-sky-400 hover:underline"
                    >
                      {selectedAccount.url}
                    </a>
                  )}
                </>
              ) : (
                <p className="text-zinc-500">No account connected yet.</p>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setSelectedPlatform(null)}
                className="w-full rounded-xl border border-white/10 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Close
              </button>

              {selectedAccount ? (
                <>
                  <button
                    onClick={() => removeSocial(selectedPlatform.id)}
                    disabled={saving}
                    className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-sm text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {saving ? "Removing..." : "Remove"}
                  </button>
                  <button
                    onClick={() => openAdd(selectedPlatform)}
                    className="w-full rounded-xl bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700"
                  >
                    Edit
                  </button>
                </>
              ) : (
                <button
                  onClick={() => openAdd(selectedPlatform)}
                  className="w-full rounded-xl bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={saveSocial}
            className="w-[320px] rounded-[24px] border border-white/10 bg-zinc-950 p-5 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {editing ? `Edit ${editing.name}` : "Add platform"}
              </p>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="text-zinc-300 transition hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">
                  Platform
                </label>
                <select
                  value={form.platform}
                  disabled={!!editing}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      platform: e.target.value as SocialPlatform,
                    })
                  }
                  className={`${inputClass} bg-zinc-900 disabled:opacity-50`}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400">
                  Handle
                </label>
                <input
                  value={form.handle}
                  onChange={(e) =>
                    setForm({ ...form, handle: e.target.value })
                  }
                  placeholder="@yourhandle"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400">
                  Profile URL (optional)
                </label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="w-full rounded-xl border border-white/10 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.handle.trim()}
                className="w-full rounded-xl bg-emerald-600 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
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
