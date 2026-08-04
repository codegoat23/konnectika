"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Campaign } from "@/types";
import { formatTZS } from "@/lib/utils";
import PlatformIcons from "./PlatformIcons";
import { Bricolage_Grotesque } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

interface DiscoverHeroProps {
  featuredCampaigns: Campaign[];
  onJoin: (campaign: Campaign) => void;
}

export default function DiscoverHero({ featuredCampaigns, onJoin }: DiscoverHeroProps) {
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

  if (!current) return null;

  return (
    <div className="relative w-full min-h-[420px] rounded-2xl overflow-hidden ">
      
      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `
            linear-gradient(
              to right,
              rgba(13,13,13,0.95),
              rgba(13,13,13,0.6),
              rgba(13,13,13,0.2)
            ),
            url(${current.thumbnailPic})
          `,
        }}
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/70 to-transparent" />
      

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col justify-between h-full px-8 py-10 min-h-[420px]">
        <div>
        <a href="/" className={`text-white flex items-center gap-2 self-center font-bold text-[36px] ${bricolage.className}`}>
          Konnectika
        </a>
      </div>
        <div
          className={`transition-all duration-200 ${
            animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          
          {/* BRAND */}
          <div className="flex items-center gap-3 mb-4 mt-10">
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

            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="8" fill="#F07837" />
              <path
                d="M5 8l2 2 4-4"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* TITLE */}
          <h1 className="text-white text-3xl font-bold leading-tight mb-3 max-w-lg">
            {current.name}
          </h1>

          {/* META */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="text-zinc-400 text-sm">{current.category}</span>
            <span className="text-zinc-600">|</span>

            <span className="text-white text-sm font-semibold">
              TZS {formatTZS(current.paymentRate)}
              <span className="text-zinc-400 font-normal"> / 1k views</span>
            </span>

            <span className="text-zinc-600">|</span>

            <span className="text-zinc-300 text-sm">
              TZS {formatTZS(current.budgetTotal)}
            </span>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4 flex-wrap mt-2">
            
            <button
              onClick={() => onJoin(current)}
              className="bg-white text-black text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-zinc-100 active:scale-95 transition-all"
            >
              Join Campaign
            </button>

            <PlatformIcons platforms={current.platforms} size="md" />

            {/* DOTS */}
            <div className="flex items-center gap-1.5 ml-2">
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