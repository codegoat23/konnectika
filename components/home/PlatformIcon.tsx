import { FaInstagram, FaTiktok, FaYoutube, FaFacebook, FaXTwitter } from "react-icons/fa6";
import type { HomePlatform } from "@/data/home";

const platformConfig: Record<
  HomePlatform,
  { label: string; bg: string; text: string; Icon: typeof FaInstagram }
> = {
  instagram: { label: "Instagram", bg: "#e1306c", text: "text-white", Icon: FaInstagram },
  tiktok: { label: "TikTok", bg: "#000000", text: "text-white", Icon: FaTiktok },
  youtube: { label: "YouTube", bg: "#ff0000", text: "text-white", Icon: FaYoutube },
  facebook: { label: "Facebook", bg: "#1877f2", text: "text-white", Icon: FaFacebook },
  x: { label: "X", bg: "#0f172a", text: "text-white", Icon: FaXTwitter },
};

interface PlatformIconProps {
  platform: HomePlatform;
  size?: "sm" | "md";
}

export function PlatformIcon({ platform, size = "sm" }: PlatformIconProps) {
  const { label, bg, text, Icon } = platformConfig[platform];
  const box = size === "sm" ? "size-6" : "size-7";
  const icon = size === "sm" ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${box} ${text} shadow-sm`}
      style={{ backgroundColor: bg }}
      title={label}
      aria-label={label}
    >
      <Icon size={icon} />
    </span>
  );
}
