import { Skeleton } from "@/components/ui/skeleton";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";

export default function Loading() {
  return (
    <DashboardShell>
      <div className="max-w-5xl space-y-6 px-4">
        <div
          className="h-52 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900"
          style={{ borderRadius: 24 }}
        >
          <Skeleton className="h-full w-full rounded-3xl bg-zinc-800" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-6 w-64 max-w-full bg-zinc-800" />
          <Skeleton className="h-4 w-96 max-w-full bg-zinc-800" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3 rounded-3xl border border-white/10 bg-zinc-900 p-5">
            <Skeleton className="h-4 w-full bg-zinc-800" />
            <Skeleton className="h-4 w-5/6 bg-zinc-800" />
            <Skeleton className="h-4 w-2/3 bg-zinc-800" />
            <Skeleton className="h-32 w-full bg-zinc-800" />
          </div>

          <div className="space-y-3 rounded-3xl border border-white/10 bg-zinc-900 p-5">
            <Skeleton className="h-5 w-1/2 bg-zinc-800" />
            <Skeleton className="h-4 w-3/4 bg-zinc-800" />
            <Skeleton className="h-16 w-full bg-zinc-800" />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
