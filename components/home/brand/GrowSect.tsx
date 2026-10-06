import { ArrowRight, Eye, Heart } from 'lucide-react'
import React from 'react'
import { Reveal } from '../Reveal'
import { TbHeartFilled } from 'react-icons/tb'

export default function GrowSect() {
  return (
    <>
    <Reveal delay={120}>
          <div className='mt-10 flex flex-col items-center justify-center gap-4 p-4 sm:p-8 lg:flex-row'>
            <div className="flex flex-row gap-1">
            <div className="relative h-48 w-32 rounded-[24px] overflow-hidden sm:h-70 sm:w-60">
  <img
    src="/avatar/people4.jpg"
    alt="person"
    className="w-full h-full object-cover"
  />
  <div className='flex flex-row bg-white backdrop-blur-md rounded-full px-4 py-2 absolute bottom-4 left-4 items-center gap-2'>
    <Eye className='text-black' size={16}/>
    <span className='font-medium text-xs text-black'>18.5k+</span>
  </div>
 
</div>

<div className="relative h-48 w-32 translate-y-3 rounded-[24px] overflow-hidden sm:h-70 sm:w-60 sm:translate-y-[20px]">
  <img
    src="/avatar/people3.jpg"
    alt="person"
    className="w-full h-full object-cover"
  />
    <div className='flex flex-row bg-white backdrop-blur-md rounded-full px-4 py-2 absolute bottom-4 left-4 items-center gap-2'>
    <TbHeartFilled className='text-red-500' size={16}/>
    <span className='font-medium text-xs text-black'>18.5k</span>
  </div>
</div>
        </div>
        <div className="w-full max-w-xl p-4 sm:p-6">
            <div className='mx-auto flex w-fit flex-row items-center justify-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2 text-xs font-normal text-zinc-300'>
                <span>Our mission</span>
            </div>
            <h1 className='mt-4 text-3xl font-bold text-white text-left sm:text-5xl'>WE MAKE REAL<br/> PEOPLE YOUR BEST<br/> MARKETING ASSET</h1>
            <p className='mt-4 text-sm text-zinc-400 text-left'>We help brands grow by connecting them with the right creators<br className="hidden sm:block"/> to produce authentic content that resonates with their audience.</p>
            <div className="mt-6">
                <button className='bg-orange-500 text-white px-2 py-2 rounded-full font-semibold text-sm hover:bg-orange-400 flex flex-row items-center gap-2'>Launch your campaign
                    <div className="ml-2 flex items-center justify-center bg-black text-white rounded-full w-8 h-8">
                                            <ArrowRight data-icon="inline-end" />
                                        </div>
                </button>
            </div>
        </div>
       
    </div>
    </Reveal>
   
    </>
   
  )
}
      

