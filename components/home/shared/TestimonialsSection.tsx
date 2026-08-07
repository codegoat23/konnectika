import { Quote } from "lucide-react";

import { SectionHeading } from "@/components/home/shared/SectionHeading";
import { Reveal } from "@/components/home/Reveal";
import type { Testimonial } from "@/data/home/creator";

interface TestimonialsSectionProps {
  label: string;
  title: string;
  testimonials: Testimonial[];
  highlightColor?: "emerald" | "orange";
}

export function TestimonialsSection({
  label,
  title,
  testimonials,
  highlightColor = "emerald",
}: TestimonialsSectionProps) {
  const badgeClass =
    highlightColor === "orange"
      ? "bg-primary/10 text-primary"
      : "bg-emerald-500/15 text-emerald-500";

  return (
    <section id="testimonials" aria-label={title} className="scroll-mt-24">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading label={label} title={title} />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.id} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <Quote className="size-7 text-primary" aria-hidden />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 border-t border-border pt-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-10 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)`,
                      }}
                      aria-hidden
                    >
                      {t.initials}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.role}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${badgeClass}`}
                  >
                    {t.result}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
