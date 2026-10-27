import { useMemo, useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AREA_LABEL, buildFindings, findingFixText, type FindingArea, type FindingSeverity } from "@/lib/dashboard/findings";
import type { CategoryDetail, Recommendation } from "@/lib/dashboard/types";

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  passed: "Passed",
};

const SEVERITY_STYLE: Record<FindingSeverity, string> = {
  critical: "bg-destructive/10 text-destructive",
  warning: "bg-warning/15 text-foreground",
  passed: "bg-primary/10 text-primary",
};

const AREAS = Object.keys(AREA_LABEL) as FindingArea[];

/** Measured findings grouped into five report areas, with severity and fixes. */
export function FindingsExplorer({ categories, url, recommendations = [] }: {
  categories: CategoryDetail[];
  url: string;
  recommendations?: Recommendation[];
}) {
  const findings = useMemo(() => buildFindings(categories, url, recommendations), [categories, url, recommendations]);
  const [area, setArea] = useState<FindingArea>("seo");
  const [hidePassed, setHidePassed] = useState(false);

  const visible = findings.filter((f) => f.area === area && (!hidePassed || f.severity !== "passed"));
  const legacy = categories.some((c) => c.factors.some((f) => !f.id));

  return (
    <div className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Findings by area · measured checks only
        </p>
        <label className="flex min-h-11 items-center gap-2 text-sm text-foreground/80">
          <input
            type="checkbox"
            checked={hidePassed}
            onChange={(e) => setHidePassed(e.target.checked)}
            className="size-4 accent-primary"
          />
          Hide passed checks
        </label>
      </div>

      <div role="tablist" aria-label="Report areas" className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {AREAS.map((id) => {
          const issues = findings.filter((f) => f.area === id && f.severity !== "passed").length;
          return (
            <Button
              variant="ghost"
              key={id}
              role="tab"
              aria-selected={area === id}
              onClick={() => setArea(id)}
              className={cn(
                "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors duration-200",
                area === id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-foreground/80 hover:bg-muted",
              )}
            >
              {AREA_LABEL[id]}
              <span className="ml-1.5 tabular-nums opacity-80">({issues})</span>
            </Button>
          );
        })}
      </div>

      {legacy ? (
        <p className="mt-4 rounded-xl bg-surface p-3 text-sm text-muted-foreground">
          This report was saved before detailed findings were available, so some areas may be
          incomplete. Run the analysis again for the full breakdown.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          {hidePassed
            ? "No issues found in this area during this analysis."
            : "No checks in this area could be measured for this page."}
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((f) => (
            <li key={f.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", SEVERITY_STYLE[f.severity])}>
                  {SEVERITY_LABEL[f.severity]}
                </span>
                <span className="text-sm font-semibold text-foreground">{f.title}</span>
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
                <dt className="text-muted-foreground">Affected</dt>
                <dd className="break-words text-foreground/85">{f.affected}</dd>
                <dt className="text-muted-foreground">Measured</dt>
                <dd className="text-foreground/85">{f.evidence}</dd>
                {f.fix ? (
                  <>
                    <dt className="text-muted-foreground">Suggested fix</dt>
                    <dd className="text-foreground/85">{f.fix}</dd>
                  </>
                ) : null}
              </dl>
              {f.severity !== "passed" && (f.recommendation || f.fix) ? (
                <details className="group mt-4 border-t border-border pt-3">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                    How to fix
                    <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <div className="space-y-4 pt-3">
                    {f.recommendation ? (
                      <>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span>Impact: <strong className="font-medium text-foreground">{f.recommendation.impact}</strong></span>
                          <span>Effort: <strong className="font-medium text-foreground">{f.recommendation.difficulty}</strong></span>
                          <span>Estimated time: <strong className="font-medium text-foreground">{f.recommendation.estimatedTime}</strong></span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Why it matters</p>
                          <p className="mt-1 text-sm text-muted-foreground">{f.recommendation.whyItMatters}</p>
                        </div>
                      </>
                    ) : null}
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground/85">
                      {(f.recommendation?.howToFix ?? (f.fix ? [f.fix] : [])).map((step, index) => (
                        <li key={`${f.id}-step-${index}`} className="break-words pl-1">{step}</li>
                      ))}
                    </ol>
                    <Button
                      variant="outline"
                      className="min-h-11"
                      aria-label={`Copy fix for ${f.title}`}
                      onClick={async () => {
                        const text = findingFixText(f);
                        if (!text) return;
                        try {
                          await navigator.clipboard.writeText(text);
                          toast.success("Fix steps copied");
                        } catch {
                          toast.error("Couldn't copy the steps. Select the steps and copy them manually.");
                        }
                      }}
                    >
                      <Copy aria-hidden="true" /> Copy fix
                    </Button>
                    <p className="text-xs text-muted-foreground">Suggested steps, not applied changes. Re-analyze the website after updating it to verify the result.</p>
                  </div>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        "Measured" lines come straight from the page's HTML and server response. Suggested fixes are
        guidance based on those measurements, not confirmed results. Passing these checks doesn't
        mean the site is fully secure or bug-free.
      </p>
    </div>
  );
}
