import { Separator } from '@/components/ui/separator'
import React from 'react'

export default function Growth() {
  return (
    <div className=" flex flex-row gap-6 p-6 justify-center items-center mt-20">
        <div
  className="w-120 h-120 rounded-[24px] bg-cover bg-center bg-no-repeat flex flex-col items-start justify-end gap-0"
  style={{ backgroundImage: "url('/avatar/blaxk.jpg')" }}
>
    <span className=" text-6xl px-3 py-1.5 font-bold text-white">Real Growth.</span>
     <span className=" text-6xl px-3 py-1.5 font-bold text-white">Real Brands.</span>
      <span className=" text-6xl px-3 py-1.5 font-bold text-white">Real Results.</span>
</div>
        <div className="w-120 h-120 border border-white/10 bg-card rounded-[24] flex flex-col items-center p-6">
         <div className='border border-zinc-200/20 bg-zinc-100/20 rounded-full px-2 py-2 flex flex-row items-center justify-center gap-2 w-30'>
                <span className='font-regular text-xs text-zinc-300'>By the numbers</span>
            </div>
            <div className='flex flex-col items-center justify-center gap-2 mt-4'>
                <span className='text-7xl font-bold'>100<span className='text-orange-500'>+</span></span>
                
                <span className='text-sm text-white'>Brands delivered briefed, reviewed, approved.</span>
            </div>
            <div className="flex flex-row items-center gap-10 mt-8">
                <span className='text-3xl font-bold'>1500<span className='text-orange-500'>+</span></span>
                <span className='text-sm text-white'>Creators onboarded and <br/>ready to work <br/>with your brand.</span>
            </div>
            <Separator className="my-6 h-px bg-white/10" />
            <div className="flex flex-row items-center gap-10">
                <span className='text-3xl font-bold'>5000<span className='text-orange-500'>+</span></span>
                <span className='text-sm text-white'>Campaigns managed and <br/>delivered successfully.</span>
            </div>
            <Separator className="my-6 h-px bg-white/10" />
            <div className="flex flex-row items-center ju gap-12">
                <span className='text-3xl font-bold'>1000<span className='text-orange-500'>+</span></span>
                <span className='text-sm text-white'>Results achieved for <br/>your brand.</span>
            </div>
        </div>
    </div>
  )
}

