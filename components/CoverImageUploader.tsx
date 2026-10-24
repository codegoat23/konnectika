"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import { ImagePlus, Trash2 } from "lucide-react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

type CoverImageUploaderProps = {
  value?: string | null;
  onChange: (url: string) => void;
};

export default function CoverImageUploader({
  value,
  onChange,
}: CoverImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="group relative overflow-hidden rounded-[14px] border border-border bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Cover image preview"
            className="h-44 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onChange("");
            }}
            aria-label="Remove cover image"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-zinc-300 transition-colors hover:text-white"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <div className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-border bg-background text-muted-foreground">
          <ImagePlus size={28} />
          <span className="text-sm">No cover image</span>
        </div>
      )}

      <UploadButton<OurFileRouter, "campaignCover">
        endpoint="campaignCover"
        onUploadBegin={() => setUploading(true)}
        onClientUploadComplete={(files) => {
          setUploading(false);
          const url = files[0]?.ufsUrl;
          if (url) {
            setPreview(url);
            onChange(url);
          }
        }}
        onUploadError={(error) => {
          setUploading(false);
          alert(error.message);
        }}
        appearance={{
          button: {
            width: "100%",
            height: 44,
            borderRadius: 14,
            background: "white",
            color: "black",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "inherit",
            border: "none",
          },
          allowedContent: { color: "#71717a", fontSize: 12 },
        }}
        content={{
          button: ({ isUploading, uploadProgress }) =>
            isUploading || uploading
              ? `Uploading ${Math.round(uploadProgress)}%`
              : "Choose Cover Image",
          allowedContent: ({ isUploading }) =>
            isUploading ? undefined : "PNG, JPG or WEBP up to 4MB",
        }}
      />
    </div>
  );
}
