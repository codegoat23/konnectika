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
    bg: "bg-muted border border-border",
    icon: FaInstagram,
  },
  tiktok: {
    bg: "bg-black border border-border",
    icon: FaTiktok,
  },
  facebook: {
    bg: "bg-muted border border-border",
    icon: FaFacebook,
  },
  youtube: {
    bg: "bg-muted border border-border",
    icon: FaYoutube,
  },
  x: {
    bg: "bg-muted border border-border",
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
            className={`${dim}  rounded flex items-center justify-center text-foreground`}
            title={p}
          >
            <Icon size={iconSize} />
          </div>
        );
      })}
    </div>
  );
}