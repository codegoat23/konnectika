import React from "react";
import Avatar from "./avatar";
import AvatarList from "./avatar";
import MarqueeText from "./marquee";


export default function HeroCards() {
  return (
    <div className="mt-8 flex items-center justify-center gap-4">

      {/* Card 1 */}
      <div className="relative h-85 w-65 -rotate-6 overflow-hidden rounded-[24px]">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/background/video1.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 flex h-full items-end p-6 text-white">
         
        </div>
      </div>


      {/* Card 2 */}
      <div className="relative h-85 w-65 rotate-6 overflow-hidden rounded-[24px]">
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
      <div className="-rotate-9 h-85 w-65 overflow-hidden rounded-[24px] bg-orange-500">
        <div className="flex h-full flex-col items-center p-6 text-white">
            <AvatarList />
            <h3 className="mt-4 text-lg font-bold text-black">creator we work with</h3>
            <h1 className="mt-2 text-7xl font-bold text-white">100+</h1>
            <div className="mt-4 text-center text-sm bg-zinc-200 text-black border-none rotate-5">
                 <MarqueeText/>
            </div>
            <div className="mt-4 text-center text-sm text-black -rotate-3">
                 <MarqueeText/>
            </div>
           
        </div>
      </div>


      {/* Card 4 */}
      <div className="relative h-85 w-65 rotate-5 overflow-hidden rounded-[24px]">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/background/video3.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 flex h-full items-end p-6 text-white">
         
        </div>
      </div>

    </div>
  );
}