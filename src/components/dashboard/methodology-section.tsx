import { Info, Route } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import type { EvidenceReport } from "@/lib/dashboard/evidence-report";

/** How this report was generated, plus an honest list of what was out of reach. */
export function MethodologySection({ evidenceReport }: { evidenceReport: EvidenceReport }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Reveal>
        <div className="h-full rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Route aria-hidden="true" className="size-5" />
            </span>
            <h3 className="text-base font-bold text-foreground">How this report was generated</h3>
          </div>

          <ol className="mt-5 space-y-3">
            {evidenceReport.methodology.map((step, index) => (
              <li key={step.title} className="rounded-2xl bg-surface p-4">
                <p className="text-sm font-semibold text-foreground">
                  <span className="mr-2 tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      <Reveal delay={90}>
        <div className="h-full rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Info aria-hidden="true" className="size-5" />
            </span>
            <h3 className="text-base font-bold text-foreground">Not analysed</h3>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Findings are based only on publicly accessible information collected during this
            analysis. The following were outside its reach.
          </p>

          <ul className="mt-4 space-y-3">
            {evidenceReport.limitations.map((item) => (
              <li key={item.title} className="rounded-2xl bg-surface p-4">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
