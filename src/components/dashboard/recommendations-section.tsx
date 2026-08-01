import {
  Accessibility,
  Briefcase,
  Gauge,
  LayoutDashboard,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { ExpandableCard } from "@/components/dashboard/expandable-card";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { Recommendation, RecommendationPriority } from "@/lib/dashboard/types";

const ICONS: Record<Recommendation["icon"], LucideIcon> = {
  layout: LayoutDashboard,
  gauge: Gauge,
  search: Search,
  accessibility: Accessibility,
  briefcase: Briefcase,
  sparkles: Sparkles,
};

const GROUPS: Array<{ priority: RecommendationPriority; title: string; hint: string }> = [
  { priority: "high", title: "High Priority", hint: "Start here for the biggest change." },
  { priority: "medium", title: "Medium Priority", hint: "Plan these into the next round." },
  { priority: "low", title: "Low Priority", hint: "Polish once the essentials are done." },
];

const PRIORITY_DOT: Record<RecommendationPriority, string> = {
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted-foreground/50",
};

/** Section 7 — grouped, expandable action list. */
export function RecommendationsSection({ items }: { items: Recommendation[] }) {
  return (
    <div className="space-y-8">
      {GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.priority === group.priority);
        if (!groupItems.length) return null;

        return (
          <div key={group.priority}>
            <Reveal>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full", PRIORITY_DOT[group.priority])}
                />
                <h3 className="text-base font-bold text-foreground">{group.title}</h3>
                <span className="text-xs text-muted-foreground">{group.hint}</span>
              </div>
            </Reveal>

            <div className="mt-4 space-y-3">
              {groupItems.map((item, index) => (
                <Reveal key={item.id} delay={index * 80}>
                  <RecommendationCard item={item} />
                </Reveal>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecommendationCard({ item }: { item: Recommendation }) {
  const Icon = ICONS[item.icon];

  return (
    <ExpandableCard
      toggleLabel={`Toggle details for ${item.title}`}
      header={
        <span className="flex items-center gap-3.5">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground sm:text-base">
              {item.title}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Impact {item.impact} · {item.difficulty} · {item.estimatedTime}
            </span>
          </span>
        </span>
      }
    >
      <div className="border-t border-border pt-5">
        <p className="text-sm leading-relaxed text-foreground/85">{item.description}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Fact label="Estimated impact" value={item.impact} />
          <Fact label="Estimated difficulty" value={item.difficulty} />
          <Fact label="Estimated time" value={item.estimatedTime} />
        </dl>
      </div>
    </ExpandableCard>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-3.5">
      <dt className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
