"use client"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CirclePlusIcon, Moon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import NotificationBell from "./notifications/NotificationBell"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const pathname = usePathname()

  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(`${url}/`)

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="mt-2">
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <CirclePlusIcon
              />
              <span>Quick Guide</span>
            </SidebarMenuButton>
             <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0 "
              style={{
                borderRadius:"10px"
              }}
              variant="outline"
            >
              <Moon
              />
              <span className="sr-only">Mode</span>
            </Button>
           <NotificationBell />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="mt-6 gap-3">
          {items.map((item) => {
            const active = isActive(item.url)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className="relative cursor-pointer"
                >
                  <Link href={item.url} className="flex items-center gap-2">
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    {item.icon}
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
