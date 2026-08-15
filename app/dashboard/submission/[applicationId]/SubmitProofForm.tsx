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
      <div className="max-w-3xl mx-auto p-6 text-red-600 text-sm">
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
        className="text-sm text-muted-foreground hover:text-foreground transition"
      >
        ← Back
      </button>

      {/* 🖼️ CAMPAIGN HEADER (modal style but page embedded) */}
      <div className="rounded-2xl overflow-hidden border border-border bg-card w-full"
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
            <h3 className="text-muted-foreground text-xs uppercase mb-1">
              About Campaign
            </h3>
            <p className="text-muted-foreground text-sm">{c.description}</p>
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
        <h2 className="text-foreground font-semibold text-lg">
          Submit Proof
        </h2>

        {submitError && (
          <p className="text-red-600 text-sm">{submitError}</p>
        )}

        <div>
          <label className="text-xs text-muted-foreground">Screenshots</label>
          <div className="grid grid-cols-3 gap-3 mt-4">
  {screenshots.map((url) => (
    <img
      key={url}
      src={url}
      alt="Screenshot"
      className="rounded-lg border border-border"
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
          <label className="text-xs text-muted-foreground">Post Links</label>
          <textarea
            value={postLinksText}
            onChange={(e) => setPostLinksText(e.target.value)}
            rows={3}
            className="w-full mt-1 p-2 rounded-lg bg-muted border border-border text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Note</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            className="w-full mt-1 p-2 rounded-lg bg-muted border border-border text-sm text-foreground"
          />
        </div>

        <button
          disabled={submitting}
          className="w-full py-3 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
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
      <div className="h-44 bg-muted rounded-2xl animate-pulse" />
      <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
      <div className="h-32 bg-muted rounded animate-pulse" />
    </div>
  );
}