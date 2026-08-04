"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import Image from "next/image";

interface TrustBoardProps {
  score?: number;
  level?: string;
}

export function TrustBoard({
  score = 60,
  level = "Average",
}: TrustBoardProps) {
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (score / 100) * circumference;

  return (
    <Card className="bg-black border border-white/10 rounded-3xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <h3 className="text-white text-sm font-semibold">
          Trust Score
        </h3>

        <button>
          <MoreVertical className="h-4 w-4 text-zinc-400" />
        </button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Ring */}
        <div className="flex justify-center">
          <div className="relative w-[220px] h-[220px]">
            <svg
              className="-rotate-90"
              width="220"
              height="220"
            >
              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="transparent"
                stroke="#d4d4d8"
                strokeWidth="24"
              />

              <circle
                cx="110"
                cy="110"
                r={radius}
                fill="transparent"
                stroke="#fb923c"
                strokeWidth="24"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {score}%
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Card */}
        <div className="border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Image
              src="/avatar.png"
              alt="avatar"
              width={42}
              height={42}
              className="rounded-full"
            />

            <div className="flex-1">
              <div className="flex justify-end mb-2">
                <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full">
                  {level}
                </span>
              </div>

              <div className="w-full h-4 bg-zinc-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500"
                  style={{
                    width: `${score}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Extra Feature */}
      
      </CardContent>
    </Card>
  );
}