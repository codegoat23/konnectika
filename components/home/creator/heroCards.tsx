import React from "react";
import Avatar from "./avatar";
import AvatarList from "./avatar";
import MarqueeText from "./marquee";


export default function HeroCards() {
  return (
    <div className="mt-8 grid w-full max-w-5xl grid-cols-2 items-center justify-items-center gap-3 px-4 sm:flex sm:flex-wrap sm:gap-4 sm:px-6 xl:flex-nowrap">

      {/* Card 1 */}
      <div className="relative aspect-[0.76] w-full max-w-[260px] -rotate-3 overflow-hidden rounded-[24px] sm:h-85 sm:w-65 sm:rotate-[-6deg]">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/background/video5.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 flex h-full items-end p-6 text-white">
         
        </div>
      </div>


      {/* Card 2 */}
      <div className="relative aspect-[0.76] w-full max-w-[260px] rotate-3 overflow-hidden rounded-[24px] sm:h-85 sm:w-65 sm:rotate-6">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/background/video2.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/30" />

       
      </div>


      {/* Card 3 */}
      <div className="aspect-[0.76] w-full max-w-[260px] -rotate-3 overflow-hidden rounded-[24px] bg-orange-500 sm:h-85 sm:w-65 sm:rotate-[-9deg]">
        <div className="flex h-full flex-col items-center p-6 text-white">
            <AvatarList />
            <h3 className="mt-4 text-lg font-bold text-black">creator we work with</h3>
            <h1 className="mt-2 text-5xl font-bold text-white sm:text-7xl">100+</h1>
            <div className="mt-4 text-center text-sm bg-zinc-200 text-black border-none rotate-5">
                 <MarqueeText/>
            </div>
            <div className="mt-4 text-center text-sm text-black -rotate-3">
                 <MarqueeText/>
            </div>
           
        </div>
      </div>


      {/* Card 4 */}
      <div className="relative aspect-[0.76] w-full max-w-[260px] rotate-3 overflow-hidden rounded-[24px] sm:h-85 sm:w-65 sm:rotate-5">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/background/video6.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 flex h-full items-end p-6 text-white">
         
        </div>
      </div>

    </div>
  );
}
