import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { DashboardRoleProvider } from "@/components/dashboard-role-provider"
import { isDashboardRole } from "@/lib/roles"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  if (!user || !isDashboardRole(user.role)) {
    redirect("/login")
  }

  return (
    <DashboardRoleProvider role={user.role}>
      {children}
    </DashboardRoleProvider>
  )
}
