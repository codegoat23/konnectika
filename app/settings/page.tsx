import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardRoleProvider } from "@/components/dashboard-role-provider";
import { isDashboardRole } from "@/lib/roles";
import { getAuthUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings | Konnectika",
  description: "Manage your account and preferences.",
};

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user || !isDashboardRole(user.role)) {
    redirect("/login");
  }

  return (
    <DashboardRoleProvider role={user.role}>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Settings
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        Manage your profile, notifications, and billing preferences.
                      </p>
                    </div>

                    <div className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
                      <div className="space-y-1">
                        <h2 className="text-lg font-medium">Profile</h2>
                        <p className="text-sm text-muted-foreground">
                          Update your personal information and contact details.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
                      <div className="space-y-1">
                        <h2 className="text-lg font-medium">Notifications</h2>
                        <p className="text-sm text-muted-foreground">
                          Choose how you receive updates and alerts.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
                      <div className="space-y-1">
                        <h2 className="text-lg font-medium">Billing</h2>
                        <p className="text-sm text-muted-foreground">
                          Manage your subscription and payment methods.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </SidebarInset>
        </SidebarProvider>
      </DashboardRoleProvider>
  );
}
