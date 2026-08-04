"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import PlatformIcons from "@/components/discover/PlatformIcons";
import SubmissionUploader from "@/components/SubmissionUploader";
import type { Platform } from "@/types";

type ApplicationDetail = {
  id: string;
  message: string | null;
  campaign: {
    id: string;
    name: string;
    brand: string | null;
    paymentRate: number;
    description: string;
    contentFormat: string;
    requirements: string[];
    thumbnailPic?: string;
    platforms: Platform[];
  };
};

export default function SubmitProofForm({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [postLinksText, setPostLinksText] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);

      try {
        const res = await fetch(`/api/applications/${applicationId}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.error ?? "Failed to load");

        setApplication(data.application);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [applicationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const postLinks = postLinksText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (!screenshots.length) return setSubmitError("Add screenshots");
    if (!postLinks.length) return setSubmitError("Add post links");

    setSubmitting(true);

    try {
    

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          screenshots,
          postLinks,
          caption: caption || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Submit failed");
      }

      router.push("/dashboard/submission");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Skeleton />;

  if (loadError || !application) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-red-400 text-sm">
        {loadError ?? "Failed to load application"}
      </div>
    );
  }

  const c = application.campaign;

  return (
    <div className="max-w-5xl mx-auto px-4  space-y-6">

      {/* 🔙 header action */}
      <button
        onClick={() => router.back()}
        className="text-sm text-zinc-400 hover:text-white transition"
      >
        ← Back
      </button>

      {/* 🖼️ CAMPAIGN HEADER (modal style but page embedded) */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 w-full"
      style={
        {
          borderRadius:30,

        }
      }
      >

        <div
          className="h-44 bg-cover bg-center relative"
          style={{
            backgroundImage: `url(${c.thumbnailPic || ""})`,
          }}
        >
          <div className="absolute bottom-4 left-4">
            <h1 className="text-white text-2xl font-bold">{c.name}</h1>
            <p className="text-zinc-300 text-sm">{c.brand}</p>
          </div>
        </div>

        {/* 🧾 INFO BLOCK */}
        <div className="p-5 space-y-4">

          <div>
            <h3 className="text-zinc-400 text-xs uppercase mb-1">
              About Campaign
            </h3>
            <p className="text-zinc-300 text-sm">{c.description}</p>
          </div>

          <div className="flex flex-col gap-3">
            <PlatformIcons platforms={c.platforms}/>
           
           
          </div>
        </div>
      </div>

      {/* 🧾 SUBMISSION FORM (modal-style card) */}
      <form
        onSubmit={handleSubmit}
        className="p-5 space-y-4"
      >
        <h2 className="text-white font-semibold text-lg">
          Submit Proof
        </h2>

        {submitError && (
          <p className="text-red-400 text-sm">{submitError}</p>
        )}

        <div>
          <label className="text-xs text-zinc-400">Screenshots</label>
          <div className="grid grid-cols-3 gap-3 mt-4">
  {screenshots.map((url) => (
    <img
      key={url}
      src={url}
      alt="Screenshot"
      className="rounded-lg border border-zinc-700"
    />
  ))}
</div>
        <SubmissionUploader
    onUploadComplete={(urls) => {
        setScreenshots((prev) => [...prev, ...urls]);
    }}
/>
        </div>

        <div>
          <label className="text-xs text-zinc-400">Post Links</label>
          <textarea
            value={postLinksText}
            onChange={(e) => setPostLinksText(e.target.value)}
            rows={3}
            className="w-full mt-1 p-2 rounded-lg bg-zinc-800 border border-white/10 text-sm text-white"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400">Note</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            className="w-full mt-1 p-2 rounded-lg bg-zinc-800 border border-white/10 text-sm text-white"
          />
        </div>

        <button
          disabled={submitting}
          className="w-full py-3 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition"
        >
          {submitting ? "Submitting..." : "Submit Proof"}
        </button>
      </form>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-3">
      <div className="h-44 bg-zinc-800 rounded-2xl animate-pulse" />
      <div className="h-6 bg-zinc-800 rounded w-1/2 animate-pulse" />
      <div className="h-32 bg-zinc-800 rounded animate-pulse" />
    </div>
  );
}