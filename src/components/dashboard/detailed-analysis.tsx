import { Check, Lightbulb, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { ExpandableCard } from "@/components/dashboard/expandable-card";
import { ScoreBadge } from "@/components/dashboard/score-badge";
import { ScoreBar } from "@/components/dashboard/score-bar";
import { Reveal } from "@/components/motion/reveal";
import type { CategoryDetail } from "@/lib/dashboard/types";

/** Section 4 — one expandable card per category. */
export function DetailedAnalysis({ categories }: { categories: CategoryDetail[] }) {
  return (
    <div className="space-y-3">
      {categories.map((category, index) => (
        <Reveal key={category.id} delay={index * 80}>
          <ExpandableCard
            defaultOpen={index === 0}
            toggleLabel={`Toggle ${category.label} details`}
            header={
              <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <span className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold text-foreground tabular-nums">
                    {category.score}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{category.label}</span>
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <ScoreBar score={category.score} active className="max-w-48 flex-1" />
                  <ScoreBadge score={category.score} />
                </span>
              </span>
            }
          >
            <div className="grid gap-6 border-t border-border pt-5 md:grid-cols-3">
              <DetailList
                title="Strengths"
                items={category.strengths}
                icon={<Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />}
                emptyLabel="Nothing standing out here yet."
              />
              <DetailList
                title="Weaknesses"
                items={category.weaknesses}
                icon={
                  <Minus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                }
                emptyLabel="No issues found in this area."
              />
              <DetailList
                title="Suggestions"
                items={category.suggestions}
                icon={<Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />}
                emptyLabel="Keep doing what you're doing."
              />
            </div>
          </ExpandableCard>
        </Reveal>
      ))}
    </div>
  );
}

function DetailList({
  title,
  items,
  icon,
  emptyLabel,
}: {
  title: string;
  items: string[];
  icon: ReactNode;
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {title}
      </p>
      {items.length ? (
        <ul className="mt-3 space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
              {icon}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}
