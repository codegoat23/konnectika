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
   <div className="grid lg:grid-cols-[1fr_380px] gap-6">


      {/* LEFT: CREATOR APPLICATION */}

      <div
        className="bg-zinc-900 border border-white/10 p-5"
        style={{borderRadius:24}}
      >


        <h3 className="text-white font-semibold mb-4">
          Your Application
        </h3>



        <div className="space-y-3 text-sm">


          <p className="text-zinc-400">

            Status:

            <span className="ml-2 text-white">
              {creatorStatus}
            </span>

          </p>



          <p className="text-zinc-400">

            Applied:

            <span className="ml-2 text-white">

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

                <p className="text-zinc-500 text-xs">
                  Your Message
                </p>


                <p className="text-zinc-300 mt-1">
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
                bg-zinc-800/40
                border
                border-white/10
                p-4
                "
                style={{borderRadius:16}}
              >

                <h4 className="text-white font-medium mb-3">
                  Submission
                </h4>


                <div className="space-y-2 text-sm text-zinc-300">


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

                      <p className="text-zinc-400">
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