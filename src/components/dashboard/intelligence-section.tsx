import { ArrowUpRight, Check, Sparkles, Trophy, Zap } from "lucide-react";

import { ExpandableCard } from "@/components/dashboard/expandable-card";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type {
  ConsultantRecommendation,
  IntelligenceHighlight,
  IntelligencePriority,
  IntelligenceReport,
} from "@/lib/intelligence/types";

const HIGHLIGHT_ICON = {
  "top-opportunity": ArrowUpRight,
  "quick-win": Zap,
  "greatest-strength": Trophy,
} as const;

const PRIORITY_LABEL: Record<IntelligencePriority, string> = {
  critical: "Do this first",
  important: "Worth planning",
  helpful: "Nice to have",
};

const PRIORITY_CLASS: Record<IntelligencePriority, string> = {
  critical: "bg-warning/15 text-warning-foreground dark:text-warning",
  important: "bg-primary-soft text-accent-foreground",
  helpful: "bg-secondary text-secondary-foreground",
};

/**
 * Section 6 — the signature consultant view.
 * Renders whatever an IntelligenceProvider returns, so a future AI engine
 * needs no UI changes.
 */
export function IntelligenceSection({ intelligence }: { intelligence: IntelligenceReport }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {intelligence.highlights.map((highlight, index) => (
          <Reveal key={highlight.kind} delay={index * 120}>
            <HighlightCard highlight={highlight} />
          </Reveal>
        ))}
      </div>

      <Reveal>
        <p className="flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary-soft/60 p-4 text-sm leading-relaxed text-accent-foreground">
          <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {intelligence.celebration}
        </p>
      </Reveal>

      <div className="space-y-3">
        {intelligence.recommendations.map((recommendation, index) => (
          <Reveal key={recommendation.id} delay={index * 80}>
            <ConsultantCard recommendation={recommendation} open={index === 0} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function HighlightCard({ highlight }: { highlight: IntelligenceHighlight }) {
  const Icon = HIGHLIGHT_ICON[highlight.kind];
  const isStrength = highlight.kind === "greatest-strength";

  return (
    <div
      className={cn(
        "card-hover h-full rounded-2xl border p-5 shadow-soft",
        isStrength ? "border-primary/30 bg-primary-soft/50" : "border-border bg-card",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
            isStrength ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground",
          )}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <p className="min-w-0 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {highlight.title}
        </p>
      </div>
      <p className="mt-4 font-display text-lg leading-snug font-bold text-foreground">
        {highlight.subject}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{highlight.detail}</p>
    </div>
  );
}

function ConsultantCard({
  recommendation,
  open,
}: {
  recommendation: ConsultantRecommendation;
  open: boolean;
}) {
  return (
    <ExpandableCard
      defaultOpen={open}
      toggleLabel={`Toggle guidance for ${recommendation.title}`}
      header={
        <span className="flex flex-col gap-2">
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                PRIORITY_CLASS[recommendation.priority],
              )}
            >
              {PRIORITY_LABEL[recommendation.priority]}
            </span>
            <span className="text-xs text-muted-foreground">
              {recommendation.difficulty} · {recommendation.estimatedTime}
            </span>
          </span>
          <span className="text-sm font-semibold text-foreground sm:text-base">
            {recommendation.title}
          </span>
        </span>
      }
    >
      <div className="space-y-5 border-t border-border pt-5">
        <Facts recommendation={recommendation} />

        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Why this matters
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            {recommendation.whyThisMatters}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Recommended action
          </p>
          <ul className="mt-2 space-y-2">
            {recommendation.recommendedAction.map((step) => (
              <li key={step} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>
              Confidence ·{" "}
              <span className="font-semibold text-foreground">
                {recommendation.confidence >= 80
                  ? "High"
                  : recommendation.confidence >= 60
                    ? "Moderate"
                    : "Early signal"}
              </span>
            </span>
            <span className="tabular-nums">{recommendation.confidence}%</span>
          </div>
          <div
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
            role="img"
            aria-label={`Confidence ${recommendation.confidence} out of 100`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
              style={{ width: `${recommendation.confidence}%` }}
            />
          </div>
        </div>
      </div>
    </ExpandableCard>
  );
}

function Facts({ recommendation }: { recommendation: ConsultantRecommendation }) {
  const facts = [
    { label: "Business impact", value: recommendation.businessImpact },
    { label: "Difficulty", value: recommendation.difficulty },
    { label: "Estimated time", value: recommendation.estimatedTime },
  ];

  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {facts.map((fact) => (
        <div key={fact.label} className="rounded-xl bg-surface p-3.5">
          <dt className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            {fact.label}
          </dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-foreground/85">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
