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
      <div className="flex flex-row items-center justify-center gap-2 rounded-full border border-white/10 bg-card px-4 py-2">
        <span className="text-xs text-zinc-300 flex flex-row items-center font-regular">
          <span>UGC</span>
          <Dot />
          <span>Sponsored</span>
          <Dot />
          <span>Clipping</span>
        </span>
      </div>

      {/* Hero Heading */}
      <div>
        <h1 className="text-4xl font-bold text-center text-white tracking-tight sm:text-6xl lg:text-7xl">
          Grow your Brand
        </h1>

        <h1 className="text-3xl font-bold text-center text-white flex flex-row gap-2 justify-center items-center tracking-tight sm:text-5xl sm:gap-4 lg:text-7xl lg:gap-6">

          <span className="">
            with
          </span>

          {/* Dynamic animated pill */}
          <span
            className="bg-orange-500 text-black px-6 py-3 sm:py-5 lg:p-6 rounded-full inline-flex justify-center overflow-hidden transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
        <p className="max-w-[min(100vw-2rem,36rem)] text-white/70 text-xs text-center leading-relaxed">
          Find The Creators Your audience trusts. Discover vetted creators across Africa,
          <br className="hidden sm:block" />{" "}
          launch campaigns in minutes, and measure real impact
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
