"use client";

import CampaignOverview from "../components/CampaignOverview";
import CampaignAnalytics from "../components/CampaignAnalytics";
import CampaignBudget from "../components/CampaignBudget";
import CampaignHeader from "../components/CampaignHeader";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";

type CampaignDetails = Prisma.CampaignGetPayload<{
  include: {
    businessProfile: true;
    _count: { select: { applications: true } };
  };
}>;

type CampaignApplicationSelf = Prisma.CampaignApplicationGetPayload<{
  include: { submission: true };
}>;

export default function CreatorCampaignView({
  campaign,
  application,
  creatorStatus,
}: {
  campaign: CampaignDetails;
  application: CampaignApplicationSelf | null;
  creatorStatus?: string;
}) {
  const router = useRouter();

  if (!application) return null;

  return (
<>
  <CampaignHeader
          campaign={campaign}
          role="CREATOR"
          creatorStatus={creatorStatus}
          onBack={() => router.back()}
        />
         <CampaignBudget
          campaign={campaign}
        />
   <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_440px] gap-6">


      {/* LEFT: CREATOR APPLICATION */}

      <div
        className="bg-card border border-border p-5"
        style={{borderRadius:24}}
      >


        <h3 className="text-foreground font-semibold mb-4">
          Your Application
        </h3>



        <div className="space-y-3 text-sm">


          <p className="text-muted-foreground">

            Status:

            <span className="ml-2 text-foreground">
              {creatorStatus}
            </span>

          </p>



          <p className="text-muted-foreground">

            Applied:

            <span className="ml-2 text-foreground">

              {
                new Date(
                  application.createdAt
                ).toLocaleDateString()
              }

            </span>

          </p>




          {
            application.message && (

              <div className="mt-4">

                <p className="text-muted-foreground text-xs">
                  Your Message
                </p>


                <p className="text-muted-foreground mt-1">
                  {application.message}
                </p>


              </div>

            )
          }



          {
            application.submission && (

              <div
                className="
                mt-5
                bg-muted/40
                border
                border-border
                p-4
                "
                style={{borderRadius:16}}
              >

                <h4 className="text-foreground font-medium mb-3">
                  Submission
                </h4>


                <div className="space-y-2 text-sm text-muted-foreground">


                  <p>
                    Screenshots:
                    {" "}
                    {
                      application.submission.screenshots?.length || 0
                    }
                  </p>



                  <p>
                    Links:
                    {" "}
                    {
                      application.submission.postLinks?.length || 0
                    }
                  </p>



                  {
                    application.submission.caption && (

                      <p className="text-muted-foreground">
                        &quot;{application.submission.caption}&quot;
                      </p>

                    )
                  }


                </div>

              </div>

            )
          }



        </div>


      </div>





      {/* RIGHT: CAMPAIGN CONTEXT */}

      <div className="space-y-6">

      
        <CampaignOverview
          campaign={campaign}
        />



        <CampaignAnalytics
          role="CREATOR"
          applicantsCount={0}
        />



       


      </div>



    </div>
</>
 

  );
}