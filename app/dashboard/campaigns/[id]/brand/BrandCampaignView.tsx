"use client";

import { useState } from "react";
import { Check, ChevronRight, MessageSquareMore, Users, X } from "lucide-react";

import {
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaGlobe,
} from "react-icons/fa";

import { SiTiktok } from "react-icons/si";

import CampaignOverview from "../components/CampaignOverview";
import CampaignAnalytics from "../components/CampaignAnalytics";
import CampaignBudget from "../components/CampaignBudget";
import CampaignHeader from "../components/CampaignHeader";
import PaymentBreakdown from "../../components/PaymentBreakdown";
import { useParams, useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import type { IconType } from "react-icons";

type CampaignDetails = Prisma.CampaignGetPayload<{
  include: {
    businessProfile: true;
    _count: { select: { applications: true } };
  };
}>;

type CampaignApplicationDetails = Prisma.CampaignApplicationGetPayload<{
  include: {
    creator: { include: { socialAccounts: true } };
    submission: true;
  };
}>;

const platformIcons: Record<string, IconType> = {
  instagram: FaInstagram,
  youtube: FaYoutube,
  twitter: FaTwitter,
  x: FaTwitter,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  tiktok: SiTiktok,
};


export default function BrandCampaignView({
  campaign,
  applications,
  page,
  onPageChange,
  onActionComplete,
}: {
  campaign: CampaignDetails;
  applications: CampaignApplicationDetails[];
  page: number;
  onPageChange: (page: number) => void;
  onActionComplete: () => Promise<void> | void;
}) {

const { id } = useParams();
const [selectedApp, setSelectedApp] = useState<CampaignApplicationDetails | null>(null);
const [open,setOpen] = useState(false);
const [actionLoading,setActionLoading] = useState(false);
const router = useRouter();


async function handleAction(
status:string,
applicationId:string
){

setActionLoading(true);

try{

const res = await fetch(
`/api/applications/${applicationId}/status`,
{
method:"PATCH",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
status
})
}
);

if (!res.ok) {
  const data = await res.json().catch(() => null);
  alert(data?.error || "Failed to update application");
  return;
}

const data = await res.json().catch(() => null);

setSelectedApp((prev) =>
  prev
    ? {
        ...prev,
        status:
          data?.status ?? (status as "PENDING" | "APPROVED" | "REJECTED"),
      }
    : prev
);

await onActionComplete();


} catch (err) {
  console.error("Failed to update application:", err);
  alert("Something went wrong");
}
finally{

setActionLoading(false);

}

}



return (
<>

<div className="h-[calc(100vh-120px)] grid lg:grid-cols-[1fr_380px] gap-6 overflow-hidden">








{/* LEFT CAMPAIGN PANEL */}

<div className="space-y-6 overflow-y-auto *:scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent  p-6  rounded-[24] ">

<CampaignHeader
  campaign={campaign}
  role="BRAND"
  onEdit={() => router.push(`/dashboard/campaigns/${id}/edit`)}
/>
    

<CampaignOverview
campaign={campaign}
/>



<CampaignAnalytics

role="BRAND"

applicantsCount={applications.length}

/>



<CampaignBudget

campaign={campaign}

/>

<PaymentBreakdown
  budget={campaign.budgetTotal}
  feeRate={campaign.platformFeeRate}
  fee={campaign.platformFee}
  total={campaign.totalCharge}
  paymentStatus={campaign.paymentStatus}
  showStatus
  title="Payment"
/>



</div>


{/* RIGHT APPLICATIONS */}

{/* RIGHT APPLICATIONS */}

<div
  className="border border-border overflow-hidden mt-6 lg:mt-0 bg-card/60 flex flex-col min-h-0"
  style={{ borderRadius: 24 }}
>
  <div className="flex justify-between items-center shrink-0">
    <h2 className="text-foreground font-semibold flex items-center gap-2 p-6">
      <Users size={16} />
      Applicants
    </h2>
  </div>

  {applications.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users size={32} className="text-muted-foreground mb-3" />

      <h3 className="text-foreground font-medium">
        No applications yet
      </h3>

      <p className="text-muted-foreground text-sm mt-1">
        Creators who apply to this campaign will appear here.
      </p>
    </div>
  ) : (
    <div className="overflow-y-auto flex-1 p-3 rounded-t-[24] *:scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent ">
      <table className="w-full text-sm table-fixed rounded-t-[10]">

        <thead className="bg-card text-muted-foreground text-xs sticky top-0 z-10 rounded-t-[10]">
          <tr>
            <th className="p-3 text-left w-[35%]">
              Creator
            </th>

            <th className="p-3 text-left w-[25%]">
              Status
            </th>

            <th className="p-3 text-left w-[20%]">
              Date
            </th>

            <th className="p-3 text-right w-[20%]">
              Action
            </th>
          </tr>
        </thead>


        <tbody>

          {applications.map((a) => (

            <tr
              key={a.id}
              onClick={() => {
                setSelectedApp(a);
                setOpen(true);
              }}
              className="
                border-t
                border-border
                cursor-pointer
                hover:bg-card/60
                transition
              "
            >

              <td className="p-3 text-foreground truncate">
                {a.creator?.username || "Unknown"}
              </td>


              <td className="p-3">

                <span
                  className={`
                    flex
                    items-center
                    gap-2
                    text-xs
                    ${
                      a.status === "APPROVED"
                        ? "text-green-400"
                        : a.status === "REJECTED"
                        ? "text-red-400"
                        : "text-amber-400"
                    }
                  `}
                >

                  <span
                    className={`
                      w-2
                      h-2
                      rounded-full
                      ${
                        a.status === "APPROVED"
                          ? "bg-green-400"
                          : a.status === "REJECTED"
                          ? "bg-red-400"
                          : "bg-amber-400"
                      }
                    `}
                  />

                 

                </span>

              </td>


              <td className="p-3 text-muted-foreground text-xs">
                {new Date(a.createdAt).toLocaleDateString()}
              </td>


              <td className="p-3 text-right">

                <div className="flex justify-end items-center gap-1 text-muted-foreground">
                  <span className="text-xs">
                    View
                  </span>

                  <ChevronRight size={14} />
                </div>

              </td>


            </tr>

          ))}

        </tbody>

      </table>
    </div>
  )}

</div>


</div>

      {/* REVIEW MODAL */}
      {open && selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">

          <div
            className="w-full max-w-2xl bg-popover border border-border p-6 space-y-5"
            style={{ borderRadius: 24 }}
          >


            {/* HEADER */}
            <div className="flex justify-between items-start">

              <div>

                <h2 className="text-foreground font-semibold text-lg">
                  Creator Application
                </h2>

                <p                 className="text-muted-foreground text-xs">
                  Review submission & take action
                </p>

              </div>


              <button
                onClick={()=>setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>

            </div>





            {/* CREATOR PROFILE */}
            <div
              className="bg-muted/60 border border-border p-4"
              style={{borderRadius:24}}
            >

              <div className="flex items-center gap-4">


                <div
                  className="
                  w-12
                  h-12
                  rounded-full
                  bg-muted
                  overflow-hidden
                  flex
                  items-center
                  justify-center
                  text-foreground
                  font-bold
                  "
                >

                  {
                    selectedApp?.creator?.displayName?.charAt(0)
                    ||
                    selectedApp?.creator?.username?.charAt(0)
                    ||
                    "C"
                  }

                </div>



                <div>

                  <p className="text-foreground font-medium">

                    {
                      selectedApp?.creator?.displayName
                      ||
                      selectedApp?.creator?.username
                      ||
                      "Creator"
                    }

                  </p>


                  <p                 className="text-muted-foreground text-xs">

                    @{selectedApp?.creator?.username}

                  </p>

                </div>



                <div className="ml-auto">


                  <span
                    className={`
                    px-3
                    py-1
                    text-xs
                    rounded-full
                    border

                    ${
                      selectedApp.status==="APPROVED"
                      ?
                      "bg-green-500/10 text-green-400 border-green-500/20"
                      :
                      selectedApp.status==="REJECTED"
                      ?
                      "bg-red-500/10 text-red-400 border-red-500/20"
                      :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }
                    `}
                  >

                    {selectedApp.status}

                  </span>


                </div>


              </div>





              {/* SOCIALS */}

              {
                selectedApp?.creator?.socialAccounts?.length > 0 && (

                  <div className="mt-4">


                    <p className="text-muted-foreground text-xs mb-2 uppercase tracking-wider">

                      Social Platforms

                    </p>



                    <div className="flex flex-wrap gap-3">


                      {
                        selectedApp.creator.socialAccounts.map(
                          (acc) => {

                            const Icon =
                            platformIcons[
                              acc.platform?.toLowerCase()
                            ]
                            ||
                            FaGlobe;


                            return (

                              <a
                                key={acc.id}
                                href={acc.url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                flex
                                items-center
                                gap-2
                                px-3
                                py-2
                                rounded-full
                                bg-card
                                border
                                border-border
                                text-muted-foreground
                                hover:text-foreground
                                "
                              >

                                <Icon/>

                                <span className="text-xs">
                                  @{acc.handle}
                                </span>


                              </a>

                            )

                          }
                        )
                      }


                    </div>


                  </div>

                )
              }



            </div>







            {/* MESSAGE */}

            {
              selectedApp?.message && (

                <div
                  className="
                  p-3
                  bg-card
                  border
                  border-border
                  rounded-xl
                  "
                >

                  <p className="text-muted-foreground text-xs mb-1">

                    Application Message

                  </p>


                  <p className="text-muted-foreground text-sm">

                    {selectedApp.message}

                  </p>


                </div>

              )
            }






            {/* SUBMISSION */}

            {
              selectedApp.submission && (

                <div
                  className="
                  bg-muted/40
                  border
                  border-border
                  rounded-xl
                  p-4
                  "
                >

                  <p className="text-foreground font-medium mb-2">

                    Submission

                  </p>


                  <div className="space-y-2 text-sm text-muted-foreground">


                    <p>

                      Screenshots:
                      {" "}
                      {
                        selectedApp.submission.screenshots?.length || 0
                      }

                    </p>


                    <p>

                      Links:
                      {" "}
                      {
                        selectedApp.submission.postLinks?.length || 0
                      }

                    </p>



                    {
                      selectedApp.submission.caption && (

                        <p className="text-muted-foreground">

                          &quot;{selectedApp.submission.caption}&quot;

                        </p>

                      )
                    }


                  </div>


                </div>

              )
            }





            {/* ACTIONS */}

            {
              selectedApp.status === "APPROVED" ||
              selectedApp.status === "REJECTED"
              ? (

                <div
                  className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  py-3
                  rounded-xl
                  border
                  text-sm
                  font-medium
                  ${
                    selectedApp.status === "APPROVED"
                    ?
                    "bg-green-500/10 text-green-400 border-green-500/20"
                    :
                    "bg-red-500/10 text-red-400 border-red-500/20"
                  }
                  `}
                >

                  {
                    selectedApp.status === "APPROVED"
                    ?
                    <Check size={16}/>
                    :
                    <X size={16}/>
                  }

                  Application
                  {" "}
                  {
                    selectedApp.status === "APPROVED"
                    ?
                    "Approved"
                    :
                    "Rejected"
                  }

                </div>

              )
              :
              (

            <div className="flex gap-3 pt-2">


              <button

                disabled={actionLoading}

                onClick={()=>handleAction(
                  "APPROVED",
                  selectedApp.id
                )}

                className="
                flex-1
                py-2
                rounded-xl
                bg-green-500
                text-white
                text-sm
                "

              >

                Approve

              </button>





              <button

                disabled={actionLoading}

                onClick={()=>handleAction(
                  "REJECTED",
                  selectedApp.id
                )}

                className="
                flex-1
                py-2
                rounded-xl
                bg-red-500
                text-white
                text-sm
                "

              >

                Reject

              </button>





              


            </div>

              )
            }


          </div>


        </div>
      )}

    </>
  );
}