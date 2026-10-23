"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Campaign } from "@/types";
import { formatTZS } from "@/lib/utils";
import PlatformIcons from "./PlatformIcons";
import Logo from "@/public/assets/logo-plain.svg"
import Image from "next/image";

interface DiscoverHeroProps {
  featuredCampaigns: Campaign[];
  onJoin: (campaign: Campaign) => void;
  isLoading?: boolean;
}

export default function DiscoverHero({
  featuredCampaigns,
  onJoin,
  isLoading = false,
}: DiscoverHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const total = featuredCampaigns.length;
  const current = featuredCampaigns[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      if (animating || index === activeIndex) return;

      setAnimating(true);

      setTimeout(() => {
        setActiveIndex((index + total) % total);
        setAnimating(false);
      }, 200);
    },
    [animating, activeIndex, total]
  );

  const prev = () => goTo(activeIndex - 1);
  const next = () => goTo(activeIndex + 1);

  useEffect(() => {
    if (total <= 1) return;

    const timer = setInterval(() => {
      goTo(activeIndex + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeIndex, total, goTo]);

  if (!current) {
    return (
      <section
        aria-label="Discover campaigns"
        aria-busy={isLoading}
        className="relative min-h-[360px] w-full overflow-hidden sm:min-h-[460px]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/background/orange-abstract.webp')" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15"
        />
        <div className="relative z-10 flex min-h-[360px] flex-col justify-between px-6 py-7 sm:min-h-[460px] sm:px-8 sm:py-9">
          <div className="flex items-center py-1">
            <Image
              src={Logo}
              alt="Konnectika"
              width={180}
              height={34}
              priority
              className="h-auto w-full max-w-[150px] sm:max-w-[60px]"
            />
          </div>

          {isLoading ? (
            <div role="status" className="mb-2 max-w-2xl space-y-4">
              <span className="sr-only">Loading featured campaigns</span>
              <div className="h-3 w-24 animate-pulse rounded bg-white/30" />
              <div className="h-10 w-full max-w-xl animate-pulse rounded bg-white/30 sm:h-14" />
              <div className="h-5 w-72 max-w-full animate-pulse rounded bg-white/25" />
            </div>
          ) : (
            <div className="mb-2 max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/75 sm:text-sm">
                Discover
              </p>
              <h1 className="max-w-none whitespace-nowrap text-[clamp(1.25rem,4vw,3.25rem)] font-medium leading-[1.08] tracking-tight text-white">
                Campaigns worth joining
              </h1>
              <p className="mt-3 max-w-md text-base leading-relaxed text-white/80 sm:text-lg">
                Find campaigns that align with  audience, and start collaborating with top brands today.
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="relative min-h-[400px] w-full overflow-hidden sm:min-h-[420px]">
      
      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `
            linear-gradient(
              to right,
              rgba(13,13,13,0.9),
              rgba(13,13,13,0.6),
              rgba(13,13,13,0.2)
            ),
            url(${current.thumbnailPic})
          `,
        }}
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/20 to-transparent" />
      

      {/* CONTENT */}
      <div className="relative z-10 flex min-h-[400px] h-full flex-col justify-between px-4 py-6 sm:min-h-[420px] sm:px-8 sm:py-10">
                    <div className="flex items-center justify-baseline  py-1">
  <Image
    src={Logo}
    alt="Konnectika"
    width={180}
    height={34}
    priority
    className="h-auto w-full max-w-[150px] sm:max-w-[190px]"
  />
</div>
        <div
          className={`transition-all duration-200 ${
            animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          
          {/* BRAND */}
          <div className="mb-4 mt-8 flex items-center gap-3 sm:mt-10">
            <div
              className="rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{
                background: current.thumbnailColor,
                width: 35,
                height: 35,
              }}
            >
              {current.thumbnailInitials}
            </div>

            <span className="text-white text-sm font-medium">
              {current.brand}
            </span>

               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    {/* Gold gradient */}
    <linearGradient id="gold3d" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFF2B0"/>
      <stop offset="35%" stop-color="#F7C948"/>
      <stop offset="70%" stop-color="#D4A017"/>
      <stop offset="100%" stop-color="#8A5A0A"/>
    </linearGradient>

    {/* Highlight shine */}
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.9)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>

    {/* Soft shadow */}
    <filter id="softShadow">
      <feDropShadow dx="0" dy="0.8" stdDeviation="0.8" flood-color="#000" flood-opacity="0.35"/>
    </filter>

    {/* Inner glow */}
    <filter id="innerGlow">
      <feGaussianBlur stdDeviation="0.6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  {/* Badge shape */}
  <path
    d="M16 8.375C16 8.93437 15.8656 9.45312 15.5969 9.92813C15.3281 10.4031 14.9688 10.775 14.5156 11.0344C14.5281 11.1188 14.5344 11.25 14.5344 11.4281C14.5344 12.275 14.25 12.9937 13.6875 13.5875C13.1219 14.1844 12.4406 14.4812 11.6438 14.4812C11.2875 14.4812 10.9469 14.4156 10.625 14.2844C10.375 14.7969 10.0156 15.2094 9.54375 15.525C9.075 15.8438 8.55937 16 8 16C7.42812 16 6.90938 15.8469 6.44688 15.5344C5.98125 15.225 5.625 14.8094 5.375 14.2844C5.05312 14.4156 4.71562 14.4812 4.35625 14.4812C3.55937 14.4812 2.875 14.1844 2.30312 13.5875C1.73125 12.9937 1.44687 12.2719 1.44687 11.4281C1.44687 11.3344 1.45938 11.2031 1.48125 11.0344C1.02813 10.7719 0.66875 10.4031 0.4 9.92813C0.134375 9.45312 0 8.93437 0 8.375C0 7.78125 0.15 7.23438 0.446875 6.74062C0.74375 6.24687 1.14375 5.88125 1.64375 5.64375C1.5125 5.2875 1.44687 4.92812 1.44687 4.57188C1.44687 3.72813 1.73125 3.00625 2.30312 2.4125C2.875 1.81875 3.55937 1.51875 4.35625 1.51875C4.7125 1.51875 5.05312 1.58438 5.375 1.71563C5.625 1.20312 5.98438 0.790625 6.45625 0.475C6.925 0.159375 7.44063 0 8 0C8.55937 0 9.075 0.159375 9.54375 0.471875C10.0125 0.7875 10.375 1.2 10.625 1.7125C10.9469 1.58125 11.2844 1.51562 11.6438 1.51562C12.4406 1.51562 13.1219 1.8125 13.6875 2.40937C14.2531 3.00625 14.5344 3.725 14.5344 4.56875C14.5344 4.9625 14.475 5.31875 14.3562 5.64062C14.8562 5.87813 15.2563 6.24375 15.5531 6.7375C15.85 7.23438 16 7.78125 16 8.375Z"
    fill="url(#gold3d)"
    filter="url(#softShadow)"
  />

  {/* Shine highlight (top-left glow) */}
  <path
    d="M4 3 C6 1.5, 9 1.5, 11 3 C9 2.2, 6 2.2, 4 3 Z"
    fill="url(#shine)"
    opacity="0.6"
  />

  {/* Check mark */}
  <path
    d="M7.65938 10.7844L10.9625 5.8375C11.0469 5.70625 11.0719 5.5625 11.0437 5.40938C11.0125 5.25625 10.9344 5.13438 10.8031 5.05312C10.6719 4.96875 10.5281 4.94063 10.375 4.9625C10.2188 4.9875 10.0938 5.0625 10 5.19375L7.09062 9.56875L5.75 8.23125C5.63125 8.1125 5.49375 8.05625 5.34062 8.0625C5.18437 8.06875 5.05 8.125 4.93125 8.23125C4.825 8.3375 4.77187 8.47187 4.77187 8.63437C4.77187 8.79375 4.825 8.92813 4.93125 9.0375L6.77187 10.8781L6.8625 10.95C6.96875 11.0219 7.07812 11.0562 7.18437 11.0562C7.39375 11.0531 7.55313 10.9656 7.65938 10.7844Z"
    fill="white"
  />
</svg>
          </div>

          {/* TITLE */}
          <h1 className="mb-3 max-w-lg text-2xl font-bold leading-tight text-white sm:text-3xl">
            {current.name}
          </h1>

          {/* META */}
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-zinc-400 text-sm">{current.category}</span>
            <span className="text-zinc-600">|</span>

            <span className="text-white text-sm font-semibold">
              TZS {formatTZS(current.paymentRate)}
              <span className="text-zinc-400 font-normal"> / Content</span>
            </span>

            <span className="text-zinc-600">|</span>

            <span className="text-zinc-300 text-sm">
              TZS {formatTZS(current.budgetTotal)}
            </span>
          </div>

          {/* ACTIONS */}
          <div className="mt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            
            <button
              onClick={() => onJoin(current)}
              className="bg-foreground text-background text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-foreground/90 active:scale-95 transition-all"
            >
              Join Campaign
            </button>

            <PlatformIcons platforms={current.platforms} size="md" />

            {/* DOTS */}
            <div className="ml-1 flex items-center gap-1.5 sm:ml-2">
              {featuredCampaigns.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === activeIndex ? 20 : 6,
                    height: 6,
                    background:
                      i === activeIndex
                        ? "#fff"
                        : "rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </div>

            {/* ARROWS */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                onClick={next}
                className="w-10 h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
