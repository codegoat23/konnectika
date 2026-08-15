"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { FaTwitter, FaInstagram, FaYoutube, FaTiktok, FaGithub } from "react-icons/fa";

const platforms = [
  {
    name: "Twitter / X",
    icon: FaTwitter,
    status: "Connected",
    color: "text-muted-foreground",
  },
  {
    name: "Instagram",
    icon: FaInstagram,
    status: "Connected",
    color: "text-muted-foreground",
  },
  {
    name: "YouTube",
    icon: FaYoutube,
    status: "Connected",
    color: "text-muted-foreground",
  },
  {
    name: "TikTok",
    icon: FaTiktok,
    status: "Not Connected",
    color: "text-zinc-700",
  },
  {
    name: "GitHub",
    icon: FaGithub,
    status: "Connected",
    color: "text-foreground",
  },
];

export default function ConnectedPlatformsAccordion() {
  return (
    <div className="w-full rounded-2xl border bg-card p-3 shadow-sm">
      <Accordion type="single" collapsible>
        <AccordionItem value="platforms" className="border-none">
          
          {/* Header */}
          <AccordionTrigger className="text-sm font-semibold text-foreground">
            Connected Platforms
          </AccordionTrigger>

          {/* Content */}
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {platforms.map((platform, i) => {
                const Icon = platform.icon;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border bg-muted px-3 py-2"
                  >
                    {/* Left side */}
                    <div className="flex items-center gap-3">
                      <Icon className={`text-lg ${platform.color}`} />

                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {platform.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {platform.status}
                        </p>
                      </div>
                    </div>

                    {/* status dot */}
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        platform.status === "Connected"
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/40"
                      }`}
                    />
                  </div>
                );
              })}

              {/* View All */}
              <button className="mt-2 w-full rounded-xl border border-border bg-muted py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent">
                View All
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}