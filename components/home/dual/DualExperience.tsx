"use client";

import { useEffect, useState } from "react";

import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { CreatorHome } from "@/components/home/creator/CreatorHome";
import { BrandHome } from "@/components/home/brand/BrandHome";
import type { Audience } from "@/components/home/dual/AudienceToggle";

const STORAGE_KEY = "konnectika-audience";

export function DualExperience() {
  const [mode, setMode] = useState<Audience>("creator");

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved === "creator" || saved === "brand") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore persisted audience on first client mount; sessionStorage is unavailable during SSR.
        setMode(saved);
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }, []);

  const changeMode = (next: Audience) => {
    if (next === mode) return;
    setMode(next);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* sessionStorage unavailable */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      data-audience={mode}
      className="flex min-h-svh flex-col bg-background transition-colors duration-300"
    >
      <Navbar mode={mode} onModeChange={changeMode} />
      <main className="flex-1">
        <div
          key={mode}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {mode === "creator" ? <CreatorHome /> : <BrandHome />}
        </div>
      </main>
      <Footer mode={mode} />
    </div>
  );
}
