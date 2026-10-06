import Image from "next/image";
import { MousePointer2, Plus, Users } from "lucide-react";
import { Reveal } from "@/components/home/Reveal";
import PlatformIcons from "@/components/discover/PlatformIcons";

export default function BrandSolution() {
  return (
    <section aria-labelledby="brand-solution-heading" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <h1 id="brand-solution-heading" className="text-center text-3xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Introducing the new solution
          </h1>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-14">
          <Reveal delay={60}>
            <article className="h-full overflow-hidden rounded-[28px]  bg-white/[0.035] p-4 sm:p-5">
              <div className="flex h-[250px] items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.06] to-transparent p-2 sm:h-[290px] sm:p-3">
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-[#101010]">
                  <div className="absolute inset-x-5 top-5 h-2 rounded-full bg-white/[0.06] sm:inset-x-8 sm:top-8" />
                  <div className="absolute left-5 top-12 h-24 w-16 rounded-xl  bg-white/[0.025] sm:left-8 sm:top-16 sm:h-32 sm:w-24" />
                  <div className="absolute right-5 top-12 h-24 w-16 rounded-xl bg-white/[0.025] sm:right-8 sm:top-16 sm:h-32 sm:w-24" />
                  <button
                    type="button"
                    className="relative z-10 inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-lg shadow-black/30 sm:px-6 sm:py-3.5"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New campaign
                  </button>
                  <MousePointer2
                    aria-hidden="true"
                    className="absolute left-[62%] top-[57%] z-20 size-7 fill-zinc-900  sm:size-8"
                  />
                </div>
              </div>
              <div className="px-2 pb-2 pt-6 text-center sm:px-4 sm:pt-7">
                <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Launch your campaign</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-base">Set your budget, explain what content you want, and choose how creators get paid.</p>
              </div>
            </article>
          </Reveal>

          <Reveal delay={140}>
            <article className="h-full overflow-hidden rounded-[28px]  bg-white/[0.035] p-4 sm:p-5">
              <div className="relative h-[250px] overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.06] to-transparent sm:h-[290px]">
                <div className="absolute inset-0 overflow-hidden pt-5">
                  <div className="animate-marquee flex w-max items-start gap-2 px-2 sm:gap-3 sm:px-3" aria-label="Creators making campaign content">
                    {[0, 1].map((copy) => (
                      <div key={copy} className="flex gap-2 sm:gap-3" aria-hidden={copy === 1}>
                        {["/content/1.mp4", "/content/2.mp4", "/content/3.mp4"].map((src, index) => (
                          <div key={`${copy}-${src}`} className={`relative h-[190px] w-[112px] shrink-0 overflow-hidden rounded-xl  sm:h-[225px] sm:w-[138px] ${index === 1 ? "mt-0" : index === 2 ? "mt-5" : "mt-7"}`}>
                            <video
                              src={src}
                              autoPlay
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              aria-label={copy === 0 ? `Creator campaign video ${index + 1}` : undefined}
                              className="absolute inset-0 size-full object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#141414] to-transparent" />
              </div>
              <div className="px-2 pb-2 pt-6 text-center sm:px-4 sm:pt-7">
                <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Creators make the content</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-base">Creators apply, post videos about your brand, and submit them to your campaign.</p>
              </div>
            </article>
          </Reveal>

          <Reveal delay={220}>
            <article className="h-full overflow-hidden rounded-[28px]  bg-white/[0.035] p-4 sm:p-5">
              <div className="overflow-hidden rounded-2xl bg-[#141414]">
                <div className="relative h-[82px] sm:h-[105px]">
                  <Image src="/thumbnails/banner2.jpg" alt="Konnectika creator campaign banner" fill sizes="(max-width: 768px) 90vw, 30vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate text-xs font-semibold text-white sm:text-sm">Konnectika Campaign Creation</h4>
                      <p className="mt-1 flex items-center gap-1.5 text-[9px] text-zinc-400 sm:text-[10px]">
                        <span className="flex size-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white">K</span>
                        Konnectika
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-medium text-zinc-300">
                      <Users className="size-3" /> 128
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <PlatformIcons platforms={["instagram", "tiktok", "youtube"]} />
                    <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-zinc-300">
                      TZS <strong className="font-semibold text-white">25,000</strong> /post
                    </span>
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[62%] rounded-full bg-white" />
                  </div>
                </div>
              </div>
              <div className="px-2 pb-2 pt-6 text-center sm:px-4 sm:pt-7">
                <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">We handle everything else</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-base">Content Rewards tracks the views, calculates rewards, and pays creators automatically.</p>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
