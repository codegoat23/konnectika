import type { Platform } from "@/types";
import {
  FaInstagram,
  FaTiktok,
  FaFacebook,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";

interface PlatformIconsProps {
  platforms: Platform[];
  size?: "sm" | "md";
}

const platformConfig = {
  instagram: {
    bg: "bg-gradient-to-br from-purple-500 to-pink-500",
    icon: FaInstagram,
  },
  tiktok: {
    bg: "bg-black border border-zinc-700",
    icon: FaTiktok,
  },
  facebook: {
    bg: "bg-blue-600",
    icon: FaFacebook,
  },
  youtube: {
    bg: "bg-red-600",
    icon: FaYoutube,
  },
  x: {
    bg: "bg-zinc-800 border border-zinc-700",
    icon: FaXTwitter,
  },
} as const;

export default function PlatformIcons({
  platforms,
  size = "sm",
}: PlatformIconsProps) {
const dim =
  size === "sm"
    ? "w-6 h-6"
    : "w-7 h-7";

 const iconSize = size === "sm" ? 14 : 16;

  return (
    <div className="flex items-center gap-1">
      {platforms.map((p) => {
        const cfg = platformConfig[p];
        const Icon = cfg.icon;

        return (
          <div
            key={p}
            className={`${dim}  rounded flex items-center justify-center text-white`}
            title={p}
          >
            <Icon size={iconSize} />
          </div>
        );
      })}
    </div>
  );
}