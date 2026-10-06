
"use client"

import { Separator } from "@/components/ui/separator"
import { Dot, ChevronLeft, ChevronRight } from "lucide-react"
import React, { useEffect, useState } from "react"

const testimonies = [
  {
    name: "AMARA",
    surname: "OKAFOR",
    image: "/thumbnails/kukupoa.png",
    category: "Food brand · Marketing team",
    platform: "Instagram Reels",
    quote:
      'Launching campaigns used to take weeks of coordination. Now we brief, approve, and publish from a single dashboard',
    brands: "5+",
    earned: "850k+",
  },
  {
    name: "DAVID",
    surname: "MWANGI",
    image: "/thumbnails/serengeti.jpeg",
    category: "Lifestyle",
    platform: "TikTok",
    quote:
      'Konnectika gave us access to creators our agency never found. The campaign content outperformed our paid ads three-to-one.',
    brands: "8+",
    earned: "1.2M+",
  },
  {
    name: "ZURI",
    surname: "KATO",
    image: "/thumbnails/crdb.jpg",
    category: "Fintech · Campaign lead",
    platform: "Instagram",
    quote:
     'The creators we found became brand advocates. Their content reaches communities we could never reach ourselves.',
    brands: "12+",
    earned: "2.4M+",
  },
]

export default function Testimony() {
  const [current, setCurrent] = useState(0)

  // Automatic sliding
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonies.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const nextTestimony = () => {
    setCurrent((prev) => (prev + 1) % testimonies.length)
  }

  const previousTestimony = () => {
    setCurrent(
      (prev) => (prev - 1 + testimonies.length) % testimonies.length
    )
  }

  const testimony = testimonies[current]

  return (
    <div className="mb-20 mt-5 flex flex-col items-center px-4 sm:mb-30">

      {/* Label */}
      <span className="rounded-full border border-white/10 bg-card px-4 py-2 text-xs font-normal text-zinc-300">
        Success Stories
      </span>

      {/* Heading */}
      <div className="mt-6 text-center">
        <span className="text-3xl font-bold text-white sm:text-5xl lg:text-6xl">
         Teams that scaled with <br/> Konnectika
        </span>
      </div>

      {/* Testimony */}
      <div className="mt-14 flex flex-col items-center">

        <div className="flex w-full flex-col items-center justify-center sm:flex-row">

          {/* Image Card */}
          <div
            className="h-[22rem] w-[min(84vw,22.5rem)] rounded-[24px] -rotate-3 bg-cover bg-center flex flex-col justify-end items-start text-white shadow-lg font-bold text-6xl overflow-hidden transition-all duration-700 sm:h-100 sm:w-90 sm:-rotate-6 sm:translate-x-10 sm:text-7xl"
            style={{
              backgroundImage: `url('${testimony.image}')`,
            }}
          >
            <div className="w-full p-6 bg-gradient-to-t from-black/70 to-transparent">
              
            </div>
          </div>

          {/* Testimony Card */}
          <div className="h-[22rem] w-[min(84vw,22.5rem)] border border-white/10 bg-card rounded-[24px] p-5 transition-all duration-700 sm:h-100 sm:w-80 sm:rotate-4 sm:-translate-x-10 sm:p-6">

            <span className="text-zinc-500 text-xs flex flex-row items-center">
              {testimony.category}
              <Dot />
              {testimony.platform}
            </span>

            <p className="mt-4 text-white text-sm font-medium">
              “{testimony.quote}”
            </p>

            <Separator className="my-4 mt-8 sm:mt-20" />

            <div className="flex flex-row gap-6 items-center p-2 sm:gap-10">

              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl text-white sm:text-5xl">
                  {testimony.brands}
                </span>

                <span className="text-zinc-700 text-xs font-medium">
                  Brands
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-4xl text-white sm:text-5xl">
                  {testimony.earned}
                </span>

                <span className="text-zinc-700 text-xs font-medium">
                  Earned
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center gap-4">

          <button
            onClick={previousTestimony}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-card text-white transition hover:bg-zinc-100"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {testimonies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  current === index
                    ? "w-7 bg-orange-500"
                    : "w-2 bg-zinc-300"
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextTestimony}
            className="flex h-11 w-11 items-center justify-center rounded-full border border border-white/10 bg-card text-white transition hover:bg-zinc-100"
          >
            <ChevronRight size={20} />
          </button>

        </div>

      </div>
    </div>
  )
}

