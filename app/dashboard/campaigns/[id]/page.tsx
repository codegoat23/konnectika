"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Prisma } from "@prisma/client";
import DashboardShell from "../../components/dashboard-shell";
import AdminCampaignReview from "./admin/AdminCampaignReview";
import BrandCampaignView from "./brand/BrandCampaignView";
import CreatorCampaignView from "./creator/CreatorCampaignView";

type CampaignDetails = Prisma.CampaignGetPayload<{
  include: {
    businessProfile: true;
    _count: { select: { applications: true } };
  };
}>;

type CampaignApplicationSelf = Prisma.CampaignApplicationGetPayload<{
  include: { submission: true };
}>;

type CampaignApplicationDetails = Prisma.CampaignApplicationGetPayload<{
  include: {
    creator: { include: { socialAccounts: true } };
    submission: true;
  };
}>;

type CampaignDetailsResponse = {
  role: "ADMIN" | "BRAND" | "CREATOR";
  campaign?: CampaignDetails | null;
  applications?: CampaignApplicationDetails[];
  application?: CampaignApplicationSelf | null;
  page?: number;
  totalApplications?: number;
  totalPages?: number;
};

export default function CampaignDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState<CampaignDetailsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loadingData, setLoadingData] = useState(true);

  async function load() {
    setLoadingData(true);

    const res = await fetch(`/api/campaign/${id}/details?page=${page}`);
    const json = await res.json();
    setData(json);

    setLoadingData(false);
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/campaign/${id}/details?page=${page}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, page]);

  if (loadingData) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="h-52 bg-zinc-800 rounded-3xl animate-pulse" />
        <div className="h-6 bg-zinc-800 rounded w-1/3 animate-pulse" />
        <div className="h-40 bg-zinc-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const campaign = data?.campaign;
  const applications = data?.applications || [];
  const role = data?.role;
  const application = data?.application;

  const creatorStatus = application?.submission?.status || application?.status;

  if (!campaign) {
    return (
      <DashboardShell>
        <div className="max-w-5xl px-4 py-12 text-center text-zinc-400">
          Campaign not found.
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-5xl px-4 space-y-6">
        {role === "ADMIN" ? (
        
          <AdminCampaignReview campaign={campaign} />
        ) : (
          <>
           

          

            

           {role === "BRAND" && (
  <BrandCampaignView
    campaign={campaign}
    applications={applications}
    page={page}
    onPageChange={setPage}
    onActionComplete={load}
  />
)}

           {role === "CREATOR" && (
  <CreatorCampaignView
    campaign={campaign}
    application={application ?? null}
    creatorStatus={creatorStatus}
  />
)}
         
          </>
        )}
      </div>
    </DashboardShell>
  );
}