import { Skeleton } from "@/components/ui/skeleton";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <>
      <div className="px-4 lg:hidden">
        <div className="relative space-y-4 overflow-hidden rounded-3xl bg-zinc-900 p-5 shadow-lg">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border border-white/5" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-3.5 rounded-full bg-white/15" />
              <Skeleton className="h-3 w-28 bg-white/15" />
            </div>
            <Skeleton className="h-9 w-2/3 bg-white/15" />
            <Skeleton className="h-3 w-36 bg-white/10" />
          </div>
          <div className="relative space-y-1 divide-y divide-white/10 border-t border-white/10 pt-1">
            {Array.from({ length: Math.max(0, count - 1) }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Skeleton className="size-3.5 shrink-0 rounded-full bg-white/10" />
                  <Skeleton className="h-3 w-28 bg-white/10" />
                </div>
                <Skeleton className="h-4 w-20 bg-white/15" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden gap-4 px-6 sm:grid-cols-2 lg:grid lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border bg-card p-5"
            style={{ borderRadius: 16 }}
          >
            <Skeleton className="h-3 w-24 bg-muted" />
            <Skeleton className="h-7 w-32 bg-muted" />
            <Skeleton className="h-3 w-20 bg-muted" />
          </div>
        ))}
      </div>
    </>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 p-4 sm:p-5"
          style={{ borderRadius: 20 }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-11 shrink-0 rounded-xl bg-muted" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-4 w-40 max-w-full bg-muted" />
              <Skeleton className="h-3 w-28 max-w-full bg-muted" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full bg-muted sm:w-20" />
        </div>
      ))}
    </div>
  );
}

export function DashboardLoading() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 px-4 lg:px-6">
          <Skeleton className="h-6 w-28 bg-muted" />
          <Skeleton className="h-9 w-36 rounded-full bg-muted sm:w-48" />
        </div>
        <SkeletonStatCards />
        <div className="space-y-3 px-4 pt-2 lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-40 bg-muted" />
            <Skeleton className="h-8 w-20 rounded-xl bg-muted" />
          </div>
          <div className="flex gap-4 overflow-hidden pb-2 lg:hidden">
            {[0, 1].map((i) => (
              <div key={i} className="w-[80%] shrink-0 space-y-3 rounded-3xl border border-border bg-card p-4">
                <Skeleton className="aspect-[16/9] w-full rounded-2xl bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
                <Skeleton className="h-3 w-full bg-muted" />
                <Skeleton className="h-3 w-1/2 bg-muted" />
              </div>
            ))}
          </div>
          <div className="hidden lg:block">
            <SkeletonRows rows={4} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

export function CardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-2/3 bg-muted" />
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-4 w-5/6 bg-muted" />
        <Skeleton className="h-4 w-1/2 bg-muted" />
      </div>
      <SkeletonRows rows={3} />
    </div>
  );
}
