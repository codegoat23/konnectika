import { ArrowRight, Eye, Heart } from 'lucide-react'
import React from 'react'
import { Reveal } from '../Reveal'
import { TbHeartFilled } from 'react-icons/tb'

export default function GrowSect() {
  return (
    <>
    <Reveal delay={120}>
          <div className='flex flex-row items-center justify-center gap-4 mt-10 p-8'>
        <div className="flex flex-row gap-1">
            <div className="relative w-60 h-70 rounded-[24px] overflow-hidden">
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

<div className="relative w-60 h-70 translate-y-[20px] rounded-[24px] overflow-hidden">
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
        <div className=" p-6">
            <div className='border border-zinc-200/30 bg-zinc-100/20 rounded-full px-4 py-2 flex flex-row items-center justify-center gap-2 w-30'>
                <span className='font-regular text-xs'>Our mission</span>
            </div>
            <h1 className='text-5xl font-bold text-white mt-4 text-left'>WE MAKE REAL<br/> PEOPLE YOUR BEST<br/> MARKETING ASSET</h1>
            <p className='text-zinc-400 text-sm mt-4 text-left'>We help brands grow by connecting them with the right creators<br/> to produce authentic content that resonates with their audience.</p>
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
      

