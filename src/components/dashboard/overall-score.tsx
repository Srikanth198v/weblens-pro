import { ScoreBadge } from "@/components/dashboard/score-badge";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { STATUS_LABEL, statusForScore } from "@/lib/dashboard/scoring";
import type { DashboardReport } from "@/lib/dashboard/types";

const NARRATIVE: Record<string, string> = {
  excellent: "This site is in strong shape. The work ahead is refinement, not repair.",
  good: "Solid foundations are already in place, with a handful of clear improvements available.",
  "needs-improvement":
    "There is real headroom here. A short list of focused changes will move this score quickly.",
};

/** Section 2 — the headline number. */
export function OverallScore({ report }: { report: DashboardReport }) {
  const status = statusForScore(report.overallScore);

  return (
    <div className="grid items-center gap-8 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8 lg:grid-cols-[auto_1fr] lg:gap-12">
      <div className="flex justify-center">
        <ScoreRing score={report.overallScore} label="Overall score" size={200} />
      </div>

      <div className="text-center lg:text-left">
        <div className="flex items-center justify-center gap-3 lg:justify-start">
          <p className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Overall Score
          </p>
          <ScoreBadge score={report.overallScore} />
        </div>
        <p className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {STATUS_LABEL[status]}
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base lg:mx-0">
          {NARRATIVE[status]}
        </p>
      </div>
    </div>
  );
}
