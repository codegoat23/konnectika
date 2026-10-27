"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaInstagram,
  FaYoutube,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaGlobe,
} from "react-icons/fa";

import { SiTiktok } from "react-icons/si";
import Logo from "@/public/assets/logo-plain.svg"
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import type { IconType } from "react-icons";

type ApplyCampaign = Prisma.CampaignGetPayload<{
  include: { businessProfile: true };
}>;

type ApplyCreator = Prisma.CreatorProfileGetPayload<{
  include: { socialAccounts: true; user: true };
}>;

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();

  const [campaign, setCampaign] = useState<ApplyCampaign | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState<ApplyCreator | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [fetchingCampaign, setFetchingCampaign] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const campaignId = params?.id as string;

  // 🔐 LOAD CREATOR PROFILE
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/creator/me", {
          credentials: "include",
        });

        const data = await res.json();
        console.log("CREATOR RESPONSE:", data);

        if (!res.ok) {
          // Not authenticated -> login
          window.location.assign("https://krietas.com/login");
          return;
        }

        if (!data.creator) {
          // Authenticated but not a creator (e.g. brand/admin) -> no loop
          router.push("/403");
          return;
        }

        setUser(data.creator);
        setCheckingAuth(false);
      } catch {
        window.location.assign("https://krietas.com/login");
      }
    };

    loadUser();
  }, [campaignId, router]);

  // 📦 FETCH CAMPAIGN
  useEffect(() => {
    if (checkingAuth) return;

    const fetchCampaign = async () => {
      try {
        setFetchingCampaign(true);
        setError(null);

        const res = await fetch(`/api/campaign/${campaignId}`);

        if (!res.ok) {
          setError("Campaign not found");
          setCampaign(null);
          return;
        }

        const data = await res.json();
        setCampaign(data);
      } catch {
        setError("Failed to load campaign");
        setCampaign(null);
      } finally {
        setFetchingCampaign(false);
      }
    };

    fetchCampaign();
  }, [campaignId, checkingAuth]);

  // 📤 SUBMIT APPLICATION
  const submitApplication = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to submit application");
        return;
      }

      router.push("/dashboard/campaigns");
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ⏳ LOADING
  if (checkingAuth || fetchingCampaign) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-10 w-24 rounded-xl bg-muted animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 w-28 rounded-full bg-muted animate-pulse" />
              <div className="h-10 w-28 rounded-full bg-muted animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div
              className="space-y-4 rounded-[24px] border border-border bg-card p-6"
            >
              <div className="h-56 w-full rounded-2xl bg-muted animate-pulse" />
              <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
            </div>

            <div
              className="space-y-4 rounded-[24px] border border-border bg-card p-6"
            >
              <div className="h-6 w-1/2 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-10 w-40 rounded-xl bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ❌ ERROR
  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-background p-6 text-destructive">
        {error || "Campaign not available"}
      </div>
    );
  }

  const platformIcons: Record<string, IconType> = {
  instagram: FaInstagram,
  youtube: FaYoutube,
  twitter: FaTwitter,
  x: FaTwitter,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  tiktok: SiTiktok,
};

  return (
    <div className="min-h-screen bg-background p-6">

      {/* NAV */}
     <div className="w-full flex items-center justify-between max-w-6xl mx-auto mb-6">
  {/* LEFT: Brand */}
          <div className=" flex   py-1">
      <Image
        src={Logo}
        alt="Konnectika"
        
        priority
        className="h-auto w-full max-w-[50px]"
      />
    </div>

  {/* RIGHT: Buttons */}
  <div className="flex gap-3">
    <button
      onClick={() => router.push("/discover")}
      className="px-4 py-2 bg-card border border-border text-muted-foreground rounded-full hover:text-foreground"
    >
      ← Discover
    </button>

    <button
      onClick={() => router.push("/dashboard")}
      className="px-4 py-2 bg-foreground text-background rounded-full hover:bg-foreground/90"
    >
      Dashboard
    </button>
  </div>
</div>

      {/* GRID */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-screen">

        {/* LEFT */}
        <div className="bg-card border border-border flex flex-col overflow-hidden rounded-[24px]">

          <div
            className="h-56 bg-cover bg-center shrink-0"
            style={{ backgroundImage: `url(${campaign.thumbnailPic})` }}
          />

          <div className="p-6 overflow-y-auto flex-1 scrollbar-custom">

            <h1 className="text-3xl font-bold text-foreground">
              {campaign.name}
            </h1>

            <p className="text-muted-foreground mt-3">
              {campaign.description}
            </p>

            <div className="mt-6 border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {([
                    ["Category", campaign.category ?? "—"],
                    ["Budget", `TZS ${campaign.budgetTotal}`],
                    ["Payment", `TZS ${campaign.paymentRate}`],
                    ["Type", campaign.campaignType],
                    ["Duration", campaign.duration ?? "—"],
                    [
                      "Deadline",
                      campaign.applicationsClose
                        ? new Date(campaign.applicationsClose).toLocaleDateString()
                        : "—",
                    ],
                  ] as [string, string][]).map(([label, value]) => (
                    <tr key={label} className="border-b border-border">
                      <td className="px-4 py-3 text-muted-foreground">
                        {label}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h3 className="text-foreground font-semibold mb-3">
                Requirements
              </h3>

              <ul className="space-y-3">
                {campaign.requirements?.map((r: string, i: number) => (
                  <li key={i} className="flex gap-3 text-muted-foreground text-sm">
                    <span className="text-orange-400">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* RIGHT */}
        <div className="bg-card border border-border flex flex-col p-6 rounded-[24px]">

          
         {/* CREATOR PROFILE */}
<div className="bg-muted/60 border border-border rounded-xl p-4" style={{borderRadius: "24px"}}>

  {/* Top identity row */}
  <div className="flex items-center gap-4">

    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-bold overflow-hidden">
      {user?.displayName?.charAt(0) ||
        user?.username?.charAt(0) ||
        "C"}
    </div>

    <div>
      <p className="text-foreground font-medium">
        {user?.displayName || user?.username || "Creator"}
      </p>

      <p className="text-muted-foreground text-xs">
        {user?.user?.email}
      </p>
    </div>

    <div className="ml-auto">
      <span className="px-3 py-1 text-xs rounded-full bg-success/15 text-success border border-success/25">
        Active
      </span>
    </div>
  </div>

  
  {/* 🌐 SOCIAL PLATFORMS */}
  {(() => {
    const socialAccounts = user?.socialAccounts ?? [];
    if (socialAccounts.length === 0) return null;

    return (
      <div className="mt-4">
        <p className="text-muted-foreground text-xs mb-2 uppercase tracking-wider">
          Social Platforms
        </p>

        <div className="flex flex-wrap gap-3">
          {socialAccounts.map((acc) => {
            const Icon = platformIcons[acc.platform?.toLowerCase()] || FaGlobe;

            return (
              <a
                key={acc.id}
                href={acc.url || "#"}
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-border transition"
              >
                <Icon className="text-base" />
                <span className="text-xs">@{acc.handle}</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  })()}
</div>

          {/* TEXTAREA */}
          <div className="flex-1 flex flex-col mt-6">
            <textarea
              className="w-full flex-1 min-h-[350px] p-4 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              style={{ borderRadius: "24px" }}
              placeholder="Tell the brand who you are, your audience, and why you're the perfect fit..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* SUBMIT */}
          <div className="mt-6">
            <button
              onClick={submitApplication}
              disabled={loading}
              className="w-full bg-foreground text-background py-3 rounded-full font-medium hover:bg-foreground/90 transition disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
