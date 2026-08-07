import Link from "next/link";
import { ArrowRight, Check, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/Reveal";
import { HomeIcon } from "@/components/home/icon-map";
import { SectionHeading } from "@/components/home/shared/SectionHeading";
import { BenefitsGrid } from "@/components/home/shared/BenefitsGrid";
import { TestimonialsSection } from "@/components/home/shared/TestimonialsSection";
import { CTABanner } from "@/components/home/shared/CTABanner";
import {
  brandBenefits,
  brandCreators,
  brandTestimonials,
  brandWorkflow,
  type BrandCreator,
} from "@/data/home/brand";

const whyChecks = [
  "Every creator is vetted for authenticity and reach",
  "Campaigns launch in minutes with smart briefs",
  "Transparent budgets and instant performance reporting",
  "Payments handled securely for you and creators",
];

const categoryChips = [
  "Beauty & Lifestyle",
  "Technology",
  "Food & Travel",
  "Gaming",
  "Fitness & Wellness",
  "Music & Culture",
];

function CreatorRow({ creator }: { creator: BrandCreator }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{
          background: `linear-gradient(135deg, ${creator.color}, ${creator.color}cc)`,
        }}
        aria-hidden
      >
        {creator.initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{creator.name}</p>
        <p className="truncate text-xs text-zinc-400">
          {creator.handle} · {creator.category}
        </p>
      </div>
      <div className="ml-auto hidden text-right sm:block">
        <p className="text-sm font-bold text-white">{creator.followers}</p>
        <p className="text-[11px] text-zinc-500">{creator.engagement} eng.</p>
      </div>
      <span className="shrink-0 rounded-md bg-primary/15 px-2 py-1 text-[11px] font-bold text-primary">
        {creator.trustScore}
      </span>
    </li>
  );
}

export function BrandSections() {
  return (
    <>
      <section
        id="why-konnectika"
        aria-labelledby="why-konnectika-heading"
        className="scroll-mt-24"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                label="Why Konnectika"
                title="The smarter way to work with creators"
                subtitle="Skip the DMs, the guesswork, and the unreliable influencers. Run creator campaigns with the same rigor as your paid media."
                align="left"
              />
              <Reveal delay={120}>
                <ul className="mt-8 space-y-4">
                  {whyChecks.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                        <Check className="size-3" />
                      </span>
                      <p className="text-sm leading-relaxed text-zinc-300">
                        {item}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="mt-9">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="h-12 rounded-full bg-foreground px-7 text-base font-semibold text-background hover:bg-zinc-300"
                    >
                      Start a Campaign
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </Link>
                </div>
              </Reveal>
            </div>
            <Reveal delay={120}>
              <BenefitsGrid benefits={brandBenefits} columns={2} />
            </Reveal>
          </div>
        </div>
      </section>

      <section
        id="workflow"
        aria-labelledby="workflow-heading"
        className="scroll-mt-24"
      >
        <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <SectionHeading
            label="How it works"
            title="From brief to results in four steps"
            subtitle="A streamlined workflow built for marketing teams who value speed and control."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {brandWorkflow.map((step, i) => (
              <Reveal key={step.step} delay={i * 90}>
                <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-card p-6">
                  <span
                    className="absolute right-4 top-3 text-5xl font-extrabold leading-none text-white/[0.06]"
                    aria-hidden
                  >
                    {step.step}
                  </span>
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <HomeIcon name={step.icon} className="size-5" />
                  </span>
                  <h3 className="mt-5 text-base font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="marketplace"
        aria-labelledby="marketplace-heading"
        className="scroll-mt-24"
      >
        <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <SectionHeading
                label="Creator marketplace"
                title="Browse Africa's best creators"
                subtitle="Filter by niche, platform, and engagement to build your dream roster in minutes."
                align="left"
              />
              <Reveal delay={120}>
                <div className="mt-8 flex flex-wrap gap-2">
                  {categoryChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-9">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="h-12 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-orange-400"
                    >
                      Launch your campaign
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </Link>
                </div>
              </Reveal>
            </div>
            <Reveal delay={140}>
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-card">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                  <p className="text-sm font-bold text-white">
                    Top creators this week
                  </p>
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400">
                    <Search className="size-3.5" /> Search creators
                  </div>
                </div>
                <ul className="divide-y divide-white/[0.06]">
                  {brandCreators.slice(0, 4).map((creator) => (
                    <CreatorRow key={creator.id} creator={creator} />
                  ))}
                </ul>
                <div className="border-t border-white/10 px-5 py-3 text-center">
                  <Link
                    href="/signup"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Browse all 10K+ creators
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <TestimonialsSection
        label="Brand results"
        title="Teams that scaled with Konnectika"
        testimonials={brandTestimonials}
        highlightColor="emerald"
      />

      <CTABanner
        tone="brand"
        badge="Built for performance"
        headline="Launch your first campaign this week"
        subtext="Join the brands discovering Africa's best creators — from brief to published content in days."
        primaryLabel="Start a Campaign"
        primaryHref="/signup"
        secondaryLabel="Explore the marketplace"
        secondaryHref="#marketplace"
      />
    </>
  );
}
