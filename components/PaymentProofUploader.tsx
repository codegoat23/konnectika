"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export default function PaymentProofUploader({
  onUploadComplete,
  className,
  label = "Upload receipt / screenshot",
}: {
  onUploadComplete: (urls: string[]) => void;
  className?: string;
  label?: string;
}) {
  return (
    <UploadButton<OurFileRouter, "paymentProof">
      endpoint="paymentProof"
      appearance={{ button: className }}
      content={{
        button: label,
        allowedContent: "Image up to 6MB",
      }}
      onClientUploadComplete={(files) => {
        const urls = files.map((file) => file.url);
        onUploadComplete(urls);
      }}
      onUploadError={(error) => {
        alert(error.message);
      }}
    />
  );
}