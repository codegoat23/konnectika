import { HomeIcon } from "@/components/home/icon-map";
import type { Benefit } from "@/data/home/creator";
import { cn } from "@/lib/utils";

interface BenefitsGridProps {
  benefits: Benefit[];
  columns?: 2 | 4;
}

export function BenefitsGrid({ benefits, columns = 4 }: BenefitsGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-2"
      )}
    >
      {benefits.map((benefit) => (
        <div
          key={benefit.title}
          className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HomeIcon name={benefit.icon} className="size-5" />
          </span>
          <h3 className="mt-4 text-base font-bold text-foreground">
            {benefit.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {benefit.description}
          </p>
        </div>
      ))}
    </div>
  );
}
