import Link from "next/link";
import Image from "next/image";
import {
  FaArrowRight,
  FaBriefcase,
  FaChartLine,
  FaHandshake,
  FaWallet,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/Reveal";
import { PlatformIcon } from "@/components/home/PlatformIcon";
import { Steps } from "@/components/home/shared/Steps";
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

const creatorBenefitIcons: Record<string, IconType> = {
  Handshake: FaHandshake,
  Briefcase: FaBriefcase,
  Wallet: FaWallet,
  TrendingUp: FaChartLine,
};

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
        <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-32">
          <Reveal className="text-center">
            <span className="border border-black/10 bg-card text-xs font-medium text-black p-3 rounded-full">
              Why creators love it
            </span>
            <h2
              id="benefits-heading"
              className="mx-auto mt-4 max-w-4xl text-balance font-sans text-3xl leading-[1.06] tracking-[-0.045em] text-zinc-950 sm:text-6xl lg:text-7xl font-semibold"
            >
              Everything you need to create {" "}
              <span className="italic text-orange-600">income.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7">
              Find the right brands, build work you&apos;re proud of, and grow with
              every collaboration.
            </p>
            <Link href="/discover" className="mt-7 inline-block">
              <Button className="h-11 rounded-full bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-orange-600">
                Explore campaigns
                <FaArrowRight className="ml-1 size-4" aria-hidden="true" />
              </Button>
            </Link>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:items-stretch">
            {creatorBenefits.map((benefit, index) => {
              const BenefitIcon = creatorBenefitIcons[benefit.icon] ?? FaHandshake;
              const colors = [
                "bg-[#FFF1E8]",
                "bg-[#FFE5D2]",
                "bg-[#FFD7B8]",
                "bg-[#FFC99F]",
              ];

              return (
                <Reveal key={benefit.title} delay={index * 75}>
                  <article
                    className={`group relative flex min-h-[300px] h-full flex-col overflow-hidden rounded-[2rem] p-6 sm:min-h-[340px] sm:p-7 ${colors[index]}`}
                  >
                    <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-zinc-950/10 bg-white/45 text-zinc-950">
                      <BenefitIcon className="size-4" aria-hidden="true" />
                    </span>
                    <h3 className="relative z-10 mt-6 max-w-[13rem] font-sans text-xl leading-[1.08] tracking-[-0.035em] text-zinc-950 sm:text-[1.7rem]">
                      {benefit.title}
                    </h3>
                    <p className="relative z-10 mt-3 max-w-[15rem] text-sm leading-5 text-zinc-800/75">
                      {benefit.description}
                    </p>
                    <BenefitIcon
                      className="absolute -bottom-5 -right-4 size-36 -rotate-12 text-zinc-950/[0.09] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105 sm:size-40"
                      aria-hidden="true"
                    />
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="featured-campaigns"
        aria-labelledby="featured-campaigns-heading"
        className="scroll-mt-24"
      >
        
      </section>
      <Testimony />

     

      <CTABanner
        tone="creator"
        badge="Join the community"
        headline="Your next brand collaboration is waiting"
        subtext="Create a free profile and start discovering campaigns that fit your creativity today."
        primaryLabel="Create your profile"
        primaryHref="https://krietas.com/signup"
        secondaryLabel="Explore campaigns"
        secondaryHref="/discover"
      />
    </>
  );
}
