import Link from "next/link";
import {
  ArrowRight,
  Check,
  Heart,
  MessageCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/Reveal";
import { PlatformIcon } from "@/components/home/PlatformIcon";
import {
  creatorCampaigns,
  creatorHeroStats,
  creatorTestimonials,
  type HomeCampaign,
} from "@/data/home/creator";
import type { HomePlatform } from "@/data/home";
import { cn, formatTZS } from "@/lib/utils";

const earningsBars = [42, 68, 55, 80, 63, 92];

function EarningsCard() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-primary/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Total earned
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            TZS {formatTZS(1200000)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
          <TrendingUp className="size-3.5" /> +32%
        </span>
      </div>
      <div className="mt-4 flex h-24 items-end gap-2">
        {earningsBars.map((height, i) => (
          <div
            key={i}
            className="animate-rise flex-1 rounded-t-md bg-gradient-to-t from-primary/70 to-primary"
            style={{ height: `${height}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Campaign payouts</span>
        <span>Last 30 days</span>
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
}: {
  profile: (typeof creatorTestimonials)[number];
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-lg shadow-primary/5">
      <div className="flex items-center gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{
            background: `linear-gradient(135deg, ${profile.color}, ${profile.color}cc)`,
          }}
          aria-hidden
        >
          {profile.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {profile.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {profile.role}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-extrabold text-foreground">128K</p>
          <p className="text-[11px] text-muted-foreground">followers</p>
        </div>
      </div>
    </div>
  );
}

function SocialPostCard({
  platform,
  text,
}: {
  platform: HomePlatform;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-lg shadow-primary/5">
      <div className="flex items-center gap-2.5">
        <PlatformIcon platform={platform} />
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-foreground">
            @amara.creates
          </p>
          <p className="text-[11px] text-muted-foreground">Lagos, NG</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Heart className="size-3.5 text-rose-500" /> 128
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="size-3.5" /> 24
        </span>
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: HomeCampaign }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-lg shadow-primary/5">
      <div className="flex items-center gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white"
          style={{ backgroundColor: campaign.color }}
          aria-hidden
        >
          {campaign.brand.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {campaign.brand}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {campaign.title}
          </p>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          TZS {formatTZS(campaign.reward)}
        </span>
      </div>
    </div>
  );
}

function ApprovedChip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-card px-3.5 py-2 text-xs font-semibold text-emerald-600 shadow-lg",
        className
      )}
    >
      <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="size-2.5" />
      </span>
      Submission approved
    </div>
  );
}

export function CreatorHero() {
  const featured = creatorCampaigns[0];
  const profile = creatorTestimonials[0];

  return (
    <section
      aria-labelledby="creator-hero-heading"
      className="relative overflow-hidden"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 28% 18%, rgba(249,115,22,0.09), transparent 55%), radial-gradient(circle at 82% 85%, rgba(251,191,36,0.1), transparent 55%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, #e4e4e7 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage:
              "radial-gradient(circle at 50% 40%, black, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 40%, black, transparent 78%)",
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                <Sparkles className="size-4" /> For Creators
              </span>
              <h1
                id="creator-hero-heading"
                className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              >
                Turn Your Creativity Into{" "}
                <span className="text-primary">Real Opportunities</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Discover campaigns from brands, create authentic content, and
                get rewarded for your influence.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/discover">
                  <Button
                    size="lg"
                    className="h-12 w-full rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-orange-400 sm:w-auto"
                  >
                    Explore Campaigns
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </Link>
                <Link href="/signup?role=CREATOR">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full rounded-full border-border px-7 text-base font-semibold sm:w-auto"
                  >
                    Create Creator Profile
                  </Button>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
                {creatorHeroStats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-extrabold tracking-tight text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <div className="hidden lg:block" aria-hidden>
                <div className="relative">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-6">
                      <EarningsCard />
                      <SocialPostCard
                        platform={featured.platform}
                        text={`Just submitted my application for the ${featured.brand} ${featured.title} campaign. Wish me luck!`}
                      />
                    </div>
                    <div className="flex flex-col gap-6 pt-16">
                      <div className="animate-float">
                        <ProfileCard profile={profile} />
                      </div>
                      <div
                        className="animate-float"
                        style={{ animationDelay: "1.4s" }}
                      >
                        <CampaignCard campaign={featured} />
                      </div>
                    </div>
                  </div>
                  <ApprovedChip className="absolute -top-4 right-3 animate-float" />
                  <div
                    className="animate-float absolute -bottom-6 -left-3"
                    style={{ animationDelay: "0.7s" }}
                  >
                    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-lg">
                      <Sparkles className="size-3.5 text-primary" /> 3 new
                      campaign matches
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 lg:hidden">
                <EarningsCard />
                <ProfileCard profile={profile} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
