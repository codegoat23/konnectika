import { Separator } from "@/components/ui/separator";

const communityMetrics = [
  "Brands who have launched campaigns",
  "Creators joined",
  "Campaigns launched together",
  "Results shared",
];

export default function Growth() {
  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-6 p-4 sm:p-6 lg:mt-20 lg:flex-row">
      <div
        className="flex aspect-square w-full max-w-[30rem] flex-col items-start justify-end gap-0 rounded-[24px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/avatar/blaxk.jpg')" }}
      >
        <span className="px-3 py-1.5 text-3xl font-bold text-white sm:text-5xl lg:text-6xl">
          Real Growth.
        </span>
        <span className="px-3 py-1.5 text-3xl font-bold text-white sm:text-5xl lg:text-6xl">
          Real Brands.
        </span>
        <span className="px-3 py-1.5 text-3xl font-bold text-white sm:text-5xl lg:text-6xl">
          Real Results.
        </span>
      </div>

      <div className="flex min-h-[30rem] w-full max-w-[30rem] flex-col items-center rounded-[24px] border border-white/10 bg-card p-4 sm:p-6">
        <div className="flex w-fit flex-row items-center justify-center gap-2 rounded-full border border-zinc-200/20 bg-zinc-100/20 px-3 py-2">
          <span className="text-xs font-normal text-zinc-300">By the numbers</span>
        </div>

        <h2 className="mt-5 text-center text-2xl font-bold text-white sm:text-3xl">
          We’re building this together.
        </h2>
        <p className="mt-2 max-w-sm text-center text-sm leading-relaxed text-zinc-300">
         Let’s grow these
          numbers together.
        </p>

        <div className="mt-6 flex w-full flex-1 flex-col justify-center">
          {communityMetrics.map((metric, index) => (
            <div key={metric}>
              {index > 0 && <Separator className="my-3 h-px bg-white/10" />}
              <div className="flex items-center justify-between gap-4 px-2 py-1">
                <span className="shrink-0 text-2xl font-bold text-white sm:text-3xl">
                  <span className="text-orange-500">0</span>
                </span>
                <span className="max-w-[70%] text-right text-xs text-white sm:text-sm">
                  {metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
