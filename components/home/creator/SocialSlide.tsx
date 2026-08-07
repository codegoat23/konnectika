import React from 'react'
import SocialMarquee from './socialMarquee'

export default function SocialSlide() {
  return (
    <div className='flex flex-col items-center justify-center mt-15'>
        <span className='text-zinc-600 text-xs'>Your content is what matters.Share now.</span>
        <SocialMarquee/>
    </div>
  )
}

 