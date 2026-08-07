import { Reveal } from "@/components/home/Reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  label: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeading({
  label,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal className={cn(align === "center" ? "text-center" : "", className)}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        {label}
      </p>
      <h2
        className={cn(
          "mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl",
          align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-muted-foreground",
            align === "center" ? "mx-auto max-w-xl" : "max-w-xl"
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
