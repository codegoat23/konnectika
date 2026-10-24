"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const brand = mode === "brand";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const ctaHref = brand ? "/launch-campaign" : "https://krietas.com/signup";

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
        className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Konnectika home"
          >
            <Image
              src="/assets/logo-plain.svg"
              alt=""
              width={34}
              height={34}
              priority
              className="h-8 w-8"
            />
          </Link>

          <AudienceToggle mode={mode} onChange={onModeChange} />

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/discover"
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  brand
                    ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                    : "text-black hover:bg-black/10 hover:text-black"
                )}
              >
                Discover
              </Link>
              {!brand && (
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="rounded-full px-4 text-black hover:bg-black/10 hover:text-black"
                  >
                    Login
                  </Button>
                </Link>
              )}
              <Link href={ctaHref}>
                <Button
                  className={cn(
                    "rounded-full px-5 py-5.5",
                    brand
                      ? "bg-foreground text-background hover:bg-zinc-300"
                      : "bg-primary text-primary-foreground hover:bg-orange-400"
                  )}
                >
                  {brand ? "Launch a Campaign" : "Start earning"}
                </Button>
              </Link>
            </div>

            <button
              type="button"
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors md:hidden",
                brand
                  ? "text-white hover:bg-white/10"
                  : "text-foreground hover:bg-black/10"
              )}
              aria-label={
                menuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="relative size-5" aria-hidden="true">
                <Menu
                  className={cn(
                    "absolute inset-0 size-5 transition-all duration-300",
                    menuOpen
                      ? "rotate-90 scale-50 opacity-0"
                      : "rotate-0 scale-100 opacity-100"
                  )}
                />
                <X
                  className={cn(
                    "absolute inset-0 size-5 transition-all duration-300",
                    menuOpen
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-50 opacity-0"
                  )}
                />
              </span>
            </button>
          </div>
        </div>

        <div
          id="mobile-nav-menu"
          aria-hidden={!menuOpen}
          className={cn(
            "absolute inset-x-0 top-full border-b transition-all duration-300 md:hidden",
            brand
              ? "border-white/10 bg-[#0a0a0a]/95"
              : "border-border bg-background/95 backdrop-blur-xl",
            menuOpen
              ? "translate-y-0 opacity-100"
              : "invisible -translate-y-2 opacity-0"
          )}
        >
          <ul className="flex flex-col gap-1 px-4 py-4 sm:px-6">
            <li>
              <Link
                href="/discover"
                onClick={closeMenu}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  brand
                    ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                    : "text-black hover:bg-black/10 hover:text-black"
                )}
              >
                Discover
              </Link>
            </li>
            {!brand && (
              <li>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-black transition-colors hover:bg-black/10 hover:text-black"
                >
                  Login
                </Link>
              </li>
            )}
            <li>
              <Link href={ctaHref} onClick={closeMenu} className="mt-1 block">
                <Button
                  className={cn(
                    "w-full rounded-full px-5",
                    brand
                      ? "bg-foreground text-background hover:bg-zinc-300"
                      : "bg-primary text-primary-foreground hover:bg-orange-400"
                  )}
                >
                  {brand ? "Launch a Campaign" : "Start earning"}
                </Button>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
