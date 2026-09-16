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
import {
  getPaymentMethodMeta,
  PaymentMethodDisplay,
} from "@/components/payment-method-display";
import { isMobileMoneyMethod, normalizePhoneNumber } from "@/lib/payment";
import { format, parseISO, startOfDay } from "date-fns";
import { CalendarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CampaignFormProps = {
  mode?: "create" | "edit";
  initialData?: Prisma.CampaignGetPayload<{
    include: { businessProfile: { select: { userId: true } } };
  }>;
};

// Visual payment-method cards. `value` is the exact string stored in
// form.paymentMethod (and validated by the backend); the logo and label come
// from the shared payment-method mapping so the whole app stays consistent.
const PAYMENT_OPTIONS = ["M-PESA", "Airtel Money", "Tigo Pesa", "HaloPesa"].map(
  (value) => ({ value, meta: getPaymentMethodMeta(value)! })
);



 const Input = ({ id, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      id={id}
      {...props}
      className="h-12 w-full text-sm rounded-2xl border border-border bg-background px-4 text-foreground outline-none transition-all focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      style={{
        borderRadius: 14,
      }}
    />
  );

  const Textarea = ({ id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      id={id}
      {...props}
      className="w-full text-sm rounded-2xl border border-border bg-background p-4 text-foreground outline-none transition-all focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      style={{
        borderRadius: 14,
      }}
    />
  );

  const Section = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
    <div
      className="rounded-3xl border border-border bg-card p-4 sm:p-6 space-y-4"
      style={{
        borderRadius: 24,
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
    paymentMethod: initialData?.paymentMethod ?? "",
    paymentPhone: initialData?.paymentPhone ?? "",
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

    if (
      isMobileMoneyMethod(form.paymentMethod) &&
      !normalizePhoneNumber(form.paymentPhone)
    ) {
      alert("Enter the phone number you will use to pay for this campaign.");
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
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-0">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {mode === "edit" ? "Edit Campaign" : "Create Campaign"}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
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
            <label htmlFor="campaign-title" className="text-sm font-medium text-muted-foreground">
              Campaign Title
            </label>
            <Input
              id="campaign-title"
              placeholder="Nike Summer Collection"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2 flex flex-col gap-0.5">
            <label htmlFor="campaign-desc" className="text-sm font-medium text-muted-foreground">
              Description
            </label>
            <Textarea
              id="campaign-desc"
              rows={5}
              placeholder="Describe your campaign..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col gap-0.5">
              <label htmlFor="campaign-category" className="text-sm font-medium text-muted-foreground">
                Category
              </label>
              <Input
                id="campaign-category"
                placeholder="Fashion, Tech, Fitness..."
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              />
            </div>

            <div className="space-y-2 flex flex-col gap-0.5">
              <label id="campaign-type-label" className="text-sm font-medium text-muted-foreground">
                Campaign Type
              </label>
              <Select
                value={form.campaignType}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    campaignType: value as CampaignTypeEnum,
                  })
                }
              >
                <SelectTrigger aria-labelledby="campaign-type-label" className="h-12 w-full rounded-2xl px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UGC">UGC</SelectItem>
                  <SelectItem value="Sponsored">Sponsored</SelectItem>
                  <SelectItem value="Affiliate">Affiliate</SelectItem>
                  <SelectItem value="Ambassador">Ambassador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Section>

      {/* Budget */}
      <Section title="Budget & Payment">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 flex flex-col gap-0.5">
            <label htmlFor="payment-rate" className="text-sm font-medium text-muted-foreground">
              Payment Rate
            </label>
            <Input
              id="payment-rate"
              type="number"
              placeholder="150,000"
              value={form.paymentRate}
              onChange={(e) =>
                setForm({ ...form, paymentRate: e.target.value })
              }
            />
          </div>

          <div className="space-y-2 flex flex-col gap-0.5">
            <label htmlFor="budget-total" className="text-sm font-medium text-muted-foreground">
              Budget Total
            </label>
            <Input
              id="budget-total"
              type="number"
              placeholder="2,000,000"
              value={form.budgetTotal}
              onChange={(e) =>
                setForm({ ...form, budgetTotal: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-2 flex flex-col gap-0.5">
            <label id="payment-method-label" className="text-sm font-medium text-muted-foreground">
              Payment Method
            </label>
            <div
              role="radiogroup"
              aria-labelledby="payment-method-label"
              className="grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {PAYMENT_OPTIONS.map((option) => {
                const active = form.paymentMethod === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() =>
                      setForm({ ...form, paymentMethod: option.value })
                    }
                    className={`
                      relative flex flex-col items-center justify-center gap-2
                      rounded-2xl border bg-background px-2 py-4 min-h-[88px]
                      transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                      ${active
                        ? "border-orange-500 bg-orange-500/5"
                        : "border-border hover:border-orange-500/40"}
                    `}
                    style={{ borderRadius: 14 }}
                  >
                    <PaymentMethodDisplay
                      method={option.value}
                      size="lg"
                      showLabel={false}
                    />
                    <span
                      className={`text-sm font-medium ${
                        active ? "text-orange-600 dark:text-orange-400" : "text-foreground"
                      }`}
                    >
                      {option.meta.label}
                    </span>
                    {active && (
                      <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-orange-500 text-white">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {isMobileMoneyMethod(form.paymentMethod) && (
            <div className="sm:col-span-2 space-y-2 flex flex-col gap-0.5">
              <label htmlFor="payment-phone" className="text-sm font-medium text-muted-foreground">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input
                id="payment-phone"
                type="tel"
                inputMode="tel"
                placeholder="e.g. 0712 345 678 or +255 712 345 678"
                value={form.paymentPhone}
                onChange={(e) =>
                  setForm({ ...form, paymentPhone: e.target.value })
                }
              />
            </div>
          )}
        </div>

        {isMobileMoneyMethod(form.paymentMethod) && (
          <p className="text-xs text-muted-foreground">
            The{" "}
            <PaymentMethodDisplay method={form.paymentMethod} size="sm" />{" "}
            number the platform will match when confirming your campaign
            payment.
          </p>
        )}
      </Section>

      {/* Content */}
      <Section title="Content Requirements">
        <div className="space-y-4">
          <div className="space-y-2 flex flex-col gap-0.5">
            <label htmlFor="content-format" className="text-sm font-medium text-muted-foreground">
              Content Format
            </label>
            <Input
              id="content-format"
              placeholder="Content format (Reels, Shorts, Posts...)"
              value={form.contentFormat}
              onChange={(e) =>
                setForm({ ...form, contentFormat: e.target.value })
              }
            />
          </div>
          <div className="space-y-2 flex flex-col gap-0.5">
            <label htmlFor="content-duration" className="text-sm font-medium text-muted-foreground">
              Content Duration
            </label>
            <Input
              id="content-duration"
              placeholder="Duration (e.g. 7 days, 1 month)"
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {["instagram", "tiktok", "youtube", "facebook", "x"].map((p) => {
              const Icon = platformIcons[p];
              const active = form.platforms.includes(p);

              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={active}
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
                    p-4 sm:p-5 transition-all duration-200 min-h-[56px]
                    hover:scale-[1.01] active:scale-[0.98]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    ${
                      active
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-border bg-background hover:border-border"
                    }
                  `}
                >
                  {/* Icon bubble */}
                  <div
                    className={`
                      flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full shrink-0
                      ${
                        active
                          ? " text-white"
                          : " text-muted-foreground"
                      }
                    `}
                  >
                    <Icon size={20} className="sm:text-[22px]" />
                  </div>

                  {/* Text */}
                  <div className="flex flex-col items-start min-w-0">
                    <span className={`text-sm font-semibold capitalize ${
                        active
                          ? " text-white"
                          : " text-foreground"
                      }`}>
                      {p}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
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
          <label className="text-sm font-medium text-muted-foreground">Cover Image</label>
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
          <label id="app-close-label" className="text-sm font-medium text-muted-foreground">
            Applications Close
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-labelledby="app-close-label"
                className="h-12 w-full justify-start rounded-[14px] border border-border bg-background px-4 text-sm font-normal text-foreground transition-all outline-none hover:bg-background hover:text-foreground focus-visible:border-orange-500/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none dark:bg-background dark:hover:bg-background"
              >
                {form.applicationsClose ? (
                  format(parseISO(form.applicationsClose), "PPP")
                ) : (
                  <span className="text-muted-foreground">
                    Select a date
                  </span>
                )}
                <CalendarIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  form.applicationsClose
                    ? parseISO(form.applicationsClose)
                    : undefined
                }
                onSelect={(date) =>
                  setForm({
                    ...form,
                    applicationsClose: date
                      ? format(date, "yyyy-MM-dd")
                      : "",
                  })
                }
                disabled={(date) => date < startOfDay(new Date())}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 mt-4">
          <label htmlFor="campaign-tags" className="text-sm font-medium text-muted-foreground">
            Tags
          </label>
          <Textarea
            id="campaign-tags"
            rows={3}
            placeholder="marketing, influencer, viral..."
            value={form.tags}
            onChange={(e) =>
              setForm({ ...form, tags: e.target.value })
            }
          />
        </div>

        <div className="space-y-2 mt-4">
          <label htmlFor="campaign-requirements" className="text-sm font-medium text-muted-foreground">
            Requirements (one per line)
          </label>
          <Textarea
            id="campaign-requirements"
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
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-2xl bg-orange-500 font-medium text-white transition hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50 min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        style={{
          borderRadius: 14,
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