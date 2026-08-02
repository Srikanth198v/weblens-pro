import { ScoreBar } from "@/components/dashboard/score-bar";
import { Reveal } from "@/components/motion/reveal";
import { useInView } from "@/hooks/use-in-view";
import { STATUS_LABEL, STATUS_TEXT_CLASS, statusForScore } from "@/lib/dashboard/scoring";
import type { BusinessMetric } from "@/lib/dashboard/types";

/** Section 5 — the business-level read of the site. */
export function BusinessReview({ metrics }: { metrics: BusinessMetric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric, index) => (
        <Reveal key={metric.id} delay={(index % 3) * 100}>
          <MetricCard metric={metric} delay={(index % 3) * 100} />
        </Reveal>
      ))}
    </div>
  );
}

function MetricCard({ metric, delay }: { metric: BusinessMetric; delay: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const status = statusForScore(metric.score);

  return (
    <div
      ref={ref}
      className="card-hover h-full rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{metric.label}</p>
        <p className="font-display text-lg font-bold tabular-nums text-foreground">
          {metric.score}
        </p>
      </div>

      <ScoreBar score={metric.score} active={inView} delay={delay} className="mt-3" />

      <p className={`mt-3 text-xs font-semibold ${STATUS_TEXT_CLASS[status]}`}>
        {STATUS_LABEL[status]}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{metric.explanation}</p>
    </div>
  );
}
