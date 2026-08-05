import { createFileRoute, useBlocker, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";


import { AnalysisComplete } from "@/components/analysis/analysis-complete";
import { AnalysisErrorState } from "@/components/analysis/analysis-error-state";
import { AnalysisProgress } from "@/components/analysis/analysis-progress";
import { AnalysisTimeline } from "@/components/analysis/analysis-timeline";
import { BrowserPreview } from "@/components/analysis/browser-preview";
import { ScanSurface } from "@/components/analysis/scan-surface";
import { VerificationErrorState } from "@/components/analysis/verification-error-state";
import { VerificationPanel } from "@/components/analysis/verification-panel";
import { AmbientBackground } from "@/components/landing/ambient-background";
import { BrandMark } from "@/components/layout/brand-mark";
import { useAnalysisRun } from "@/hooks/use-analysis-run";
import { useWebsiteVerification } from "@/hooks/use-website-verification";
import type { VerificationCheck } from "@/lib/verification/types";
import { cn } from "@/lib/utils";

const title = "Analyzing your website — WebLens AI";
const description =
  "WebLens AI verifies your website is reachable, then reviews its design, performance, SEO, accessibility and business structure.";

export const Route = createFileRoute("/analysis")({
  validateSearch: (search: Record<string, unknown>) => ({
    url: typeof search.url === "string" ? search.url : "",
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalysisPage,
});

const HOLD_MS = 900;
const VERIFIED_HOLD_MS = 800;

function AnalysisPage() {
  const { url } = Route.useSearch();
  const { state, retry } = useWebsiteVerification(url);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (state.status !== "verified") {
      setGateOpen(false);
      return;
    }
    const timer = window.setTimeout(() => setGateOpen(true), VERIFIED_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [state.status]);

  const heading =
    state.status === "failed"
      ? "Verification paused"
      : gateOpen
        ? "Analyzing your website"
        : "Verifying your website";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AmbientBackground />

      <main id="main-content" className="relative mx-auto flex min-h-screen w-full max-w-[72rem] flex-col items-center justify-center gap-8 px-5 py-16 sm:px-8 lg:gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {heading}
          </h1>
          {state.status !== "failed" ? (
            <p className="max-w-[44ch] text-sm text-muted-foreground sm:text-base">
              {gateOpen
                ? "Sit tight — we're reviewing the experience the way a professional agency would."
                : "We confirm every website is real and reachable before any analysis begins."}
            </p>
          ) : null}
        </div>

        {state.status === "failed" ? (
          <VerificationErrorState failure={state.result} onRetry={retry} />
        ) : gateOpen && state.status === "verified" ? (
          <AnalysisRunner url={state.result.url} checks={state.result.checks} />
        ) : (
          <VerificationPanel
            step={state.status === "verifying" ? state.step : 0}
            verified={state.status === "verified"}
            checks={state.status === "verified" ? state.result.checks : undefined}
          />
        )}
      </main>
    </div>
  );
}

function AnalysisRunner({ url, checks }: { url: string; checks: VerificationCheck[] }) {
  const navigate = useNavigate();
  const { percent, stageId, statusMessage, status, retry } = useAnalysisRun(url);
  const [leaving, setLeaving] = useState(false);

  // Guard against losing an in-flight analysis to a stray back gesture or refresh.
  useBlocker({
    shouldBlockFn: () =>
      status === "running" &&
      !window.confirm("This analysis is still running. Leave and discard the results?"),
    enableBeforeUnload: status === "running",
  });

  useEffect(() => {
    if (status !== "complete") return;
    const fade = window.setTimeout(() => setLeaving(true), HOLD_MS);
    const go = window.setTimeout(() => {
      navigate({ to: "/dashboard", replace: true });
    }, HOLD_MS + 400);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(go);
    };
  }, [status, navigate]);


  if (status === "failed") {
    return <AnalysisErrorState url={url} onRetry={retry} />;
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-6 transition-opacity duration-(--motion-component) ease-(--motion-ease)",
        leaving ? "opacity-0" : "opacity-100",
      )}
    >
      <ul className="flex flex-wrap justify-center gap-2">
        {checks
          .filter((check) => check.passed)
          .map((check) => (
            <li
              key={check.id}
              className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary"
            >
              <Check aria-hidden="true" className="size-3.5" />
              {check.label}
            </li>
          ))}
      </ul>

      <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
        <BrowserPreview url={url}>
          <ScanSurface scanning={status === "running"} />
        </BrowserPreview>

        <div className="flex w-full flex-col gap-6 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <AnalysisProgress percent={percent} message={statusMessage} />
          <AnalysisTimeline activeStage={stageId} complete={status === "complete"} />
          {status === "complete" ? <AnalysisComplete /> : null}
        </div>
      </div>
    </div>
  );
}
