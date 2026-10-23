"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type NavSection = {
  title: string
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}

export function NavMain({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname()
  const isActive = (url: string) =>
    url === "/dashboard"
      ? pathname === url
      : pathname === url || pathname.startsWith(`${url}/`)

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <SidebarGroup key={section.title} className="px-3 py-0">
          <SidebarGroupLabel className="h-8 px-3 text-[13px] font-medium text-sidebar-foreground/45">
            {section.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {section.items.map((item) => {
                const active = isActive(item.url)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-10 rounded-[10px] px-3 text-[15px] font-regular text-sidebar-foreground/75 hover:bg-white/[0.06] hover:text-sidebar-foreground data-active:bg-white/[0.08] data-active:text-sidebar-foreground data-active:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                    >
                      <Link href={item.url} aria-current={active ? "page" : undefined}>
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  )
}
