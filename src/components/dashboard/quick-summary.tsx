import { Reveal } from "@/components/motion/reveal";
import { ScoreBadge } from "@/components/dashboard/score-badge";
import { ScoreBar } from "@/components/dashboard/score-bar";
import { useCountUp } from "@/hooks/use-count-up";
import { useInView } from "@/hooks/use-in-view";
import type { CategoryDetail } from "@/lib/dashboard/types";

const SUMMARY_IDS = ["design", "performance", "seo", "accessibility"] as const;

/** Section 3 — four at-a-glance cards that animate in sequence. */
export function QuickSummary({ categories }: { categories: CategoryDetail[] }) {
  const cards = SUMMARY_IDS.map((id) => categories.find((category) => category.id === id)).filter(
    (category): category is CategoryDetail => Boolean(category),
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((category, index) => (
        <Reveal key={category.id} delay={index * 120}>
          <SummaryCard category={category} delay={index * 120} />
        </Reveal>
      ))}
    </div>
  );
}

function SummaryCard({ category, delay }: { category: CategoryDetail; delay: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const value = useCountUp(category.score, { active: inView, duration: 900 });

  return (
    <div
      ref={ref}
      className="h-full rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow duration-200 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{category.label}</p>
        <ScoreBadge score={category.score} />
      </div>

      <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
        {value}
        <span className="ml-1 text-sm font-medium text-muted-foreground">/100</span>
      </p>

      <ScoreBar score={category.score} active={inView} delay={delay} className="mt-3" />

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{category.summary}</p>
    </div>
  );
}
