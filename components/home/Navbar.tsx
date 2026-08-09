"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import LogoMark from "@/public/assets/logo-plain.svg";
import {
  AudienceToggle,
  type Audience,
} from "@/components/home/dual/AudienceToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  mode: Audience;
  onModeChange: (mode: Audience) => void;
}

export function Navbar({ mode, onModeChange }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const brand = mode === "brand";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl transition-all",
        brand
          ? "border-white/10 bg-[#0a0a0a]/75"
          : "border-transparent bg-background/80",
        !brand && scrolled && "border-border shadow-xs"
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Konnectika home"
          >
            <Image
              src={LogoMark}
              alt=""
              width={34}
              height={34}
              priority
              className="h-8 w-8"
            />
            <span
              className={cn(
                "text-lg font-extrabold tracking-tight",
                brand ? "text-white" : "text-foreground"
              )}
            >
              Konnectika
            </span>
          </Link>

          <div className="hidden md:block">
            <AudienceToggle mode={mode} onChange={onModeChange} />
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block">
              <Button
                variant="ghost"
               className={cn(
  "rounded-full px-4",
  brand
    ? "text-zinc-300 hover:bg-white/10 hover:text-white"
    : "text-black hover:bg-black/10 hover:text-black"
)}
              >
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                className={cn(
                  "rounded-full px-5 py-5.5",
                  brand
                    ? "bg-foreground text-background hover:bg-zinc-300"
                    : "bg-primary text-primary-foreground hover:bg-orange-400"
                )}
              >
                {brand ? "Launch a Campaign" : "Get Started"}
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex justify-center pb-3 md:hidden">
          <AudienceToggle mode={mode} onChange={onModeChange} />
        </div>
      </nav>
    </header>
  );
}
