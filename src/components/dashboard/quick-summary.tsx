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
        <SummaryCard key={category.id} category={category} index={index} />
      ))}
    </div>
  );
}

function SummaryCard({ category, index }: { category: CategoryDetail; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const delay = index * 120;
  const value = useCountUp(category.score, { active: inView, duration: 900 });

  return (
    <div
      ref={ref}
      className="motion-reveal rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow duration-200 hover:shadow-card data-[visible=true]:opacity-100"
      data-visible={inView}
      style={{ transitionDelay: `${delay}ms`, ...(inView ? { opacity: 1, transform: "none" } : {}) }}
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
