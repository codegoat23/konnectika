import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/home/Reveal";
import { cn } from "@/lib/utils";

interface CTABannerProps {
  tone: "creator" | "brand";
  badge: string;
  headline: string;
  subtext?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function CTABanner({
  tone,
  badge,
  headline,
  subtext,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CTABannerProps) {
  const creator = tone === "creator";

  return (
    <section aria-label={headline} className="scroll-mt-24">
      <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
        <Reveal>
          <div
            className={cn(
              "relative overflow-hidden rounded-[32px] px-6 py-16 text-center sm:px-12 lg:py-20",
              creator
                ? "bg-gradient-to-br from-primary via-orange-500 to-amber-500"
                : "border border-white/10 bg-card"
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
              aria-hidden
            />
            <div
              className={cn(
                "pointer-events-none absolute size-72 rounded-full blur-3xl",
                creator
                  ? "-right-24 -top-24 bg-white/15"
                  : "-right-20 top-0 bg-primary/25"
              )}
              aria-hidden
            />
            <div
              className={cn(
                "pointer-events-none absolute size-72 rounded-full blur-3xl",
                creator
                  ? "-bottom-28 -left-16 bg-black/15"
                  : "-bottom-24 -left-20 bg-primary/15"
              )}
              aria-hidden
            />

            <div className="relative">
             
              <h2
                className={cn(
                  "mx-auto mt-6 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl",
                  creator ? "text-white" : "text-white"
                )}
              >
                {headline}
              </h2>
              {subtext && (
                <p
                  className={cn(
                    "mx-auto mt-5 max-w-lg text-base",
                    creator ? "text-white/85" : "text-zinc-400"
                  )}
                >
                  {subtext}
                </p>
              )}

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href={primaryHref}>
                  <Button
                    size="lg"
                    className={cn(
                      "h-12 w-full rounded-full px-7 text-base font-semibold sm:w-auto",
                      creator
                        ? "bg-white text-foreground hover:bg-white/90"
                        : "bg-white text-black hover:bg-zinc-200"
                    )}
                  >
                    {primaryLabel}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </Link>
                {secondaryLabel && secondaryHref && (
                  <Link href={secondaryHref}>
                    <Button
                      size="lg"
                      className={cn(
                        "h-12 w-full rounded-full border px-7 text-base font-semibold sm:w-auto",
                        creator
                          ? "border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                          : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                      )}
                    >
                      {secondaryLabel}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
