import { Separator } from '@/components/ui/separator'
import React from 'react'

export default function Growth() {
  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-6 p-4 sm:p-6 lg:mt-20 lg:flex-row">
        <div
  className="flex aspect-square w-full max-w-[30rem] flex-col items-start justify-end gap-0 rounded-[24px] bg-cover bg-center bg-no-repeat"
  style={{ backgroundImage: "url('/avatar/blaxk.jpg')" }}
>
    <span className="px-3 py-1.5 text-3xl font-bold text-white sm:text-5xl lg:text-6xl">Real Growth.</span>
     <span className="px-3 py-1.5 text-3xl font-bold text-white sm:text-5xl lg:text-6xl">Real Brands.</span>
      <span className="px-3 py-1.5 text-3xl font-bold text-white sm:text-5xl lg:text-6xl">Real Results.</span>
</div>
        
<div className="flex min-h-[30rem] w-full max-w-[30rem] flex-col items-center rounded-[24px] border border-white/10 bg-card p-3 sm:p-6">
  <div className="flex w-fit flex-row items-center justify-center gap-2 rounded-full border border-zinc-200/20 bg-zinc-100/20 px-3 py-2">
    <span className="text-xs font-normal text-zinc-300">By the numbers</span>
  </div>

  <div className="flex w-full flex-col items-center justify-between gap-2 p-2 sm:gap-3">
    <span className="text-5xl font-bold sm:text-7xl">
      100<span className="text-orange-500">+</span>
    </span>
    <span className="text-center text-xs text-white sm:text-sm">
      Brands delivered, briefed, reviewed, approved.
    </span>
  </div>

  <div className="mt-6 flex w-full flex-row items-center justify-between gap-3 p-2 sm:mt-8 sm:gap-4">
    <span className="shrink-0 text-2xl font-bold sm:text-3xl">
      1500<span className="text-orange-500">+</span>
    </span>
    <span className="max-w-[60%] text-left text-xs text-white sm:text-sm">
      Creators onboarded and ready to work with your brand.
    </span>
  </div>

  <Separator className="my-4 h-px bg-white/10 sm:my-6" />

  <div className="flex w-full flex-row items-center justify-between gap-3 p-2">
    <span className="shrink-0 text-2xl font-bold sm:text-3xl">
      50<span className="text-orange-500">+</span>
    </span>
    <span className="max-w-[60%] text-left text-xs text-white sm:text-sm">
      Campaigns managed and delivered successfully.
    </span>
  </div>

  <Separator className="my-4 h-px bg-white/10 sm:my-6" />

  <div className="flex w-full flex-row items-center justify-between gap-3 p-2">
    <span className="shrink-0 text-2xl font-bold sm:text-3xl">
      1000<span className="text-orange-500">+</span>
    </span>
    <span className="max-w-[60%] text-left text-xs text-white sm:text-sm">
      Results achieved for your brand and delivered.
    </span>
  </div>
</div>


    </div>
  )
}

