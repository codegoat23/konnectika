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
       <span className="rounded-full border border-zinc-200/50 bg-zinc-100/30 px-4 py-2 text-sm font-semibold text-black">
         {label}
      </span>
     
      <h2
        className={cn(
          "mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-6xl",
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
