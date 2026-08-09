import { ArrowRight, ExternalLink } from "lucide-react";

import type { CampaignResource } from "@/lib/campaign-detail";

interface CampaignResourcesProps {
  resources: CampaignResource[];
}

export function CampaignResources({ resources }: CampaignResourcesProps) {
  if (resources.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Resources</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {resources.map((resource) => (
          <a
            key={resource.url}
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                <ExternalLink className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {resource.label}
                </p>
                <p className="text-xs text-muted-foreground">Open resource</p>
              </div>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </div>
    </section>
  );
}
