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
        <div className="flex min-h-[30rem] w-full max-w-[30rem] flex-col items-center rounded-[24px] border border-white/10 bg-card p-4 sm:p-6">
         <div className='border border-zinc-200/20 bg-zinc-100/20 rounded-full px-2 py-2 flex flex-row items-center justify-center gap-2 w-30'>
                <span className='font-regular text-xs text-zinc-300'>By the numbers</span>
            </div>
            <div className='flex flex-col items-center justify-center gap-2 mt-4'>
                <span className='text-7xl font-bold'>100<span className='text-orange-500'>+</span></span>
                
                <span className='text-sm text-white'>Brands delivered briefed, reviewed, approved.</span>
            </div>
            <div className="mt-8 flex w-full flex-row items-center justify-center gap-6 sm:gap-10">
                <span className='text-2xl font-bold sm:text-3xl'>1500<span className='text-orange-500'>+</span></span>
                <span className='text-sm text-white'>Creators onboarded and <br/>ready to work <br/>with your brand.</span>
            </div>
            <Separator className="my-6 h-px bg-white/10" />
            <div className="flex flex-row items-center gap-10">
                <span className='text-3xl font-bold'>5000<span className='text-orange-500'>+</span></span>
                <span className='text-sm text-white'>Campaigns managed and <br/>delivered successfully.</span>
            </div>
            <Separator className="my-6 h-px bg-white/10" />
            <div className="flex w-full flex-row items-center justify-center gap-6 sm:gap-12">
                <span className='text-2xl font-bold sm:text-3xl'>1000<span className='text-orange-500'>+</span></span>
                <span className='text-sm text-white'>Results achieved for <br/>your brand.</span>
            </div>
        </div>
    </div>
  )
}

