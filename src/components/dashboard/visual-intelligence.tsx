import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, Monitor, Smartphone, X } from "lucide-react";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { analyzeVisual } from "@/lib/visual/analyze.functions";
import { VISUAL_PIN_LABEL, type VisualIntelligence } from "@/lib/visual/types";

/**
 * Visual Intelligence — what the page looks like on screen.
 *
 * Screenshots and their reading load on demand, so the rest of the dashboard
 * is never held up waiting for a render.
 */
export function VisualIntelligenceSection({ url }: { url: string }) {
  const run = useServerFn(analyzeVisual);
  const { data, isPending, isError } = useQuery({
    queryKey: ["visual-intelligence", url],
    queryFn: () => run({ data: { url } }),
    staleTime: Infinity,
    retry: false,
  });

  if (isPending) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-3xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-card">
        We couldn&apos;t capture how this page looks during this analysis. Everything else in this
        report is unaffected — refresh the page to try the visual capture again.
      </p>
    );
  }

  return <VisualReport visual={data} />;
}

function VisualReport({ visual }: { visual: VisualIntelligence }) {
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const hasReading = visual.summary.length > 0;
  const shot = view === "desktop" ? visual.screenshots.desktop : visual.screenshots.mobile;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Captured screens</p>
            <p className="text-sm text-muted-foreground">
              Desktop at 1440px and mobile at 390px, as rendered during this analysis.
            </p>
          </div>
          <div className="flex shrink-0 gap-1 rounded-full border border-border bg-surface p-1">
            <ViewTab active={view === "desktop"} onClick={() => setView("desktop")} icon={Monitor}>
              Desktop
            </ViewTab>
            <ViewTab active={view === "mobile"} onClick={() => setView("mobile")} icon={Smartphone}>
              Mobile
            </ViewTab>
          </div>
        </div>

        <div
          className={cn(
            "relative mt-4 overflow-hidden rounded-2xl border border-border bg-surface",
            view === "mobile" ? "mx-auto max-w-[22rem]" : "",
          )}
        >
          {shot ? (
            <>
              <img
                src={shot}
                alt={`${view} screenshot of the analysed website`}
                loading="lazy"
                decoding="async"
                className="w-full"
              />
              {view === "desktop"
                ? visual.pins.map((pin) => (
                    <span
                      key={pin.index}
                      className="absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lifted ring-2 ring-background"
                      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                      title={`${VISUAL_PIN_LABEL[pin.kind]} — ${pin.label}`}
                    >
                      {pin.index}
                    </span>
                  ))
                : null}
            </>
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              No {view} screenshot was captured during this analysis.
            </p>
          )}
        </div>

        {view === "desktop" && visual.pins.length ? (
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {visual.pins.map((pin) => (
              <li key={pin.index} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                  {pin.index}
                </span>
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{VISUAL_PIN_LABEL[pin.kind]}</span>{" "}
                  — {pin.label}
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        {visual.screenshots.fullPage ? (
          <details className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Full-page capture
            </summary>
            <img
              src={visual.screenshots.fullPage}
              alt="Full-page screenshot of the analysed website"
              loading="lazy"
              decoding="async"
              className="mt-3 w-full rounded-xl border border-border"
            />
          </details>
        ) : null}
      </div>

      {visual.note ? (
        <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted-foreground">
          {visual.note}
        </p>
      ) : null}

      {hasReading ? (
        <>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-2xl text-sm leading-relaxed text-foreground/85 sm:text-base">
                {visual.summary}
              </p>
              <div className="shrink-0 rounded-2xl border border-border bg-surface px-5 py-4 text-center">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                  Visual experience
                </p>
                <p className="font-display text-3xl font-extrabold text-foreground tabular-nums">
                  {visual.score}
                  <span className="text-base font-semibold text-muted-foreground">/100</span>
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visual.dimensions.map((dimension) => (
                <div key={dimension.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{dimension.label}</p>
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {dimension.score}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-700 ease-in-out"
                      style={{ width: `${dimension.score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {dimension.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {visual.checks.length ? (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
              <p className="text-sm font-semibold text-foreground">What we could see on screen</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {visual.checks.map((check) => {
                  const Icon =
                    check.verdict === "pass" ? Check : check.verdict === "fail" ? X : AlertTriangle;
                  return (
                    <li key={check.label} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                          check.verdict === "pass"
                            ? "bg-primary-soft text-primary"
                            : check.verdict === "fail"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/15 text-warning",
                        )}
                      >
                        <Icon aria-hidden="true" className="size-3.5" />
                      </span>
                      <span className="text-sm">
                        <span className="font-medium text-foreground">{check.label}</span>
                        <span className="block text-muted-foreground">{check.detail}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {visual.recommendations.length ? (
            <div className="space-y-3">
              {visual.recommendations.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-base font-semibold text-foreground">{item.title}</p>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        item.impact === "High"
                          ? "bg-primary-soft text-primary"
                          : item.impact === "Medium"
                            ? "bg-warning/15 text-warning"
                            : "bg-surface text-muted-foreground",
                      )}
                    >
                      {item.impact} impact
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                        Evidence · Screenshot analysis
                      </dt>
                      <dd className="mt-1 text-sm text-foreground/85">{item.evidence}</dd>
                    </div>
                    <div>
                      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                        Affected area
                      </dt>
                      <dd className="mt-1 text-sm text-foreground/85">{item.area}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Monitor;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-200",
        active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {children}
    </button>
  );
}
