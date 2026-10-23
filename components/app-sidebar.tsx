"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import Logo from "@/public/assets/logo-expanded.svg"
import {
  ChartNoAxesColumn,
  CircleHelp,
  Compass,
  FileText,
  HandCoins,
  House,
  Landmark,
  Megaphone,
  Settings,
  Users,
} from "lucide-react"
import { SiDiscord } from "react-icons/si"
import { IoFilm } from "react-icons/io5";
import { BiSolidMegaphone } from "react-icons/bi";

import { NavMain, type NavSection } from "@/components/nav-main"
import { useDashboardRole } from "@/components/dashboard-role-provider"
import type { DashboardRole } from "@/lib/roles"
import { Skeleton } from "@/components/ui/skeleton"
import { TbMoneybag } from "react-icons/tb";
import { SidebarUser } from "./sidebarUser"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const roleSections: Record<DashboardRole, NavSection[]> = {
  CREATOR: [
    { title: "Discover", items: [
      { title: "Home", url: "/dashboard", icon: <House /> },
      { title: "Campaigns", url: "/dashboard/campaigns", icon:<BiSolidMegaphone /> },
      { title: "Discover", url: "/discover", icon: <Compass /> },
    ] },
    { title: "My work", items: [
      { title: "Submissions", url: "/dashboard/submission", icon: <IoFilm /> },
      { title: "Earnings", url: "/dashboard/balance", icon: <TbMoneybag /> },
      { title: "Payouts", url: "/dashboard/payouts", icon: <Landmark /> },
    ] },
    { title: "Account", items: [
      { title: "Settings", url: "/settings", icon: <Settings /> },
      { title: "Help & support", url: "mailto:support@konnectika.com", icon: <CircleHelp /> },
    ] },
  ],
  BRAND: [
    { title: "Discover", items: [
      { title: "Home", url: "/dashboard", icon: <House /> },
      { title: "Campaigns", url: "/dashboard/campaigns", icon: <BiSolidMegaphone /> },
      { title: "Discover", url: "/discover", icon: <Compass /> },
    ] },
    { title: "My work", items: [
      { title: "Submissions", url: "/dashboard/submission", icon: <IoFilm /> },
      { title: "Earnings", url: "/dashboard/balance", icon: <TbMoneybag /> },
      { title: "Applicants", url: "/dashboard/applicants", icon: <Users /> },
    ] },
    { title: "Account", items: [
      { title: "Settings", url: "/settings", icon: <Settings /> },
      { title: "Help & support", url: "mailto:support@konnectika.com", icon: <CircleHelp /> },
    ] },
  ],
  ADMIN: [
    { title: "Discover", items: [
      { title: "Home", url: "/dashboard", icon: <House /> },
      { title: "Campaigns", url: "/dashboard/campaigns", icon: <BiSolidMegaphone /> },
      { title: "Discover", url: "/discover", icon: <Compass /> },
    ] },
    { title: "My work", items: [
      { title: "Submissions", url: "/dashboard/submission", icon: <IoFilm /> },
      { title: "Applicants", url: "/dashboard/applicants", icon: <Users /> },
      { title: "Payouts", url: "/dashboard/payouts", icon: <Landmark /> },
      { title: "Payments", url: "/dashboard/payments", icon: <HandCoins /> },
      { title: "Revenue", url: "/dashboard/revenue", icon: <ChartNoAxesColumn /> },
    ] },
    { title: "Account", items: [
      { title: "Settings", url: "/settings", icon: <Settings /> },
      { title: "Help & support", url: "mailto:support@konnectika.com", icon: <CircleHelp /> },
    ] },
  ],
}

function SidebarNavigationSkeleton() {
  return (
    <div role="status" aria-label="Loading navigation" className="space-y-5 px-3">
      <span className="sr-only">Loading navigation</span>
      {[3, 4, 2].map((itemCount, sectionIndex) => (
        <div key={sectionIndex} className="space-y-2">
          <Skeleton aria-hidden="true" className="ml-3 h-3 w-16 bg-sidebar-foreground/10" />
          <div className="space-y-1">
            {Array.from({ length: itemCount }, (_, itemIndex) => (
              <div key={itemIndex} className="flex h-10 items-center gap-3 rounded-[10px] px-3">
                <Skeleton aria-hidden="true" className="size-[20px] shrink-0 rounded-[5px] bg-sidebar-foreground/10" />
                <Skeleton
                  aria-hidden="true"
                  className={`h-5 bg-sidebar-foreground/10 ${itemIndex % 2 === 0 ? "w-24" : "w-32"}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const role = useDashboardRole()

  const sections = role ? roleSections[role] : []

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-3 pb-3 pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-10 items-center justify-between gap-2 px-1">
              <Link href="/dashboard" aria-label="Konnectika home" className="min-w-0">
                <Image
                  src={Logo}
                  alt="Konnectika"
                  width={154}
                  height={34}
                  priority
                  className="h-auto w-[154px]"
                />
              </Link>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-0 pb-3">
        {role ? <NavMain sections={roleSections[role]} /> : <SidebarNavigationSkeleton />}
        
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.06] px-2 py-2">
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  )
}
