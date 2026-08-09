export default function CampaignDetailLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="h-16 w-full border-b border-border" />
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />

        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          <div className="aspect-[4/3] w-full shrink-0 animate-pulse rounded-3xl bg-muted lg:w-[420px]" />
          <div className="min-w-0 flex-1 space-y-4">
            <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-10 w-3/4 max-w-md animate-pulse rounded bg-muted" />
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="flex gap-3 pt-2">
              <div className="h-11 w-40 animate-pulse rounded-full bg-muted" />
              <div className="h-11 w-32 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-y border-border py-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="min-w-[150px] space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-28 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>

        <div className="mt-8 space-y-12">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-10 w-5/6 animate-pulse rounded-2xl bg-muted" />
            <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    </main>
  );
}
