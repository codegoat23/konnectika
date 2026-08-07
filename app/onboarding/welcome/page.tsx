"use client"
import { bricolage } from '@/app/font'
import { Button } from '@/components/ui/button'
import React from 'react'
import Star1 from'@/public/stars/star1.svg'
import Star2 from "@/public/stars/star2.svg"
import Image from 'next/image'
import Star3 from '@/public/stars/wide.svg'
import Logo from "@/public/assets/logo-plain.svg"
import { useRouter } from 'next/navigation'


export default function Welcome() {
    const router = useRouter();

    async function handleContinue(){
        await fetch("/api/onboarding/complete",{
            method:"POST"
        })
        router.push("/dashboard")
    }
  return (
    <div className='flex  flex-col justify-center items-center p-6 w-full h-full mt-5 '>
         <div className="w-full flex items-center justify-center  py-1">
              <Image
                src={Logo}
                alt="Konnectika"
                
                priority
                className="h-auto w-full max-w-[100px]"
              />
            </div>
        <div className='border border-border w-[450px] h-[350px] bg-card p-6 rounded-[24] flex flex-col items-center justify-between'>
             <div className='flex flex-row gap-2 justify-center items-center'>
            <span className='text-xl'>Welcome to</span>
            <span className={`${bricolage.className} text-3xl font-extrabold tracking-tight bg-orange-500 p-2 rotate-2`}>Konnectika</span>
        </div>
        <div className='flex flex-col justify-center items-center mt-9 font-medium text-lg'>
            <span>Your brand profile is ready.</span>
            <span className='text-center'>You&apos;re all set to start connecting with creators, launch campaigns, and grow your brand</span>

        </div>
        <Button className='bg-orange-500 font-medium rounded-[24] px-6 mt-6 w-full '
        onClick={handleContinue}
        >Go to Dashboard</Button>
        <Image src={Star1} alt='' className='text-orange-500 absolute bottom-10 left-5'/>
         <Image src={Star2} alt='' className='text-orange-500 absolute top-20 right-85'/>
          <Image src={Star3} alt='' className='text-orange-500 absolute bottom-15 right-70'/>
        </div>

       
       
    
    </div>
  )
}

