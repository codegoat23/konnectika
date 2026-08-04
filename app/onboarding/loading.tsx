import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-zinc-950 p-6">
      <div
        className="w-full max-w-xl space-y-4 rounded-[24px] border border-white/10 bg-zinc-900 p-8"
      >
        <Skeleton className="h-8 w-56 bg-zinc-800" />
        <Skeleton className="h-4 w-72 max-w-full bg-zinc-800" />
        <Skeleton className="h-11 w-full rounded-xl bg-zinc-800" />
        <Skeleton className="h-11 w-full rounded-xl bg-zinc-800" />
        <Skeleton className="h-11 w-32 rounded-xl bg-zinc-800" />
      </div>
    </div>
  );
}
