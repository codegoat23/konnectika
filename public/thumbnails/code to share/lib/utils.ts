import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Platform } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTZS(amount: number): string {
  return new Intl.NumberFormat("en-TZ").format(amount);
}

export function getProgressPercent(funded: number, total: number): number {
  return Math.round((funded / total) * 100);
}

export function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    facebook: "Facebook",
    youtube: "YouTube",
    x: "X",
  };
  return labels[platform];
}

export function getBadgeStyles(badge: string): { bg: string; text: string; label: string } {
  switch (badge) {
    case "featured":
      return { bg: "bg-red-500/20 border border-red-500/30", text: "text-red-400", label: "Featured" };
    case "hot":
      return { bg: "bg-orange-500/20 border border-orange-500/30", text: "text-orange-400", label: "Hot" };
    case "new":
      return { bg: "bg-blue-500/20 border border-blue-500/30", text: "text-blue-400", label: "New" };
    case "active":
    default:
      return { bg: "bg-green-500/20 border border-green-500/30", text: "text-green-400", label: "Active" };
  }
}

export function getDaysLeftColor(days: number): string {
  if (days <= 2) return "text-red-400";
  if (days <= 5) return "text-orange-400";
  return "text-green-400";
}