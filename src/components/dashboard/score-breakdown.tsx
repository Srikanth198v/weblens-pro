import { Reveal } from "@/components/motion/reveal";
import { ScoreBar } from "@/components/dashboard/score-bar";
import { useInView } from "@/hooks/use-in-view";
import { OVERALL_SCORE_METHOD } from "@/lib/dashboard/weights";
import type { DashboardReport } from "@/lib/dashboard/types";

/**
 * Score Breakdown — makes the overall number auditable.
 * Every row shows the area score, its published weight and the points it
 * contributes, so the total can be checked by hand.
 */
export function ScoreBreakdown({ report }: { report: DashboardReport }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
      <p className="text-sm leading-relaxed text-muted-foreground">{OVERALL_SCORE_METHOD}</p>

      <ul className="mt-5 space-y-3">
        {report.breakdown.map((item, index) => (
          <Reveal key={item.id} delay={index * 70}>
            <li className="rounded-2xl bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="font-display text-lg font-bold tabular-nums text-foreground">
                  {item.score}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">/100</span>
                </p>
              </div>

              <ScoreBar score={item.score} active={inView} delay={index * 70} className="mt-2.5" />

              <p className="mt-2.5 text-xs font-medium text-muted-foreground">
                Weight {item.weight}% · contributes {item.contribution} of {item.weight} points
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.explanation}
              </p>
            </li>
          </Reveal>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 rounded-2xl border border-border bg-background p-4">
        <p className="text-sm font-semibold text-foreground">
          Total — weighted average of the five areas
        </p>
        <p className="font-display text-xl font-extrabold tabular-nums text-foreground">
          {report.overallScore}
          <span className="ml-1 text-sm font-medium text-muted-foreground">/100</span>
        </p>
      </div>
    </div>
  );
}
