import { Button } from '@/components/ui/button'
import { ArrowRight, Dot } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import SocialSlide from '../creator/SocialSlide'
import HeroCards from '../creator/heroCards'

export default  function BrandHeroV2() {
  return (
    <div className='mt-10 flex flex-col items-center justify-center gap-4'>
        
        <div className="border border-zinc-200/50 bg-zinc-100/30 px-4 py-2 rounded-full flex flex-row items-center justify-center gap-2">
            <span className='text-xs text-white flex flex-row items-center font-regular'>
                <span className=''>UGC</span> 
                 <Dot/>
                <span className=''>Sponsored</span> 
                    <Dot/>
                <span className=''>Clipping</span>
                </span>
        </div>
        <div>
            <h1 className='text-7xl font-bold text-center text-white'>Grow your Brand</h1>
            <div>

            </div>
            <h1 className='text-7xl font-bold text-center text-white flex flex-row gap-6 justify-center align-center'><span className='mt-6'>with </span>
                 <span className="bg-orange-500 text-black p-6 rounded-full">Content</span>
            </h1>
           
        </div>
        <div>
             <p className='text-white/70 text-xs text-center'>Turn Your Creativity into real opportunities.Discover campaigns <br/>from brands,
                 create authentic content, and get rewarded for your influence.</p>

        </div>
        <div>
             <Link
              href="/discover">
                  <Button
                    size="lg"
                    className="h-12 w-full rounded-full bg-white px-7 text-base font-semibold text-black hover:bg-orange-400 sm:w-auto"
                  >
                    Explore Campaigns
                    <div className="ml-2 flex items-center justify-center bg-black text-white rounded-full w-8 h-8">
                        <ArrowRight data-icon="inline-end" />
                    </div>
                    
                  </Button>
                </Link>
        </div>
       <HeroCards
       />
       <SocialSlide/>
    </div>
  )
}
     


