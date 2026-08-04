// app/dashboard/submission/page.tsx
//
// Route: /dashboard/submission
//
// Server component that loads the session, then renders one of three
// views depending on role. Each view is a separate client component
// (below) so state/interactivity stays isolated per-role.

import { getSessionUser } from "@/lib/getSessionUser";
import { redirect } from "next/navigation";
import CreatorSubmissionView from "./CreatorSubmissionView";
import BrandSubmissionView from "./BrandSubmissionView";
import AdminSubmissionView from "./AdminSubmissionView";
import DashboardShell from "../components/dashboard-shell";

export default async function SubmissionPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
    <DashboardShell>
         <main className=" px-4 py-8">
      {user.role === "CREATOR" &&
      
        <CreatorSubmissionView />
      
}
      
      {user.role === "BRAND" && <BrandSubmissionView />}
      {user.role === "ADMIN" && <AdminSubmissionView />}
    </main>
    </DashboardShell>
  
    </>
   
  );
}
