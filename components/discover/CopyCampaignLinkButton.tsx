"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyCampaignLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/iframe) — leave the button as-is.
    }
  };

  return (
    <Button variant="outline"  onClick={handleCopy} className="p-6 rounded-full w-12 h-12">
      {copied ? (
        <Check className="size-4 text-white" />
      ) : (
        <Copy className="size-4" />
      )}
     
    </Button>
  );
}
