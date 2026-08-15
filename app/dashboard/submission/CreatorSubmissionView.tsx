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
    <div className="px-4 lg:px-8 py-6 space-y-6 bg-background min-h-screen">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Submit Proof
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your approved campaigns waiting for submission.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm"
       
        >
          {error}
        </div>
      )}

      {/* EMPTY STATE */}
      {readyToSubmit.length === 0 ? (
        <div className="text-muted-foreground text-sm">
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
                bg-card/70
                border border-border
                rounded-2xl
                p-5
                flex items-center justify-between
                transition-all duration-200
                hover:border-border
                hover:bg-card
                hover:scale-[1.01]
              "
               style={{
          borderRadius:24,
        }}
            >

              {/* LEFT CONTENT */}
              <div className="space-y-1">
                <h2 className="text-foreground font-semibold text-base group-hover:text-foreground">
                  {item.campaign.name}
                </h2>

                <p className="text-muted-foreground text-sm">
                  {item.campaign.brand ?? "Unknown brand"}
                </p>

                <p className="text-xs text-muted-foreground">
                  Approved on{" "}
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* RIGHT METRICS */}
              <div className="flex items-center gap-6">

                {/* RATE */}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="text-emerald-600 font-semibold">
                    ${item.campaign.paymentRate}
                  </p>
                </div>

                {/* ARROW */}
                <div className="text-muted-foreground group-hover:text-foreground transition">
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
    <div className="px-6 py-8 space-y-4 bg-background min-h-screen">
      <div className="h-6 w-40 bg-muted rounded animate-pulse" />
      <div className="h-4 w-64 bg-muted rounded animate-pulse" />

      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 bg-card border border-border rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
}