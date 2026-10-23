"use client";

import { useState } from "react";
import { ImagePlus, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { Label } from "./ui/label";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

type LogoUploadProps = {
  value?: string | null;
  onChange: (url: string) => void;
  compact?: boolean;
};

export default function LogoUpload({ value, onChange, compact = false }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className={compact ? "relative flex h-[126px] w-[126px] flex-col items-center" : "space-y-3"}>
      {compact ? (
        <div className="flex h-[126px] w-[126px] items-center justify-center overflow-hidden rounded-[30px] bg-[#262626]">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Brand logo preview" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus aria-hidden="true" className="h-12 w-12 text-[#696969]" strokeWidth={2.5} />
          )}
        </div>
      ) : (
        <>
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
        </>
      )}
      <UploadButton<OurFileRouter, "brandLogo">
        endpoint="brandLogo"
        className={compact ? "absolute -bottom-2 -right-2 z-10" : undefined}
        onUploadBegin={() => setUploading(true)}
        onClientUploadComplete={(files) => {
          setUploading(false);
          const url = files[0]?.ufsUrl ?? files[0]?.url;
          if (url) { setPreview(url); onChange(url); }
        }}
        onUploadError={(error) => { setUploading(false); alert(error.message); }}
        appearance={{
          container: compact
            ? {
                position: "absolute",
                width: 50,
                height: 50,
                display: "block",
                margin: 0,
                padding: 0,
                border: "none",
                borderRadius: "9999px",
                background: "transparent",
              }
            : undefined,
          allowedContent: compact ? { display: "none" } : undefined,
          button: compact
            ? {
                width: 50,
                height: 50,
                margin: 0,
                padding: 0,
                border: "3px solid #141414",
                borderRadius: "9999px",
                background: "#f2f2f2",
                color: "#171717",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }
            : { borderRadius: 12, background: "#f97316", color: "white" },
        }}
        content={{
          button: () => compact
            ? <>
                <span className="sr-only">{preview ? "Change logo" : "Upload logo"}</span>
                {uploading
                  ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                  : <Pencil aria-hidden="true" className="h-5 w-5 fill-current" />}
              </>
            : uploading ? "Uploading…" : "Choose logo",
          allowedContent: () => compact ? null : "PNG, JPG or WEBP up to 2MB",
        }}
      />
      {compact && <span className="absolute top-[138px] whitespace-nowrap text-base text-[#d6d6d6]">Upload logo</span>}
    </div>
  );
}
