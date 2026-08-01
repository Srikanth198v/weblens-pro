import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AnalysisComplete } from "@/components/analysis/analysis-complete";
import { AnalysisErrorState } from "@/components/analysis/analysis-error-state";
import { AnalysisProgress } from "@/components/analysis/analysis-progress";
import { AnalysisTimeline } from "@/components/analysis/analysis-timeline";
import { BrowserPreview } from "@/components/analysis/browser-preview";
import { ScanSurface } from "@/components/analysis/scan-surface";
import { AmbientBackground } from "@/components/landing/ambient-background";
import { BrandMark } from "@/components/layout/brand-mark";
import { useAnalysisRun } from "@/hooks/use-analysis-run";
import { validateUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

const title = "Analyzing your website — WebLens AI";
const description =
  "WebLens AI is reviewing your website's design, performance, SEO, accessibility and business structure.";

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
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalysisPage,
});

const HOLD_MS = 900;

function AnalysisPage() {
  const { url } = Route.useSearch();
  const navigate = useNavigate();
  const validated = validateUrl(url);
  const targetUrl = validated.status === "valid" ? validated.url : "";

  const { percent, stageId, statusMessage, status, retry } = useAnalysisRun(targetUrl);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (status !== "complete") return;
    const fade = window.setTimeout(() => setLeaving(true), HOLD_MS);
    const go = window.setTimeout(() => {
      navigate({ to: "/dashboard" });
    }, HOLD_MS + 400);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(go);
    };
  }, [status, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AmbientBackground />

      <main
        className={cn(
          "relative mx-auto flex min-h-screen w-full max-w-[72rem] flex-col items-center justify-center gap-8 px-5 py-16 transition-opacity duration-(--motion-component) ease-(--motion-ease) sm:px-8 lg:gap-10",
          leaving ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark />
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {status === "failed" ? "Analysis paused" : "Analyzing your website"}
          </h1>
          {status !== "failed" ? (
            <p className="max-w-[44ch] text-sm text-muted-foreground sm:text-base">
              Sit tight — we're reviewing the experience the way a professional agency would.
            </p>
          ) : null}
        </div>

        {status === "failed" ? (
          <AnalysisErrorState url={url} onRetry={retry} />
        ) : (
          <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-10">
            <BrowserPreview url={targetUrl || url}>
              <ScanSurface scanning={status === "running"} />
            </BrowserPreview>

            <div className="flex w-full flex-col gap-6 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
              <AnalysisProgress percent={percent} message={statusMessage} />
              <AnalysisTimeline activeStage={stageId} complete={status === "complete"} />
              {status === "complete" ? <AnalysisComplete /> : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
