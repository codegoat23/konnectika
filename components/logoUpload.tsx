"use client";

import { useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Label } from "./ui/label";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

type LogoUploadProps = {
  value?: string | null;
  onChange: (url: string) => void;
};

export default function LogoUpload({ value, onChange }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Brand Logo</Label>
      {preview ? (
        <div className="relative h-40 w-40 overflow-hidden rounded-full border border-border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Brand logo preview" className="h-full w-full object-contain p-2" />
          <button
            type="button"
            aria-label="Remove brand logo"
            onClick={() => { setPreview(null); onChange(""); }}
            className="absolute right-1 top-1 rounded-full bg-black/70 p-2 text-white"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground">
          <Upload className="mb-2 h-6 w-6" />
          <span className="text-sm">Upload Logo</span>
        </div>
      )}
      <UploadButton<OurFileRouter, "brandLogo">
        endpoint="brandLogo"
        onUploadBegin={() => setUploading(true)}
        onClientUploadComplete={(files) => {
          setUploading(false);
          const url = files[0]?.ufsUrl;
          if (url) { setPreview(url); onChange(url); }
        }}
        onUploadError={(error) => { setUploading(false); alert(error.message); }}
        appearance={{ button: { borderRadius: 12, background: "#f97316", color: "white" } }}
        content={{
          button: () => uploading ? "Uploading…" : "Choose logo",
          allowedContent: () => "PNG, JPG or WEBP up to 2MB",
        }}
      />
    </div>
  );
}
