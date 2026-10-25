"use client";

import { useMemo, useState } from "react";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiCalendar,
  FiExternalLink,
  FiGlobe,
  FiInbox,
  FiMail,
  FiMessageCircle,
  FiSearch,
  FiUsers,
} from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CampaignInquiryRecord = {
  id: string;
  brandName: string;
  contactName: string;
  email: string;
  whatsapp: string;
  website: string | null;
  industry: string;
  campaignTypes: string;
  objective: string;
  product: string;
  description: string;
  requirements: string | null;
  platforms: string;
  creatorCount: string | null;
  budget: string;
  startDate: string | null;
  additional: string | null;
  createdAt: string;
};

const budgetOrder = [
  "Below TZS 200,000",
  "TZS 200,000–500,000",
  "TZS 500,000–1,000,000",
  "TZS 1,000,000–3,000,000",
  "Above TZS 3,000,000",
  "Not sure yet",
];

function formatDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

function timeAgo(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(value, { year: undefined });
}

function getWebsiteUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/70 py-3 last:border-0 sm:grid-cols-[150px_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap break-words text-sm text-foreground">{children || "Not provided"}</dd>
    </div>
  );
}

export default function InquiryDashboard({
  inquiries,
  total,
  summary,
}: {
  inquiries: CampaignInquiryRecord[];
  total: number;
  summary: { last30Days: number; industries: number; creatorRequests: number };
}) {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [selected, setSelected] = useState<CampaignInquiryRecord | null>(null);

  const industries = useMemo(
    () => [...new Set(inquiries.map((inquiry) => inquiry.industry))].sort(),
    [inquiries]
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return inquiries.filter((inquiry) => {
      const matchesIndustry = industry === "all" || inquiry.industry === industry;
      const matchesSearch = !query || [
        inquiry.brandName,
        inquiry.contactName,
        inquiry.email,
        inquiry.product,
        inquiry.industry,
      ].some((value) => value.toLowerCase().includes(query));
      return matchesIndustry && matchesSearch;
    });
  }, [inquiries, industry, search]);

  const budgetCounts = useMemo(() => {
    const countByBudget = new Map<string, number>();
    for (const inquiry of inquiries) {
      countByBudget.set(inquiry.budget, (countByBudget.get(inquiry.budget) ?? 0) + 1);
    }
    return [...budgetOrder, ...[...countByBudget.keys()].filter((item) => !budgetOrder.includes(item))]
      .map((label) => ({ label, count: countByBudget.get(label) ?? 0 }))
      .filter((item) => item.count > 0);
  }, [inquiries]);
  const maxBudgetCount = Math.max(1, ...budgetCounts.map((item) => item.count));
  const websiteUrl = selected ? getWebsiteUrl(selected.website) : null;
  const whatsappDigits = selected?.whatsapp.replace(/\D/g, "") ?? "";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 px-4 lg:px-6">
        <div>
         
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Campaign inquiries</h1>
         
        </div>
      
      </header>

      <section aria-label="Inquiry summary" className="px-4 lg:px-6">
        <Card className="relative gap-5 overflow-hidden rounded-3xl border-0 bg-zinc-900 p-5 text-white shadow-lg sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border border-white/5" />
          <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:items-center md:gap-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-white/65">
                <FiInbox aria-hidden="true" className="size-4" />
                Campaign inquiry snapshot
              </div>
              <p className="mt-2 break-words text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{total.toLocaleString()}</p>
              <p className="mt-2 text-xs text-white/65">Total campaign inquiries received</p>
            </div>
            <div className="relative grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-t-0 sm:border-l sm:border-white/10 md:pl-2">
              <div className="flex items-center justify-between gap-4 py-3 sm:flex-col sm:items-start sm:justify-center sm:px-4 sm:py-2">
                <span className="flex items-center gap-2 text-xs text-white/65"><FiCalendar aria-hidden="true" className="size-3.5" />Last 30 days</span>
                <span className="text-lg font-semibold tabular-nums">{summary.last30Days.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-3 sm:flex-col sm:items-start sm:justify-center sm:px-4 sm:py-2">
                <span className="flex items-center gap-2 text-xs text-white/65"><FiGlobe aria-hidden="true" className="size-3.5" />Industries</span>
                <span className="text-lg font-semibold tabular-nums">{summary.industries.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-3 sm:flex-col sm:items-start sm:justify-center sm:px-4 sm:py-2">
                <span className="flex items-center gap-2 text-xs text-white/65"><FiUsers aria-hidden="true" className="size-3.5" />Creator demand</span>
                <span className="text-lg font-semibold tabular-nums">{summary.creatorRequests.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section aria-label="Budget interest" className="px-4 lg:px-6">
        <Card className="gap-0 rounded-3xl p-5 shadow-xs lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold tracking-tight">Budget interest</h2>
              
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-orange-500/10 text-orange-600"><FiArrowDownRight aria-hidden="true" className="size-4" /></span>
          </div>
          {budgetCounts.length ? (
            <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
              {budgetCounts.map(({ label, count }, index) => (
                <div key={label} className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate text-muted-foreground">{label}</span>
                    <span className="font-semibold tabular-nums text-foreground">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${index === 0 ? "bg-orange-500" : "bg-orange-500/65"}`}
                      style={{ width: `${Math.max(8, (count / maxBudgetCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-2xl bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">Budget preferences will appear as inquiries arrive.</p>
          )}
        </Card>
      </section>

      <section className="px-4 lg:px-6">
        <Card className="gap-0 overflow-hidden rounded-3xl p-0 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 lg:px-6">
            <div>
              <h2 className="font-semibold tracking-tight">Inquiry inbox</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {filtered.length.toLocaleString()} shown{total > inquiries.length ? ` · latest ${inquiries.length} of ${total}` : ""}
              </p>
            </div>
            <Badge className="rounded-full border-orange-500/20 bg-orange-500/10 text-orange-700 hover:bg-orange-500/10 dark:text-orange-400">
              Newest first
            </Badge>
          </div>

          <div className="flex flex-col gap-2 border-b border-border bg-muted/20 p-4 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search brand, contact, email, product…"
                aria-label="Search inquiries"
                className="h-10 rounded-xl bg-background pl-9"
              />
            </div>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger aria-label="Filter by industry" className="h-10 w-full rounded-xl bg-background sm:w-[190px]">
                <SelectValue placeholder="All industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {industries.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
              <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <FiInbox aria-hidden="true" className="size-5" />
              </span>
              <h3 className="font-medium">{inquiries.length ? "No matching inquiries" : "No inquiries yet"}</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {inquiries.length ? "Try another search or clear the industry filter." : "New requests from the launch campaign form will appear here."}
              </p>
              {(search || industry !== "all") && (
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(""); setIndustry("all"); }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((inquiry) => (
                <li key={inquiry.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(inquiry)}
                    className="group flex w-full flex-col gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/35 focus-visible:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500/50 sm:flex-row sm:items-center sm:justify-between lg:px-6"
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-sm font-semibold text-orange-600">
                        {inquiry.brandName.trim().slice(0, 1).toUpperCase() || "?"}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="truncate font-medium text-foreground">{inquiry.brandName}</span>
                          <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-medium">{inquiry.industry}</Badge>
                        </span>
                        <span className="mt-1 block truncate text-sm text-muted-foreground">
                          {inquiry.contactName} <span className="px-1">·</span> {inquiry.product}
                        </span>
                       
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center justify-between gap-4 pl-[52px] sm:pl-0">
                      <span className="text-left sm:text-right">
                       
                        <span className="mt-1 block text-xs text-muted-foreground">{timeAgo(inquiry.createdAt)}</span>
                      </span>
                        <FiArrowUpRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

      </section>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl p-0 sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader className="border-b border-border bg-muted/20 px-5 py-5 pr-12 sm:px-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border-orange-500/20 bg-orange-500/10 text-orange-700 hover:bg-orange-500/10 dark:text-orange-400">{selected.industry}</Badge>
                  <span className="text-xs text-muted-foreground">Received {formatDate(selected.createdAt, { hour: "numeric", minute: "2-digit" })}</span>
                </div>
                <DialogTitle className="text-xl">{selected.brandName}</DialogTitle>
                <DialogDescription>{selected.contactName} · {selected.product}</DialogDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild size="sm" className="rounded-xl bg-orange-500 text-white hover:bg-orange-600">
                    <a href={`mailto:${selected.email}`}><FiMail aria-hidden="true" className="size-4" /> Email contact</a>
                  </Button>
                  {whatsappDigits.length >= 8 && (
                    <Button asChild variant="outline" size="sm" className="rounded-xl">
                      <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer"><FiMessageCircle aria-hidden="true" className="size-4" /> WhatsApp</a>
                    </Button>
                  )}
                  {websiteUrl && (
                    <Button asChild variant="ghost" size="sm" className="rounded-xl">
                      <a href={websiteUrl} target="_blank" rel="noreferrer">Website <FiExternalLink aria-hidden="true" className="size-3.5" /></a>
                    </Button>
                  )}
                </div>
              </DialogHeader>
              <div className="px-5 py-2 sm:px-6">
                <dl>
                  <DetailRow label="Business email">{selected.email}</DetailRow>
                  <DetailRow label="WhatsApp">{selected.whatsapp}</DetailRow>
                  <DetailRow label="Website / Instagram">{selected.website}</DetailRow>
                  <DetailRow label="Campaign objective">{selected.objective}</DetailRow>
                  <DetailRow label="Campaign types">{selected.campaignTypes}</DetailRow>
                  <DetailRow label="Preferred platforms">{selected.platforms}</DetailRow>
                  <DetailRow label="Creator count">{selected.creatorCount}</DetailRow>
                  <DetailRow label="Budget">{selected.budget}</DetailRow>
                  <DetailRow label="Preferred start date">{selected.startDate ? formatDate(selected.startDate) : null}</DetailRow>
                  <DetailRow label="Campaign description">{selected.description}</DetailRow>
                  <DetailRow label="Requirements">{selected.requirements}</DetailRow>
                  <DetailRow label="Additional notes">{selected.additional}</DetailRow>
                </dl>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
