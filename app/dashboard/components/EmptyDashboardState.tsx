import type { ReactNode } from "react"
import Link from "next/link"

export default function EmptyDashboardState({
  title,
  description,
  icon,
  actionHref,
  actionLabel,
  className = "",
}: {
  title: string
  description: string
  icon: ReactNode
  actionHref?: string
  actionLabel?: string
  className?: string
}) {
  return (
    <div
      className={`flex min-h-[220px] flex-col items-center justify-center rounded-2xl px-5 py-8 text-center sm:min-h-[240px] ${className}`}
      role="status"
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#ff9800] text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.2)] [&_svg]:!size-5">
        {icon}
      </div>
      <h3 className="text-lg font-medium tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
