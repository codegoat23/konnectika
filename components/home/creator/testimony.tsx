
"use client"

import { Separator } from "@/components/ui/separator"
import { Dot, ChevronLeft, ChevronRight } from "lucide-react"
import React, { useEffect, useState } from "react"

const testimonies = [
  {
    name: "AMARA",
    surname: "OKAFOR",
    image: "/avatar/people3.jpg",
    category: "Fashion",
    platform: "Instagram Reels",
    quote:
      "Konnectika helped me find brands that actually value my creativity. I went from posting for fun to landing paid collaborations every month.",
    brands: "5+",
    earned: "850k+",
  },
  {
    name: "DAVID",
    surname: "MWANGI",
    image: "/avatar/people2.jpg",
    category: "Lifestyle",
    platform: "TikTok",
    quote:
      "I used to struggle finding brands that matched my content. Konnectika made it easier to discover opportunities that actually fit my audience.",
    brands: "8+",
    earned: "1.2M+",
  },
  {
    name: "ZURI",
    surname: "KATO",
    image: "/avatar/people4.jpg",
    category: "Beauty",
    platform: "Instagram",
    quote:
      "Konnectika gave me the confidence to take my content seriously. I connected with brands I genuinely wanted to work with.",
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
    <div className="flex flex-col items-center mb-30 mt-5">

      {/* Label */}
      <span className="rounded-full border border-zinc-200/50 bg-zinc-100/30 px-4 py-2 text-sm font-semibold text-black">
        Success Stories
      </span>

      {/* Heading */}
      <div className="mt-6 text-center">
        <span className="text-6xl font-bold text-black">
          Creators turning <br />
          passion into pay
        </span>
      </div>

      {/* Testimony */}
      <div className="mt-14 flex flex-col items-center">

        <div className="flex flex-row justify-center items-center">

          {/* Image Card */}
          <div
            className="w-90 h-100 rounded-[24px] -rotate-6 translate-x-10 bg-cover bg-center flex flex-col justify-end items-start text-white shadow-lg font-bold text-7xl overflow-hidden transition-all duration-700"
            style={{
              backgroundImage: `url('${testimony.image}')`,
            }}
          >
            <div className="w-full p-6 bg-gradient-to-t from-black/70 to-transparent">
              <span className="block">{testimony.name}</span>
              <span className="block">{testimony.surname}</span>
            </div>
          </div>

          {/* Testimony Card */}
          <div className="w-80 h-100 bg-zinc-100 rounded-[24px] rotate-4 -translate-x-10 p-6 transition-all duration-700">

            <span className="text-zinc-500 text-xs flex flex-row items-center">
              {testimony.category}
              <Dot />
              {testimony.platform}
            </span>

            <p className="mt-4 text-zinc-800 text-sm font-medium">
              “{testimony.quote}”
            </p>

            <Separator className="my-4 mt-20" />

            <div className="flex flex-row gap-10 items-center p-2">

              <div className="flex flex-col items-center justify-center">
                <span className="text-5xl text-black">
                  {testimony.brands}
                </span>

                <span className="text-zinc-700 text-xs font-medium">
                  Brands
                </span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-5xl text-black">
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
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-black transition hover:bg-zinc-100"
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
                    ? "w-7 bg-black"
                    : "w-2 bg-zinc-300"
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextTestimony}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-black transition hover:bg-zinc-100"
          >
            <ChevronRight size={20} />
          </button>

        </div>

      </div>
    </div>
  )
}

