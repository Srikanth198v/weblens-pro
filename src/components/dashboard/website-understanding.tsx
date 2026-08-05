import { Compass } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import type { WebsiteUnderstanding } from "@/lib/analysis/evidence";
import type { ReportConfidence } from "@/lib/dashboard/types";

/**
 * Section 02 — what WebLens understood about this website.
 * Every line comes from the page itself; unread facts are stated as unknown.
 */
export function WebsiteUnderstandingSection({
  understanding,
  confidence,
}: {
  understanding: WebsiteUnderstanding | null;
  confidence: ReportConfidence;
}) {
  if (!understanding) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-soft">
        This analysis was saved before WebLens started reading pages in detail. Re-run it to see
        what the site says about itself.
      </div>
    );
  }

  const facts = [
    { label: "Industry", value: understanding.industry },
    { label: "Business type", value: understanding.businessType },
    { label: "What it does", value: understanding.purpose },
    { label: "Who it is for", value: understanding.audience },
    { label: "Main goal of the page", value: understanding.primaryGoal },
    { label: "Main user action", value: understanding.mainUserAction },
    {
      label: "Primary call to action",
      value: understanding.primaryCta
        ? `“${understanding.primaryCta}”`
        : "No call-to-action label was detected during this analysis.",
    },
    { label: "Positioning", value: understanding.positioning },
  ];

  return (
    <div className="space-y-4">
      <Reveal>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Compass aria-hidden="true" className="size-5" />
            </span>
            <div className="max-w-3xl">
              <p className="text-sm leading-relaxed text-foreground/85 sm:text-base">
                {understanding.summary}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                AI confidence in this reading:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {understanding.confidence}%
                </span>
                {understanding.confidence < 60
                  ? " — the page states little about itself, so treat this summary as provisional."
                  : " — based only on what the page states about itself."}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl bg-surface p-4">
                <dt className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {fact.label}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-foreground/85">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {understanding.keyFeatures.length ? (
            <div className="mt-6">
              <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Key things offered
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {understanding.keyFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Reveal>

      <Reveal delay={100}>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              What this is based on
            </p>
            <p className="text-xs text-muted-foreground">
              Evidence coverage{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {confidence.score}%
              </span>
            </p>
          </div>

          <ul className="mt-3 flex flex-wrap gap-2">
            {confidence.sources.map((source) => (
              <li
                key={source.id}
                className={
                  source.used
                    ? "rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-accent-foreground"
                    : "rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground line-through"
                }
              >
                {source.label}
              </li>
            ))}
          </ul>

          {understanding.evidence.length ? (
            <ul className="mt-4 space-y-1.5">
              {understanding.evidence.map((item) => (
                <li key={item} className="text-xs leading-relaxed text-muted-foreground">
                  · {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Reveal>
    </div>
  );
}
