import { FaEye, FaHeart } from "react-icons/fa6";
import { TbHeartFilled } from "react-icons/tb";
import { Reveal } from "../Reveal";

const principles = [
  { label: "Real people", className: "-rotate-2" },
  { label: "Trusted voices", className: "rotate-1" },
  { label: "Meaningful growth", className: "-rotate-1" },
];

export default function GrowSect() {
  return (
    <section
      aria-labelledby="brand-mission-heading"
      className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32"
    >
      <Reveal>
        <div className="relative mx-auto flex min-h-[520px] max-w-6xl flex-col items-center justify-center overflow-hidden rounded-[2rem] px-5 py-16 text-center sm:min-h-[570px] sm:rounded-[2.5rem] sm:px-10 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 "
          />

          <div className="relative z-10 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] py-1.5 pl-1.5 pr-3 text-xs text-zinc-300">
            <span className="flex -space-x-2" aria-hidden="true">
              <img
                src="/avatar/people4.jpg"
                alt=""
                className="size-7 rounded-full border-2 border-[#191817] object-cover"
              />
              <img
                src="/avatar/people3.jpg"
                alt=""
                className="size-7 rounded-full border-2 border-[#191817] object-cover"
              />
            </span>
            <span>Our mission</span>
            
          </div>

          <h2
            id="brand-mission-heading"
            className="relative z-10 mt-7 max-w-4xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.055em] text-white sm:mt-8 sm:text-6xl lg:text-7xl"
          >
            Real people are your brand&apos;s{" "}
            <span className="font-serif font-normal italic text-orange-300">best</span>
            <br className="hidden sm:block" /> marketing asset.
          </h2>

          <p className="relative z-10 mt-6 max-w-xl text-pretty text-sm leading-6 text-zinc-400 sm:mt-7 sm:text-base sm:leading-7">
            We bring brands and trusted creators together to make authentic
            content that resonates with the communities you want to reach.
          </p>

         

          <div className="relative z-10 mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-2 sm:mt-14 sm:gap-3">
            {principles.map((principle, index) => (
              <span
                key={principle.label}
                className={
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-medium   sm:px-4 sm:text-xs " +
                  principle.className +
                  (index === 1
                    ? " border-orange-300/20 bg-orange-500 text-white"
                    : " border-white/10 bg-white/[0.07] text-zinc-200")
                }
              >
                {index === 0 ? (
                  <FaEye className="size-3.5" aria-hidden="true" />
                ) : index === 1 ? (
                  <FaHeart className="size-3.5" aria-hidden="true" />
                ) : (
                  <TbHeartFilled className="size-3.5" aria-hidden="true" />
                )}
                {principle.label}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
