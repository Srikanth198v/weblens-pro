import { Check } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import type { ReportStrength } from "@/lib/report/build-report-view";

/** Strengths — every major positive finding, with the business value spelled out. */
export function StrengthsSection({ strengths }: { strengths: ReportStrength[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {strengths.map((strength, index) => (
        <Reveal as="li" key={strength.id} delay={(index % 2) * 100} className="h-full">
          <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow duration-200 hover:shadow-card">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft">
                <Check aria-hidden="true" className="size-4 text-primary" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  {strength.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {strength.explanation}
                </p>
                <p className="mt-3 rounded-xl bg-surface p-3 text-xs leading-relaxed text-foreground/80">
                  <span className="font-semibold text-foreground">Business value: </span>
                  {strength.businessValue}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}
