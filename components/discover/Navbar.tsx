"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, ChevronDown } from "lucide-react";

const navLinks = [
  { label: "Discover", href: "/discover" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Messages", href: "/messages" },
  { label: "Applications", href: "/applications" },
  { label: "Payments", href: "/payments" },
];
import { Bricolage_Grotesque } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
        <Link href="/" className={`text-white flex items-center gap-2 self-center font-bold text-[36px] ${bricolage.className}`}>
         
         
          Konnectika
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-red-500"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <button className="p-2 text-zinc-400 hover:text-white transition-colors">
            <Bookmark size={20} />
          </button>
          <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-white/10 hover:border-white/20 transition-colors">
            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-white">
              JD
            </div>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>
        </div>
      </div>
    </nav>
  );
}
