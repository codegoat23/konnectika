import { Skeleton } from "@/components/ui/skeleton";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-white/5 bg-zinc-900 p-5"
          style={{ borderRadius: 16 }}
        >
          <Skeleton className="h-3 w-24 bg-zinc-800" />
          <Skeleton className="h-7 w-32 bg-zinc-800" />
          <Skeleton className="h-3 w-20 bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-2xl border border-white/5 bg-zinc-900/70 p-5"
          style={{ borderRadius: 24 }}
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 max-w-full bg-zinc-800" />
            <Skeleton className="h-3 w-28 bg-zinc-800" />
          </div>
          <Skeleton className="h-6 w-20 bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function DashboardLoading() {
  return (
    <DashboardShell>
      <div className="space-y-6 px-4 lg:px-6">
        <SkeletonStatCards />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-6 w-48 bg-zinc-800" />
          <SkeletonRows rows={4} />
        </div>
      </div>
    </DashboardShell>
  );
}

export function CardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-zinc-900 p-5">
        <Skeleton className="h-5 w-2/3 bg-zinc-800" />
        <Skeleton className="h-4 w-full bg-zinc-800" />
        <Skeleton className="h-4 w-5/6 bg-zinc-800" />
        <Skeleton className="h-4 w-1/2 bg-zinc-800" />
      </div>
      <SkeletonRows rows={3} />
    </div>
  );
}
