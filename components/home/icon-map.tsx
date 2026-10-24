import {
  Compass,
  Camera,
  Wallet,
  Rocket,
  Users,
  TrendingUp,
  Sparkles,
  Briefcase,
  Handshake,
  Megaphone,
  ClipboardList,
  BarChart3,
  Search,
  Zap,
  MessagesSquare,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { BiSolidMegaphone } from "react-icons/bi";

const iconMap: Record<string, LucideIcon> = {
  Compass,
  Camera,
  Wallet,
  Rocket,
  Users,
  TrendingUp,
  Sparkles,
  Briefcase,
  Handshake,
  Megaphone,
  ClipboardList,
  BarChart3,
  Search,
  Zap,
  MessagesSquare,
  UserCheck,
};

export function HomeIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? Sparkles;
  return <Icon className={className} />;
}
