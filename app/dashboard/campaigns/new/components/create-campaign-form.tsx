"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaInstagram,
  FaYoutube,
  FaFacebook,
  FaXTwitter,
} from "react-icons/fa6";
import { SiTiktok } from "react-icons/si";
import type { Prisma, CampaignTypeEnum } from "@prisma/client";
import type { IconType } from "react-icons";
import CoverImageUploader from "@/components/CoverImageUploader";
import PaymentBreakdown from "../../components/PaymentBreakdown";

type CampaignFormProps = {
  mode?: "create" | "edit";
  initialData?: Prisma.CampaignGetPayload<{
    include: { businessProfile: { select: { userId: true } } };
  }>;
};



 const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className="h-12 w-full text-sm rounded-2xl border border-border bg-background px-4 text-foreground outline-none transition-all focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10"
      style={{
        borderRadius:14
      }}
    />
  );

   const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      {...props}
      className="w-full text-sm rounded-2xl border border-border bg-background p-4 text-foreground outline-none transition-all focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10"
       style={{
        borderRadius:14
      }}
    />
  );


    const Section = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
    <div className="rounded-3xl border border-border bg-card/40 p-6 space-y-4"
    style={{
      borderRadius:24
    }}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </div>
  );

export default function CampaignForm({
  mode = "create",
  initialData,
}: CampaignFormProps) {
  const router = useRouter();

  const platformIcons: Record<string, IconType> = {
    instagram: FaInstagram,
    tiktok: SiTiktok,
    youtube: FaYoutube,
    facebook: FaFacebook,
    x: FaXTwitter,
  };

  const [loading, setLoading] = useState(false);

  // Brand platform fee percent, fetched from the backend so the live payment
  // summary always matches the authoritative rate (lib/pricing.ts).
  const [brandFeePercent, setBrandFeePercent] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/platform/pricing");
        const data = await res.json();
        if (!cancelled && typeof data?.brandFeePercent === "number") {
          setBrandFeePercent(data.brandFeePercent);
        }
      } catch {
        // leave null; the summary just won't render
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "",
    campaignType: initialData?.campaignType ?? "UGC",
    badge: initialData?.badge ?? "new",
    paymentRate: initialData?.paymentRate?.toString() ?? "",
    budgetTotal: initialData?.budgetTotal?.toString() ?? "",
    contentFormat: initialData?.contentFormat ?? "",
    duration: initialData?.duration ?? "",
    applicationsClose: initialData?.applicationsClose
      ? new Date(initialData.applicationsClose).toISOString().split("T")[0]
      : "",
    thumbnailPic: initialData?.thumbnailPic ?? "",
    thumbnailColor: initialData?.thumbnailColor ?? "#18181b",
    tags: initialData?.tags?.join(", ") ?? "",
    requirements: initialData?.requirements?.join("\n") ?? "",
    platforms: (initialData?.platforms ?? []) as string[],
  });

  // Live payment preview (display only — final amounts are computed and
  // stored by the backend on submit).
  const rawBudget = Number(form.budgetTotal);
  const budget = Number.isFinite(rawBudget) && rawBudget > 0 ? rawBudget : 0;
  const rate = brandFeePercent ?? 0;
  const platformFee = Math.round((budget * rate) / 100);
  const totalCharge = budget + platformFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const paymentRate = Number(form.paymentRate);
    const budgetTotal = Number(form.budgetTotal);

    if (!form.name.trim()) {
      alert("Campaign title is required");
      setLoading(false);
      return;
    }

    if (!Number.isFinite(paymentRate) || paymentRate <= 0) {
      alert("Enter a valid payment rate");
      setLoading(false);
      return;
    }

    if (!Number.isFinite(budgetTotal) || budgetTotal <= 0) {
      alert("Enter a valid total budget");
      setLoading(false);
      return;
    }

    const closeDate = new Date(form.applicationsClose);
    if (!form.applicationsClose || isNaN(closeDate.getTime())) {
      alert("Choose a valid applications close date");
      setLoading(false);
      return;
    }

    const daysLeft = Math.max(
      0,
      Math.ceil((closeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    const payload = {
      ...form,
      paymentRate,
      budgetTotal,
      daysLeft,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      requirements: form.requirements
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
    };

    const url =
      mode === "edit"
        ? `/api/campaign/${initialData?.id}`
        : "/api/campaigns";

    const method = mode === "edit" ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || "Something went wrong");
      return;
    }

    router.push("/dashboard/campaigns");
  };

 

 



  return (
    <form onSubmit={handleSubmit} className="w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">
          {mode === "edit" ? "Edit Campaign" : "Create Campaign"}
        </h1>
        <p className="text-muted-foreground">
          Publish a campaign and start receiving creator applications.
        </p>
      </div>

      {/* Campaign Details */}
      <Section
        title="Campaign Details"
        desc="Basic information about your campaign"
        
      >
        <div className="space-y-4">
          <div className="space-y-2 flex flex-col gap-0.5">
            <label className="text-sm text-muted-foreground">Campaign Title</label>
            <Input
              placeholder="Nike Summer Collection"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2 flex flex-col gap-0.5">
            <label className="text-sm text-muted-foreground">Description</label>
            <Textarea
              rows={5}
              placeholder="Describe your campaign..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col gap-0.5">
              <label className="text-sm text-muted-foreground">Category</label>
              <Input
                placeholder="Fashion, Tech, Fitness..."
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 flex flex-col gap-0.5">
              <label className="text-sm text-muted-foreground">Campaign Type</label>
              <select
                className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-foreground"
                value={form.campaignType}
                 style={{
        borderRadius:14
      }}
                onChange={(e) =>
                  setForm({
                    ...form,
                    campaignType: e.target.value as CampaignTypeEnum,
                  })
                }
              >
                <option>UGC</option>
                <option>Sponsored</option>
                <option>Affiliate</option>
                <option>Ambassador</option>
              </select>
            </div>
          </div>
        </div>
      </Section>

      {/* Budget */}
      <Section title="Budget & Payment">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 flex flex-col gap-0.5" >
            <label className="text-sm text-muted-foreground">Payment Rate</label>
            <Input
              type="number"
              placeholder="150,000"
              value={form.paymentRate}
              onChange={(e) =>
                setForm({ ...form, paymentRate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2 flex flex-col gap-0.5">
            <label className="text-sm text-muted-foreground">Budget Total</label>
            <Input
              type="number"
              placeholder="2,000,000"
              value={form.budgetTotal}
              onChange={(e) =>
                setForm({ ...form, budgetTotal: e.target.value })
              }
            />
          </div>
        </div>
      </Section>

      {/* Content */}
      <Section title="Content Requirements">
        <div className="space-y-4">
          <div className="space-y-2 flex flex-col gap-0.5">
                  <label className="text-sm text-muted-foreground">Content Format</label>
          <Input
            placeholder="Content format (Reels, Shorts, Posts...)"
            value={form.contentFormat}
            onChange={(e) =>
              setForm({ ...form, contentFormat: e.target.value })
            }
          />
          </div>
       <div className="space-y-2 flex flex-col gap-0.5">
            <label className="text-sm text-muted-foreground">Content Duration</label>
             <Input
            placeholder="Duration (e.g. 7 days, 1 month)"
            value={form.duration}
            onChange={(e) =>
              setForm({ ...form, duration: e.target.value })
            }
          />

       </div>

         

        <div className="grid grid-cols-2 gap-4">
  {["instagram", "tiktok", "youtube", "facebook", "x"].map((p) => {
    const Icon = platformIcons[p];
    const active = form.platforms.includes(p);

    return (
      <button
        key={p}
        type="button"
        onClick={() =>
          setForm({
            ...form,
            platforms: active
              ? form.platforms.filter((x) => x !== p)
              : [...form.platforms, p],
          })
        }
        className={`
          relative flex items-center gap-4
          rounded-[16px] border
          p-5 transition-all duration-200
          hover:scale-[1.02] active:scale-[0.98]

          ${
            active
              ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/15"
              : "border-border bg-background hover:border-border"
          }
        `}
      >
        {/* Icon bubble */}
        <div
          className={`
            flex h-12 w-12 items-center justify-center rounded-full
            ${
              active
                ? " text-white"
                : " text-muted-foreground"
            }
          `}
        >
          <Icon size={22} />
        </div>

        {/* Text */}
        <div className="flex flex-col items-start">
          <span className={`text-sm font-semibold capitalize  ${
              active
                ? " text-white"
                : " text-foreground"
            }`}>
            {p}
          </span>
          <span className="text-xs text-muted-foreground">
            {active ? "Selected" : "Tap to select"}
          </span>
        </div>

        {/* Selected indicator */}
        {active && (
          <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-white" />
        )}
      </button>
    );
  })}
</div>
        </div>
      </Section>

      {/* Media */}
      <Section title="Cover Image">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Cover Image</label>
          <CoverImageUploader
            value={form.thumbnailPic}
            onChange={(url) =>
              setForm({ ...form, thumbnailPic: url })
            }
          />
        </div>
      </Section>

      {/* Final */}
      <Section title="Final Settings">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Applications Close
          </label>
          <Input
            type="date"
            value={form.applicationsClose}
            onChange={(e) =>
              setForm({
                ...form,
                applicationsClose: e.target.value,
              })
            }
          />
        </div>

        <div className="space-y-2 mt-4">
          <label className="text-sm text-muted-foreground">Tags</label>
          <Textarea
            rows={3}
            placeholder="marketing, influencer, viral..."
            value={form.tags}
            onChange={(e) =>
              setForm({ ...form, tags: e.target.value })
            }
          />
        </div>

        <div className="space-y-2 mt-4">
          <label className="text-sm text-muted-foreground">
            Requirements (one per line)
          </label>
          <Textarea
            rows={4}
            placeholder="Must have 10k followers..."
            value={form.requirements}
            onChange={(e) =>
              setForm({ ...form, requirements: e.target.value })
            }
          />
        </div>
      </Section>

      {/* Payment summary */}
      {mode === "create" && brandFeePercent !== null && (
        <PaymentBreakdown
          budget={budget}
          feeRate={rate}
          fee={platformFee}
          total={totalCharge}
        />
      )}

      {/* Submit */}
      <button
        disabled={loading}
        className=" bottom-4 h-12 w-2xl rounded-2xl bg-orange-500 font-medium text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-400 active:scale-[0.98] disabled:opacity-50"
        style={{
          borderRadius:14
        }}
      >
        {loading
          ? mode === "edit"
            ? "Updating..."
            : "Creating..."
          : mode === "edit"
          ? "Update Campaign"
          : "Create Campaign"}
      </button>
    </form>
  );
}