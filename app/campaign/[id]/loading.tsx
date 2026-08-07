import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-10 w-24 rounded-xl bg-muted" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-full bg-muted" />
            <Skeleton className="h-10 w-28 rounded-full bg-muted" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div
            className="space-y-4 rounded-[24px] border border-border bg-card p-6"
          >
            <Skeleton className="h-56 w-full bg-muted" />
            <Skeleton className="h-6 w-2/3 bg-muted" />
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-4 w-5/6 bg-muted" />
          </div>

          <div
            className="space-y-4 rounded-[24px] border border-border bg-card p-6"
          >
            <Skeleton className="h-6 w-1/2 bg-muted" />
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-4 w-3/4 bg-muted" />
            <Skeleton className="h-10 w-40 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
