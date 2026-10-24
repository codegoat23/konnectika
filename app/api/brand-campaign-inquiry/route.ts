import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const campaignTypes = ["User-Generated Content (UGC)", "Sponsored Content", "Affiliate Marketing", "Brand Ambassador", "Content Clipping", "Other"] as const;
const platforms = ["Instagram", "TikTok", "YouTube", "Facebook", "Other"] as const;
const industries = ["Fashion", "Beauty", "Food & Beverage", "Technology/Gadgets", "Lifestyle", "Education", "Other"] as const;
const objectives = ["Brand awareness", "Increase sales", "Promote a product launch", "Generate leads", "Create content for social media", "Other"] as const;
const budgets = ["Below TZS 200,000", "TZS 200,000–500,000", "TZS 500,000–1,000,000", "TZS 1,000,000–3,000,000", "Above TZS 3,000,000", "Not sure yet"] as const;
const schema = z.object({
  brandName: z.string().trim().min(1).max(120), contactName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254), whatsapp: z.string().trim().regex(/^\+?[0-9().\s-]{7,24}$/),
  website: z.string().trim().max(250).optional().default(""), industry: z.enum(industries),
  campaignTypes: z.string().min(1).max(300), objective: z.enum(objectives), product: z.string().trim().min(1).max(180),
  description: z.string().trim().min(20).max(4000), requirements: z.string().trim().max(4000).optional().default(""), platforms: z.string().min(1).max(100),
  creatorCount: z.enum(["1", "2–5", "6–10", "10+"]).optional().or(z.literal("")), budget: z.enum(budgets),
  startDate: z.string().max(10).optional().or(z.literal("")), additional: z.string().trim().max(2000).optional().default(""),
  websiteConfirm: z.string().max(0).optional().default(""),
});

const windows = new Map<string, { count: number; resetAt: number }>();
function allowed(ip: string) {
  const now = Date.now();
  const window = windows.get(ip);
  if (!window || window.resetAt <= now) { windows.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 }); return true; }
  if (window.count >= 5) return false;
  window.count += 1;
  return true;
}
function esc(value: string) { return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!); }
function field(label: string, value: string) { return `<tr><th style="text-align:left;padding:10px;border-bottom:1px solid #eee;color:#555;width:210px">${label}</th><td style="padding:10px;border-bottom:1px solid #eee">${esc(value || "—").replace(/\n/g, "<br>")}</td></tr>`; }

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowed(ip)) return Response.json({ error: "Too many inquiries from this connection. Please try again later." }, { status: 429 });
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CAMPAIGN_NOTIFICATION_EMAIL;
  const from = process.env.CAMPAIGN_SENDER_EMAIL;
  if (!apiKey || !to || !from) return Response.json({ error: "Inquiry submissions are temporarily unavailable. Please contact our team directly." }, { status: 503 });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16_000) return Response.json({ error: "The submitted form is too large." }, { status: 413 });
  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: "Please submit a valid form." }, { status: 400 }); }
  if (raw && typeof raw === "object" && "websiteConfirm" in raw && (raw as { websiteConfirm?: unknown }).websiteConfirm) {
    return Response.json({ ok: true });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Please check the required fields and try again." }, { status: 400 });
  const data = parsed.data;
  const selectedCampaignTypes = data.campaignTypes.split(", ");
  const selectedPlatforms = data.platforms.split(", ");
  if (selectedCampaignTypes.some((item) => !campaignTypes.includes(item as (typeof campaignTypes)[number])) || selectedPlatforms.some((item) => !platforms.includes(item as (typeof platforms)[number]))) {
    return Response.json({ error: "Please choose valid campaign types and platforms." }, { status: 400 });
  }
  if (data.startDate && (!/^\d{4}-\d{2}-\d{2}$/.test(data.startDate) || Number.isNaN(Date.parse(`${data.startDate}T00:00:00.000Z`)))) {
    return Response.json({ error: "Enter a valid campaign start date." }, { status: 400 });
  }
  const cleanPhone = data.whatsapp.replace(/[^0-9+]/g, "");
  const digits = cleanPhone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return Response.json({ error: "Enter a valid WhatsApp number with country code." }, { status: 400 });
  const whatsapp = `https://wa.me/${digits}`;
  const createdAt = new Date();
  const rows = [
    field("Brand name", data.brandName), field("Contact person", data.contactName), field("Business email", data.email),
    field("WhatsApp", data.whatsapp), field("Industry", data.industry),
    field("Campaign types", data.campaignTypes), field("Objective", data.objective), field("Product or service", data.product),
    field("Campaign description", data.description), field("Campaign requirements", data.requirements), field("Platforms", data.platforms), field("Creators needed", data.creatorCount || "Not specified"),
    field("Budget", data.budget), field("Preferred start date", data.startDate || "Not specified"), field("Additional requirements", data.additional),
    field("Website / Instagram", data.website), field("Submitted at", `${createdAt.toISOString()} (UTC)`),
  ].join("");
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: `New Campaign Inquiry: ${data.brandName}`, reply_to: data.email,
        html: `<div style="font-family:Arial,sans-serif;color:#171717"><h2>New campaign inquiry</h2><p>A brand submitted a campaign inquiry on Konnectika.</p><table style="border-collapse:collapse;width:100%;max-width:760px">${rows}</table><p><a href="${whatsapp}">Open WhatsApp conversation</a></p></div>` }),
    });
    if (!response.ok) {
      console.error("[brand-campaign-inquiry] email provider rejected request", response.status);
      return Response.json({ error: "We couldn't deliver your inquiry right now. Please try again shortly." }, { status: 502 });
    }
    await prisma.campaignInquiry.create({ data: {
      brandName: data.brandName, contactName: data.contactName, email: data.email, whatsapp: data.whatsapp,
      website: data.website || null, industry: data.industry, campaignTypes: data.campaignTypes,
      objective: data.objective, product: data.product, description: data.description, requirements: data.requirements || null, platforms: data.platforms,
      creatorCount: data.creatorCount || null, budget: data.budget, startDate: data.startDate ? new Date(`${data.startDate}T00:00:00.000Z`) : null,
      additional: data.additional || null,
    } });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[brand-campaign-inquiry] submission failed", error);
    return Response.json({ error: "We couldn't process your inquiry right now. Please try again shortly." }, { status: 500 });
  }
}
