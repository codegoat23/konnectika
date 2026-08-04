"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

type ReadyToSubmit = {
  id: string;
  createdAt: string;
  campaign: {
    id: string;
    name: string;
    brand: string | null;
    paymentRate: number;
  };
};

export default function CreatorSubmissionView() {
  const router = useRouter();
  const [readyToSubmit, setReadyToSubmit] = useState<ReadyToSubmit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/submissions");
        if (!res.ok) throw new Error("Couldn't load campaigns");

        const data = await res.json();
        setReadyToSubmit(data.readyToSubmit ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="px-4 lg:px-8 py-6 space-y-6 bg-zinc-950 min-h-screen">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Submit Proof
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Your approved campaigns waiting for submission.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="border border-red-500/20 bg-red-500/10 text-red-300 px-4 py-3 rounded-xl text-sm"
       
        >
          {error}
        </div>
      )}

      {/* EMPTY STATE */}
      {readyToSubmit.length === 0 ? (
        <div className="text-zinc-500 text-sm">
          Nothing waiting right now — approved campaigns will appear here.
        </div>
      ) : (
        <div className="space-y-3">

          {readyToSubmit.map((item) => (
            <div
              key={item.id}
              onClick={() =>
                router.push(`/dashboard/submission/${item.id}`)
              }
              className="
                group cursor-pointer
                bg-zinc-900/70
                border border-white/5
                rounded-2xl
                p-5
                flex items-center justify-between
                transition-all duration-200
                hover:border-white/15
                hover:bg-zinc-900
                hover:scale-[1.01]
              "
               style={{
          borderRadius:24,
        }}
            >

              {/* LEFT CONTENT */}
              <div className="space-y-1">
                <h2 className="text-white font-semibold text-base group-hover:text-white">
                  {item.campaign.name}
                </h2>

                <p className="text-zinc-400 text-sm">
                  {item.campaign.brand ?? "Unknown brand"}
                </p>

                <p className="text-xs text-zinc-500">
                  Approved on{" "}
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* RIGHT METRICS */}
              <div className="flex items-center gap-6">

                {/* RATE */}
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Payment</p>
                  <p className="text-emerald-400 font-semibold">
                    ${item.campaign.paymentRate}
                  </p>
                </div>

                {/* ARROW */}
                <div className="text-zinc-500 group-hover:text-white transition">
                  <ArrowRight size={18} />
                </div>

              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}

/* 🧊 SKELETON */
function Skeleton() {
  return (
    <div className="px-6 py-8 space-y-4 bg-zinc-950 min-h-screen">
      <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse" />
      <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse" />

      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 bg-zinc-900 border border-white/5 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
}