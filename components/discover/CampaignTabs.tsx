import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CampaignDetail } from "@/lib/campaign-detail";
import { CampaignAnalytics } from "./CampaignAnalytics";
import { CampaignEarnings } from "./CampaignEarnings";
import { CampaignLeaderboard } from "./CampaignLeaderboard";
import { CampaignRequirements } from "./CampaignRequirements";
import { CampaignResources } from "./CampaignResources";

interface CampaignTabsProps {
  campaign: CampaignDetail;
}

export function CampaignTabs({ campaign }: CampaignTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview">
        <div className="mt-8 space-y-12">
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            {campaign.description}
          </p>

          <CampaignRequirements requirements={campaign.requirements} />
          <CampaignEarnings earnings={campaign.earnings} />
          <CampaignResources resources={campaign.resources} />
        </div>
      </TabsContent>

      <TabsContent value="leaderboard">
        <CampaignLeaderboard />
      </TabsContent>

      <TabsContent value="analytics">
        <CampaignAnalytics />
      </TabsContent>
    </Tabs>
  );
}
