"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Sparkles, Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type Audience = "creator" | "brand";

interface AudienceToggleProps {
  mode: Audience;
  onChange: (mode: Audience) => void;
}

const options = [
  { value: "creator" as const, label: "Creator", icon: Sparkles },
  { value: "brand" as const, label: "Brand", icon: Building2 },
];

export function AudienceToggle({ mode, onChange }: AudienceToggleProps) {
  const creatorRef = useRef<HTMLButtonElement>(null);
  const brandRef = useRef<HTMLButtonElement>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const ref = mode === "creator" ? creatorRef.current : brandRef.current;
    if (ref) {
      setThumb({ left: ref.offsetLeft, width: ref.offsetWidth });
    }
  }, [mode]);

  useLayoutEffect(() => {
    const onResize = () => {
      const ref = mode === "creator" ? creatorRef.current : brandRef.current;
      if (ref) {
        setThumb({ left: ref.offsetLeft, width: ref.offsetWidth });
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mode]);

  return (
    <div
      role="group"
      aria-label="Choose your experience"
      className="relative flex items-center rounded-full border border-border bg-muted p-1"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 rounded-full transition-[left,width] duration-300 ease-out",
          mode === "creator"
            ? "bg-primary shadow-md shadow-primary/40"
            : "bg-black shadow-lg ring-1 ring-inset ring-white/20"
        )}
        style={{ left: thumb.left, width: thumb.width }}
      />
      {options.map((option) => {
        const ref = option.value === "creator" ? creatorRef : brandRef;
        const active = mode === option.value;
        return (
          <button
            key={option.value}
            ref={ref}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors duration-300 sm:h-9 sm:gap-2 sm:px-5 sm:text-sm md:px-6",
              active ? "text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
