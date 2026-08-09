"use client"

import { Button } from '@/components/ui/button'
import { ArrowRight, Dot } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import SocialSlide from '../creator/SocialSlide'
import HeroCards from '../creator/heroCards'

const words = ["Content", "Reels", "Posts", "Shorts"]

export default function BrandHeroV2() {
  const [index, setIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [width, setWidth] = useState(0)

  const textRef = useRef<HTMLSpanElement>(null)

  // Update pill width when the word changes
  useEffect(() => {
    if (textRef.current) {
      setWidth(textRef.current.offsetWidth + 48)
    }
  }, [index])

  // Change words
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)

      setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length)
        setIsAnimating(false)
      }, 350)
    }, 2600)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-4">

      {/* Categories */}
      <div className="border border-zinc-200/50 bg-zinc-100/30 px-4 py-2 rounded-full flex flex-row items-center justify-center gap-2">
        <span className="text-xs text-white flex flex-row items-center font-regular">
          <span>UGC</span>
          <Dot />
          <span>Sponsored</span>
          <Dot />
          <span>Clipping</span>
        </span>
      </div>

      {/* Hero Heading */}
      <div>
        <h1 className="text-7xl font-bold text-center text-white">
          Grow your Brand
        </h1>

        <h1 className="text-7xl font-bold text-center text-white flex flex-row gap-6 justify-center items-center">

          <span className="">
            with
          </span>

          {/* Dynamic animated pill */}
          <span
            className="bg-orange-500 text-black p-6 rounded-full inline-flex justify-center overflow-hidden transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              width: `${width}px`,
            }}
          >
            <span
              ref={textRef}
              className={`inline-block whitespace-nowrap will-change-transform ${
                isAnimating
                  ? "animate-word-out"
                  : "animate-word-in"
              }`}
            >
              {words[index]}
            </span>
          </span>

        </h1>
      </div>

      {/* Description */}
      <div>
        <p className="text-white/70 text-xs text-center">
          Find The Creators Your audience trusts. Discover vetted creators across Africa,
          <br />
          launch campaigns in minutes, and measure real impact — all from one dashboard.
        </p>
      </div>

      {/* CTA */}
      <div>
        <Link href="/discover">
          <Button
            size="lg"
            className="h-12 w-full rounded-full bg-white px-7 text-base font-semibold text-black hover:bg-orange-400 sm:w-auto"
          >
            Launch a Campaign

            <div className="ml-2 flex items-center justify-center bg-black text-white rounded-full w-8 h-8">
              <ArrowRight data-icon="inline-end" />
            </div>
          </Button>
        </Link>
      </div>

      <HeroCards />
      <SocialSlide />

    </div>
  )
}