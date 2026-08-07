import { HomeIcon } from "@/components/home/icon-map";
import type { Step } from "@/data/home/creator";

export function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => (
        <li key={step.step} className="relative flex gap-4 pb-8 last:pb-0">
          {i < steps.length - 1 && (
            <span
              className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px border-l border-dashed border-border"
              aria-hidden
            />
          )}
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-500 text-sm font-bold text-primary-foreground shadow-sm">
            {step.step}
          </span>
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <HomeIcon name={step.icon} className="size-4 text-primary" />
              <h4 className="text-base font-semibold text-foreground">
                {step.title}
              </h4>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {step.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
