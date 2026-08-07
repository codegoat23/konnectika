import React from "react";

export default function MarqueeText() {
  return (
    <div className="overflow-hidden whitespace-nowrap border-y py-4">
      <div className="flex animate-marquee">
        <span className="mx-8 text-4xl font-bold">
          Build • Create • Connect • Grow • Build • Create • Connect • Grow
        </span>

        <span className="mx-8 text-4xl font-bold">
          Build • Create • Connect • Grow • Build • Create • Connect • Grow
        </span>
      </div>
    </div>
  );
}