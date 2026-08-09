import Link from "next/link";
import Image from "next/image";
import {
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
  FaFacebook,
} from "react-icons/fa6";

import LogoMark from "@/public/assets/logo-plain.svg";
import { footerGroups, socialLinks } from "@/data/home";
import type { Audience } from "@/components/home/dual/AudienceToggle";
import { cn } from "@/lib/utils";

const socialIcons = {
  Instagram: FaInstagram,
  TikTok: FaTiktok,
  X: FaXTwitter,
  YouTube: FaYoutube,
  Facebook: FaFacebook,
};

interface FooterProps {
  mode: Audience;
}

export function Footer({ mode }: FooterProps) {
  const brand = mode === "brand";

  return (
    <footer
      className={cn(
        "border-t",
        brand
          ? "border-zinc-800 bg-zinc-950 text-zinc-300"
          : "border-border bg-zinc-50 text-muted-foreground"
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src={LogoMark}
                alt=""
                width={38}
                height={38}
                className="h-auto w-auto"
              />
             
            </div>
            <p
              className={cn(
                "mt-4 max-w-xs text-sm leading-relaxed",
                brand ? "text-zinc-400" : "text-muted-foreground"
              )}
            >
              Where African creativity meets opportunity. Connecting creators
              and brands for authentic, rewarding collaborations.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {socialLinks.map((social) => {
                const Icon =
                  socialIcons[social.label as keyof typeof socialIcons];
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border transition-colors",
                      brand
                        ? "border-zinc-800 text-zinc-400 hover:border-primary/40 hover:bg-primary/10 hover:text-white"
                        : "border-zinc-200 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerGroups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h3
                  className={cn(
                    "text-sm font-semibold",
                    brand ? "text-white" : "text-foreground"
                  )}
                >
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className={cn(
                          "text-sm transition-colors",
                          brand
                            ? "text-zinc-400 hover:text-orange-400"
                            : "text-muted-foreground hover:text-primary"
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "mt-14 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row",
            brand ? "border-zinc-800" : "border-border"
          )}
        >
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Konnectika. All rights reserved.
          </p>
          <p className="text-xs text-zinc-500">
            Made with{" "}
            <span className={brand ? "text-primary" : "text-primary"}>love</span>{" "}
            for African creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
