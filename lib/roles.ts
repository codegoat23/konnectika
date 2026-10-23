export type DashboardRole = "CREATOR" | "BRAND" | "ADMIN"

export function isDashboardRole(role: string): role is DashboardRole {
  return role === "CREATOR" || role === "BRAND" || role === "ADMIN"
}
