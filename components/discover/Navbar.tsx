"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, ChevronDown } from "lucide-react";

import { sora } from "@/app/font";

const navLinks = [
  { label: "Discover", href: "/discover" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Messages", href: "/messages" },
  { label: "Applications", href: "/applications" },
  { label: "Payments", href: "/payments" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
        <Link href="/" className={`text-foreground flex items-center gap-2 self-center font-bold text-[36px] ${sora.className}`}>
         
         
          Konnectika
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-orange-500"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bookmark size={20} />
          </button>
          <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-border hover:border-border transition-colors">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">
              JD
            </div>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </nav>
  );
}
