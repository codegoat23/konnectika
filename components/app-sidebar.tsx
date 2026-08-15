"use client"

import * as React from "react"
import Logo from "@/public/assets/logo.svg"
import Image from "next/image";



import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon, Megaphone, Send, WalletIcon, Landmark } from "lucide-react"
import { TbBrandGoogleAnalytics } from "react-icons/tb";
import { GoHome } from "react-icons/go";

import { Bricolage_Grotesque } from "next/font/google";
import { LogoutButton } from "./logoutButton"
import { SidebarUser } from "./sidebarUser";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <GoHome
        />
      ),
    },
    {
      title: "Campaigns",
      url: "/dashboard/campaigns",
      icon: (
        <Megaphone
        />
      ),
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: (
       <TbBrandGoogleAnalytics />
      ),
    },
    {
      title: "Submissions",
      url: "/dashboard/submission",
      icon: (
        <Send
        />
      ),
    },
    {
      title: "Balance",
      url: "/dashboard/balance",
      icon: (
        <WalletIcon
        
        />
      ),
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: (
        <CameraIcon
        />
      ),
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: (
        <FileTextIcon
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: (
        <FileTextIcon
        />
      ),
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
    },
    {
      title: "Get Help",
      url: "#",
      icon: (
        <CircleHelpIcon
        />
      ),
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <SearchIcon
        />
      ),
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: (
        <DatabaseIcon
        />
      ),
    },
    {
      name: "Reports",
      url: "#",
      icon: (
        <FileChartColumnIcon
        />
      ),
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: (
        <FileIcon
        />
      ),
    },
  ],
}
const user = {
  name:"Eric Shija",
  email: "codesmrt@gmail.com",
  avatar: "ES"
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/user")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRole(data?.User?.role ?? null))
      .catch(() => {});
  }, []);

  const navMain = React.useMemo(() => {
    // Admins have no wallet balance — that page just redirects to the payout
    // dashboard, so drop it from their nav.
    const items =
      role === "ADMIN"
        ? data.navMain.filter((item) => item.url !== "/dashboard/balance")
        : [...data.navMain];
    if (role === "ADMIN" || role === "BRAND") {
      items.push({
        title: "Applicants",
        url: "/dashboard/applicants",
        icon: <UsersIcon />,
      });
    }
    if (role === "ADMIN" || role === "CREATOR") {
      items.push({
        title: "Payouts",
        url: "/dashboard/payouts",
        icon: <Landmark />,
      });
    }
    if (role === "ADMIN") {
      items.push({
        title: "Revenue",
        url: "/dashboard/revenue",
        icon: <Landmark />,
      });
    }
    return items;
  }, [role]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
             <div className="flex items-center justify-baseline  py-1">
  <Image
    src={Logo}
    alt="Konnectika"
    width={180}
    height={34}
    priority
    className="h-auto w-full max-w-[190px]"
  />
</div>
       
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain}  />
        
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
      
      <SidebarUser/>
     </SidebarFooter>
    </Sidebar>
  )
}
