import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, User } from "lucide-react";

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
import Testimony from "./testimony";

function CampaignCard({ campaign }: { campaign: HomeCampaign }) {
  return (
    <article className="group relative flex h-[350px] flex-col overflow-hidden rounded-3xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Background image, full bleed */}
      <Image
        src={campaign.image}
        alt={`${campaign.brand} — ${campaign.title}`}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Bottom gradient scrim so overlaid text stays legible */}
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />


      

      
      
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
      <Testimony />

     

      <CTABanner
        tone="creator"
        badge="Join the community"
        headline="Your next brand collaboration is waiting"
        subtext="Create a free profile and start discovering campaigns that fit your creativity today."
        primaryLabel="Create your profile"
        primaryHref="/signup?role=CREATOR"
        secondaryLabel="Explore campaigns"
        secondaryHref="/discover"
      />
    </>
  );
}
