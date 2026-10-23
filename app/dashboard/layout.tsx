import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/auth"
import { DashboardRoleProvider } from "@/components/dashboard-role-provider"
import { isDashboardRole } from "@/lib/roles"

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
