import { ShieldCheck, Layers } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { ScoreBar } from "@/components/dashboard/score-bar";
import { useInView } from "@/hooks/use-in-view";
import type { EvidenceReport } from "@/lib/dashboard/evidence-report";

/**
 * AI Confidence — how much of the picture we were able to read.
 * Deliberately separate from the website score: this measures the analysis,
 * not the site.
 */
export function AiConfidenceCard({ evidenceReport }: { evidenceReport: EvidenceReport }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className="grid gap-4 md:grid-cols-2">
      <Reveal>
        <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              AI confidence
            </p>
          </div>

          <p className="mt-5 font-display text-4xl font-extrabold tabular-nums text-foreground">
            {evidenceReport.confidence}
            <span className="ml-1 text-lg font-semibold text-muted-foreground">%</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-primary">
            {evidenceReport.confidenceLevel} confidence
          </p>

          <ScoreBar score={evidenceReport.confidence} active={inView} className="mt-4" />

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {evidenceReport.confidenceNote}
          </p>
        </div>
      </Reveal>

      <Reveal delay={90}>
        <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Layers aria-hidden="true" className="size-5" />
            </span>
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Evidence quality
            </p>
          </div>

          <p className="mt-5 font-display text-4xl font-extrabold text-foreground">
            {evidenceReport.quality}
          </p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground tabular-nums">
            {evidenceReport.collectedCount} of {evidenceReport.totalCount} sources collected
          </p>

          <ScoreBar
            score={
              evidenceReport.totalCount
                ? Math.round((evidenceReport.collectedCount / evidenceReport.totalCount) * 100)
                : 0
            }
            active={inView}
            delay={90}
            className="mt-4"
          />

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {evidenceReport.qualityNote} This describes the analysis itself, not the website score.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
