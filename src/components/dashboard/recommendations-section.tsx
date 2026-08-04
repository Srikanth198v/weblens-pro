import {
  Accessibility,
  Briefcase,
  Check,
  ChevronDown,
  Gauge,
  LayoutDashboard,
  Search,
  Sparkles,
  X,
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
          <span className="ml-auto hidden shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground tabular-nums sm:inline-block">
            +{item.estimatedGain} est.
          </span>
        </span>
      }
    >
      <div className="border-t border-border pt-5">
        <p className="text-sm leading-relaxed text-foreground/85">{item.description}</p>

        <Block label="What we detected">
          <ul className="space-y-1.5">
            {item.evidence.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-foreground/85">
                · {line}
              </li>
            ))}
          </ul>
        </Block>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Block label="Why it matters" flush>
            <p className="text-sm leading-relaxed text-foreground/85">{item.whyItMatters}</p>
          </Block>
          <Block label="Business impact" flush>
            <p className="text-sm leading-relaxed text-foreground/85">{item.businessImpact}</p>
          </Block>
        </div>

        <Block label="How to fix it">
          <ol className="space-y-1.5">
            {item.howToFix.map((step, index) => (
              <li key={step} className="text-sm leading-relaxed text-foreground/85">
                {index + 1}. {step}
              </li>
            ))}
          </ol>
        </Block>

        <BeforeAfter item={item} />

        <dl className="mt-4 grid gap-3 sm:grid-cols-4">
          <Fact label="Estimated impact" value={item.impact} />
          <Fact label="Estimated difficulty" value={item.difficulty} />
          <Fact label="Estimated time" value={item.estimatedTime} />
          <Fact label="Estimated score gain" value={`+${item.estimatedGain} points`} />
        </dl>
      </div>
    </ExpandableCard>
  );
}

/** Collapsible before vs after, both sides grounded in the same measurement. */
function BeforeAfter({ item }: { item: Recommendation }) {
  return (
    <details className="group mt-3 rounded-xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        Before vs after
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="space-y-3 border-t border-border px-4 py-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Current state
          </p>
          <p className="mt-1 flex gap-2 text-sm leading-relaxed text-foreground/85">
            <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>{item.currentState}</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Recommended
          </p>
          <p className="mt-1 flex gap-2 text-sm leading-relaxed text-foreground/85">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{item.recommendedState}</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Expected result
          </p>
          <ul className="mt-1 space-y-1">
            {item.expectedResults.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-foreground/85">
                · {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

function Block({
  label,
  children,
  flush,
}: {
  label: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <div className={cn("rounded-xl bg-surface p-4", flush ? "h-full" : "mt-4")}>
      <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
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
