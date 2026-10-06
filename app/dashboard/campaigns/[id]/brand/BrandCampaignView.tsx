"use client";

import CampaignOverview from "../components/CampaignOverview";
import CampaignAnalytics from "../components/CampaignAnalytics";
import CampaignBudget from "../components/CampaignBudget";
import CampaignHeader from "../components/CampaignHeader";
import PaymentBreakdown from "../../components/PaymentBreakdown";
import BrandPaymentSection from "./BrandPaymentSection";
import { PaymentMethodDisplay } from "@/components/payment-method-display";
import { useParams, useRouter } from "next/navigation";
import { Users } from "lucide-react";
import type { Prisma } from "@prisma/client";

type CampaignDetails = Prisma.CampaignGetPayload<{
  include: {
    businessProfile: true;
    _count: { select: { applications: true } };
  };
}>;

export default function BrandCampaignView({
  campaign,
}: {
  campaign: CampaignDetails;
}) {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className="space-y-6 ">
      <CampaignHeader
        campaign={campaign}
        role="BRAND"
        onEdit={() => router.push(`/dashboard/campaigns/${id}/edit`)}
        actions={
          <button
            onClick={() => router.push("/dashboard/applicants")}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-foreground/90"
          >
            <Users size={16} />
            View Applicants
          </button>
        }
      />

      <CampaignOverview campaign={campaign} />

      <div className="grid gap-6 2xl:grid-cols-2">
        <CampaignAnalytics
          role="BRAND"
          applicantsCount={campaign._count.applications}
        />

        <CampaignBudget campaign={campaign} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PaymentBreakdown
          budget={campaign.budgetTotal}
          feeRate={campaign.platformFeeRate}
          fee={campaign.platformFee}
          total={campaign.totalCharge}
          paymentStatus={campaign.paymentStatus}
          showStatus
          title="Payment"
          className={campaign.paymentMethod ? undefined : "xl:col-span-2"}
        />

        {campaign.paymentMethod && (
          <div
            className="bg-muted/50 border border-border p-4 rounded-[24]"
            style={{ borderRadius: 24 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Payment Source
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Method</span>
              <PaymentMethodDisplay
                method={campaign.paymentMethod}
                className="font-medium"
              />
            </div>
            {campaign.paymentPhone && (
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Phone</span>
                <span className="text-foreground font-medium">
                  {campaign.paymentPhone}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <BrandPaymentSection
        campaignId={campaign.id}
        campaignName={campaign.name}
        initialStatus={campaign.paymentStatus}
      />
    </div>
  );
}
