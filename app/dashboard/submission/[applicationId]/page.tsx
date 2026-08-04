// app/dashboard/submission/[applicationId]/page.tsx
//
// Route: /dashboard/submission/[applicationId]
//
// Server shell — just checks auth/role and passes the id down. All the
// actual data loading + form happens client-side in SubmitProofForm,
// since it needs interactivity (file inputs, upload progress, etc.)

import { getSessionUser } from "@/lib/getSessionUser";
import { redirect } from "next/navigation";
import SubmitProofForm from "./SubmitProofForm";
import DashboardShell from "../../components/dashboard-shell";

export default async function SubmitProofPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;

  const user = await getSessionUser();

  if (!user) redirect("/login");
  if (user.role !== "CREATOR") redirect("/dashboard/submission");

  return (
    <DashboardShell>
      <main className="">
        <SubmitProofForm applicationId={applicationId} />
      </main>
    </DashboardShell>
  );
}
