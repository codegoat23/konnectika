import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Skeleton className="h-14 w-14 rounded-2xl bg-muted" />
        <div
          className="w-full space-y-4 rounded-2xl border border-border bg-card p-6"
          style={{ borderRadius: 24 }}
        >
          <Skeleton className="h-8 w-48 bg-muted" />
          <Skeleton className="h-4 w-full bg-muted" />
          <Skeleton className="h-11 w-full rounded-xl bg-muted" />
          <Skeleton className="h-11 w-full rounded-xl bg-muted" />
          <Skeleton className="h-11 w-full rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
