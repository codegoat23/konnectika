import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="px-6 py-16">
        <Skeleton className="h-10 w-72 max-w-full bg-muted" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full bg-muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border bg-card"
            style={{ borderRadius: 24 }}
          >
            <Skeleton className="h-36 w-full rounded-none bg-muted" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-3 w-1/2 bg-muted" />
              <Skeleton className="h-2 w-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
