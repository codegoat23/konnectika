import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/Reveal";
import { PlatformIcon } from "@/components/home/PlatformIcon";
import { SectionHeading } from "@/components/home/shared/SectionHeading";
import { Steps } from "@/components/home/shared/Steps";
import { BenefitsGrid } from "@/components/home/shared/BenefitsGrid";
import { TestimonialsSection } from "@/components/home/shared/TestimonialsSection";
import { CTABanner } from "@/components/home/shared/CTABanner";
import {
  creatorBenefits,
  creatorCampaigns,
  creatorSteps,
  creatorTestimonials,
  type HomeCampaign,
} from "@/data/home/creator";
import { formatTZS } from "@/lib/utils";

function CampaignCard({ campaign }: { campaign: HomeCampaign }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[20/10] overflow-hidden">
        <Image
          src={campaign.image}
          alt={`${campaign.brand} — ${campaign.title}`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {campaign.badge}
        </span>
        <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-sm font-extrabold text-zinc-900">
          TZS {formatTZS(campaign.reward)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold text-white"
            style={{ backgroundColor: campaign.color }}
            aria-hidden
          >
            {campaign.brand.charAt(0)}
          </span>
          <span className="text-sm font-bold text-foreground">
            {campaign.brand}
          </span>
          <span className="ml-auto">
            <PlatformIcon platform={campaign.platform} />
          </span>
        </div>
        <h3 className="mt-3 text-base font-bold text-foreground">
          {campaign.title}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {campaign.category} · {campaign.applicants} applicants
        </p>
        <Link
          href="/discover"
          className="mt-auto pt-4"
          aria-label={`Apply to ${campaign.title} by ${campaign.brand}`}
        >
         
        </Link>
      </div>
    </article>
  );
}

export function CreatorSections() {
  return (
    <>
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="scroll-mt-24"
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                label="How it works"
                title="From discovery to payment in three simple steps"
                subtitle="Browse campaigns that fit your niche, submit content you're proud of, and get paid when brands approve it."
                align="left"
              />
              <Reveal delay={120}>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link href="/discover">
                    <Button
                      size="lg"
                      className="h-11 rounded-full bg-primary px-6 text-primary-foreground hover:bg-orange-400"
                    >
                      Browse Campaigns
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </Link>
                  <Link
                    href="#featured-campaigns"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    See featured campaigns
                  </Link>
                </div>
              </Reveal>
            </div>
            <Reveal delay={120}>
              <div className="rounded-[28px] border border-border bg-card p-8 shadow-sm sm:p-10">
                <Steps steps={creatorSteps} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section
        id="benefits"
        aria-labelledby="benefits-heading"
        className="scroll-mt-24"
      >
        <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <SectionHeading
            label="Why creators love it"
            title="Everything you need to turn followers into income"
            subtitle="Konnectika handles discovery, briefs, and payments so you can focus on making great content."
          />
          <div className="mt-14">
            <Reveal>
              <BenefitsGrid benefits={creatorBenefits} />
            </Reveal>
          </div>
        </div>
      </section>

      <section
        id="featured-campaigns"
        aria-labelledby="featured-campaigns-heading"
        className="scroll-mt-24"
      >
        <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <SectionHeading
            label="Featured campaigns"
            title="Brands looking for creators like you"
            subtitle="Real campaigns, real budgets. Find the ones that match your craft."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creatorCampaigns.map((campaign, i) => (
              <Reveal key={campaign.id} delay={(i % 3) * 90}>
                <CampaignCard campaign={campaign} />
              </Reveal>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/discover">
              <Button
                size="lg"
                className="h-12 rounded-full bg-primary px-7 text-primary-foreground hover:bg-orange-400"
              >
                View all campaigns
                <ArrowRight data-icon="inline-end" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <TestimonialsSection
        label="Success stories"
        title="Creators turning passion into pay"
        testimonials={creatorTestimonials}
        highlightColor="orange"
      />

      <CTABanner
        tone="creator"
        badge="Join the community"
        headline="Your next brand collaboration is waiting"
        subtext="Create a free profile and start discovering campaigns that fit your creativity today."
        primaryLabel="Create your profile"
        primaryHref="/signup"
        secondaryLabel="Explore campaigns"
        secondaryHref="/discover"
      />
    </>
  );
}
