"use client";

import { useState } from "react";

import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";
import { CreatorHome } from "@/components/home/creator/CreatorHome";
import { BrandHome } from "@/components/home/brand/BrandHome";
import type { Audience } from "@/components/home/dual/AudienceToggle";

export function DualExperience() {
  const [mode, setMode] = useState<Audience>("brand");

  const changeMode = (next: Audience) => {
    if (next === mode) return;
    setMode(next);
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
