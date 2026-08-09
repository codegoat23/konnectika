import { BadgeCheck } from "lucide-react";

interface CampaignRequirementsProps {
  requirements: string[];
}

export function CampaignRequirements({ requirements }: CampaignRequirementsProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Requirements</h2>
      {requirements.length > 0 ? (
        <ul className="space-y-2.5">
          {requirements.map((requirement) => (
            <li
              key={requirement}
              className="flex items-start gap-3 text-sm text-muted-foreground"
            >
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              {requirement}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No specific requirements have been listed for this campaign yet.
        </p>
      )}
    </section>
  );
}
