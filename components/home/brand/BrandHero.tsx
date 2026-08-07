import Link from "next/link";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/Reveal";
import {
  brandCreators,
  brandHeroStats,
  type BrandCreator,
} from "@/data/home/brand";

const performanceBars = [55, 70, 48, 82, 64, 92];

function CreatorMiniCard({ creator }: { creator: BrandCreator }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${creator.color}, ${creator.color}cc)`,
          }}
          aria-hidden
        >
          {creator.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-white">
            {creator.name}
          </p>
          <p className="truncate text-[10px] text-zinc-400">
            {creator.followers} followers
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-semibold text-zinc-300">
          {creator.category}
        </span>
        <span className="shrink-0 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
          {creator.trustScore}
        </span>
      </div>
    </div>
  );
}

function PerformanceCard() {
  return (
    <div className="rounded-3xl border border-white/10 bg-card p-5 shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white">Campaign performance</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <TrendingUp className="size-3.5" /> +72% ROI
        </span>
      </div>
      <div className="mt-4 flex h-20 items-end gap-2">
        {performanceBars.map((height, i) => (
          <div
            key={i}
            className="animate-rise flex-1 rounded-t-md bg-gradient-to-t from-primary/60 to-primary"
            style={{ height: `${height}%`, animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500">
        <span>Reach 2.4M</span>
        <span>Engagement 8.1%</span>
      </div>
    </div>
  );
}

export function BrandHero() {
  return (
    <section
      aria-labelledby="brand-hero-heading"
      className="relative overflow-hidden"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 22% 20%, rgba(249,115,22,0.14), transparent 45%), radial-gradient(circle at 85% 75%, rgba(249,115,22,0.08), transparent 45%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(circle at 50% 30%, black, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 30%, black, transparent 78%)",
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-semibold text-zinc-200 backdrop-blur">
                <Sparkles className="size-4 text-primary" /> For Brands
              </span>
              <h1
                id="brand-hero-heading"
                className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
              >
                Find The Creators Your{" "}
                <span className="text-primary">Audience Trusts</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                Discover vetted creators across Africa, launch campaigns in
                minutes, and measure real impact — all from one dashboard.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="h-12 w-full rounded-full bg-foreground px-7 text-base font-semibold text-background hover:bg-zinc-300 sm:w-auto"
                  >
                    Start a Campaign
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </Link>
                <Link href="#marketplace">
                  <Button
                    size="lg"
                    className="h-12 w-full rounded-full border-white/20 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur hover:bg-white/10 sm:w-auto"
                  >
                    Explore Creators
                  </Button>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
                {brandHeroStats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-extrabold tracking-tight text-white">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <div className="relative">
                <div className="rounded-[28px] border border-white/10 bg-card p-6 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">
                        Creator network
                      </p>
                      <p className="text-xs text-zinc-400">
                        Vetted voices across 5 markets
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                      <ShieldCheck className="size-3.5" /> 10K+ verified
                    </span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {brandCreators.map((creator) => (
                      <CreatorMiniCard key={creator.id} creator={creator} />
                    ))}
                  </div>
                </div>

                <Reveal delay={220} className="absolute -top-8 right-4 w-56 lg:-right-6 lg:w-64">
                  <div className="animate-float">
                    <PerformanceCard />
                  </div>
                </Reveal>

                <Reveal delay={320} className="absolute -bottom-6 -left-3">
                  <div
                    className="animate-float flex items-center gap-2 rounded-full border border-white/15 bg-card px-3.5 py-2 text-xs font-semibold text-zinc-200 shadow-xl"
                    style={{ animationDelay: "1.1s" }}
                  >
                    <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="size-2.5" />
                    </span>
                    New application · just now
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
