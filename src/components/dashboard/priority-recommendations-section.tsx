import {
  Accessibility,
  Briefcase,
  Gauge,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type {
  ExpectedImpact,
  PriorityEffort,
  PriorityRecommendation,
  PriorityRecommendationsView,
} from "@/lib/dashboard/priority-recommendations";
import type { CategoryId, RecommendationPriority } from "@/lib/dashboard/types";

const CATEGORY_ICON: Record<CategoryId, LucideIcon> = {
  seo: Search,
  performance: Gauge,
  accessibility: Accessibility,
  design: LayoutDashboard,
  business: Briefcase,
};

const CATEGORY_LABEL: Record<CategoryId, string> = {
  seo: "SEO",
  performance: "Performance",
  accessibility: "Accessibility",
  design: "UX",
  business: "Business",
};

const PRIORITY_STYLE: Record<RecommendationPriority, string> = {
  high: "border-destructive/30 bg-destructive/10 text-destructive",
  medium: "border-warning/40 bg-warning/15 text-warning-foreground",
  low: "border-border bg-secondary text-muted-foreground",
};

const PRIORITY_LABEL: Record<RecommendationPriority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

const PRIORITY_ACCENT: Record<RecommendationPriority, string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-muted-foreground/40",
};

const EFFORT_STYLE: Record<PriorityEffort, string> = {
  Easy: "border-primary/30 bg-primary-soft text-accent-foreground",
  Moderate: "border-warning/40 bg-warning/15 text-warning-foreground",
  Hard: "border-border bg-secondary text-foreground/80",
};

const IMPACT_ICON: Record<ExpectedImpact["icon"], LucideIcon> = {
  search: Search,
  gauge: Gauge,
  shield: ShieldCheck,
  smartphone: Smartphone,
  accessibility: Accessibility,
};

/** Section — the three to five actions worth doing next, ranked by business impact. */
export function PriorityRecommendationsSection({ view }: { view: PriorityRecommendationsView }) {
  if (!view.items.length) {
    return (
      <div className="space-y-6">
        <DetectedCategoryCard view={view} />
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <p className="text-sm leading-relaxed text-muted-foreground">{view.emptyReason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <DetectedCategoryCard view={view} />
      </Reveal>

      {view.doThisFirst ? (
        <Reveal>
          <DoThisFirstCard item={view.doThisFirst} />
        </Reveal>
      ) : null}

      <div className="space-y-3">
        {view.items.map((item, index) => (
          <Reveal key={item.id} delay={index * 70}>
            <PriorityCard item={item} rank={index + 1} />
          </Reveal>
        ))}
      </div>

      {view.expectedImpact.length ? (
        <Reveal>
          <ExpectedImpactCard items={view.expectedImpact} />
        </Reveal>
      ) : null}
    </div>
  );
}

/** Shows what kind of website was detected, how sure we are, and from which signals. */
function DetectedCategoryCard({ view }: { view: PriorityRecommendationsView }) {
  const { classification, focus } = view;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground/70">
          <Building2 aria-hidden="true" className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Detected category
          </p>
          <h3 className="text-base font-bold text-foreground sm:text-lg">{classification.label}</h3>
        </div>
        <Badge className="ml-auto border-primary/30 bg-primary-soft text-accent-foreground">
          Confidence {classification.confidence}%
        </Badge>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${classification.confidence}%` }}
        />
      </div>

      {classification.signals.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Signals observed during this analysis
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {classification.signals.map((signal) => (
              <li
                key={signal}
                className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-foreground/80"
              >
                {signal}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {classification.note ? `${classification.note} ` : ""}
        {focus}
      </p>
    </div>
  );
}


function DoThisFirstCard({ item }: { item: PriorityRecommendation }) {
  const Icon = CATEGORY_ICON[item.category];

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary-soft p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden="true" className="size-4 text-primary" />
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          Do this first
        </p>
      </div>

      <div className="mt-3 flex items-start gap-3.5">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground sm:text-lg">{item.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-foreground/85">{item.whyItMatters}</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/85">
        Highest expected gain for the effort involved — {item.effort.toLowerCase()} to action, around{" "}
        {item.estimatedTime.toLowerCase()}.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className={PRIORITY_STYLE[item.priority]}>{PRIORITY_LABEL[item.priority]}</Badge>
        <Badge className={EFFORT_STYLE[item.effort]}>
          <Wrench aria-hidden="true" className="size-3.5" />
          {item.effort}
        </Badge>
        <Badge className="border-border bg-card text-foreground/80">
          <Timer aria-hidden="true" className="size-3.5" />
          {item.estimatedTime}
        </Badge>
      </div>
    </div>
  );
}

function PriorityCard({ item, rank }: { item: PriorityRecommendation; rank: number }) {
  const Icon = CATEGORY_ICON[item.category];

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow duration-200 hover:shadow-elevated sm:p-6">
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", PRIORITY_ACCENT[item.priority])}
      />

      <div className="flex flex-wrap items-start gap-3.5 pl-2">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            {rank.toString().padStart(2, "0")} · {CATEGORY_LABEL[item.category]}
          </p>
          <h3 className="mt-1 text-sm font-bold text-foreground sm:text-base">{item.title}</h3>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Badge className={PRIORITY_STYLE[item.priority]}>{PRIORITY_LABEL[item.priority]}</Badge>
          <Badge className={EFFORT_STYLE[item.effort]}>
            <Wrench aria-hidden="true" className="size-3.5" />
            {item.effort}
          </Badge>
          <Badge className="border-border bg-surface text-foreground/80">
            <Timer aria-hidden="true" className="size-3.5" />
            {item.estimatedTime}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 pl-2 sm:grid-cols-2">
        <Block label="Evidence">
          <ul className="space-y-1.5">
            {item.evidence.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-foreground/85">
                · {line}
              </li>
            ))}
          </ul>
        </Block>
        <Block label="Why it matters">
          <p className="text-sm leading-relaxed text-foreground/85">{item.whyItMatters}</p>
        </Block>
      </div>

      <div className="mt-3 pl-2">
        <Block label="Suggested fix">
          <ol className="space-y-1.5">
            {item.suggestedFix.map((step, index) => (
              <li key={step} className="text-sm leading-relaxed text-foreground/85">
                {index + 1}. {step}
              </li>
            ))}
          </ol>
        </Block>
      </div>
    </article>
  );
}

function ExpectedImpactCard({ items }: { items: ExpectedImpact[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      <h3 className="text-base font-bold text-foreground">Expected impact</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        What acting on these could improve, based on the areas the evidence points to.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = IMPACT_ICON[item.icon];
          return (
            <li key={item.label} className="flex gap-3 rounded-xl bg-surface p-4">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-primary">
                <Icon aria-hidden="true" className="size-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{item.label}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="h-full rounded-xl bg-surface p-4">
      <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
