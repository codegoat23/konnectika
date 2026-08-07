import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <div
        className="w-full max-w-xl space-y-4 rounded-[24px] border border-border bg-card p-8"
      >
        <Skeleton className="h-8 w-56 bg-muted" />
        <Skeleton className="h-4 w-72 max-w-full bg-muted" />
        <Skeleton className="h-11 w-full rounded-xl bg-muted" />
        <Skeleton className="h-11 w-full rounded-xl bg-muted" />
        <Skeleton className="h-11 w-32 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
