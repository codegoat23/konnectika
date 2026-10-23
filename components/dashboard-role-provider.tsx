"use client"

import { createContext, useContext } from "react"
import type { DashboardRole } from "@/lib/roles"

const DashboardRoleContext = createContext<DashboardRole | null>(null)

export function DashboardRoleProvider({
  role,
  children,
}: {
  role: DashboardRole
  children: React.ReactNode
}) {
  return (
    <DashboardRoleContext.Provider value={role}>
      {children}
    </DashboardRoleContext.Provider>
  )
}

export function useDashboardRole() {
  return useContext(DashboardRoleContext)
}
