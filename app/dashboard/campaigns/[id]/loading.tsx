import { Skeleton } from "@/components/ui/skeleton";
import DashboardShell from "@/app/dashboard/components/dashboard-shell";

export default function Loading() {
  return (
    <DashboardShell>
      <div className="max-w-5xl space-y-6 px-4">
        <div
          className="h-52 overflow-hidden rounded-3xl border border-border bg-card"
          style={{ borderRadius: 24 }}
        >
          <Skeleton className="h-full w-full rounded-3xl bg-muted" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-6 w-64 max-w-full bg-muted" />
          <Skeleton className="h-4 w-96 max-w-full bg-muted" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-4 w-5/6 bg-muted" />
            <Skeleton className="h-4 w-2/3 bg-muted" />
            <Skeleton className="h-32 w-full bg-muted" />
          </div>

          <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
            <Skeleton className="h-5 w-1/2 bg-muted" />
            <Skeleton className="h-4 w-3/4 bg-muted" />
            <Skeleton className="h-16 w-full bg-muted" />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
