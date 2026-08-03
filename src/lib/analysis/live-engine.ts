import { stageForPercent } from "@/lib/analysis/stages";
import { inspectWebsite } from "@/lib/analysis/inspect.functions";
import { evaluateEvidence } from "@/lib/analysis/score-from-evidence";
import { buildUnderstanding } from "@/lib/analysis/understanding";
import {
  AnalysisError,
  type AnalysisEngine,
  type AnalysisRequest,
  type AnalysisResult,
} from "@/lib/analysis/types";

const TICK_MS = 60;
const MIN_DURATION_MS = 2600;
/** Progress ceiling while we wait for the page to be read. */
const WAITING_CEILING = 92;

function ease(t: number): number {
  return 1 - Math.pow(1 - t, 2.2);
}

/**
 * Live engine: reads the real page, then scores it from the evidence found.
 * If the page cannot be read, the run fails — we never fabricate a report.
 */
export const liveAnalysisEngine: AnalysisEngine = {
  async run({ url, signal, onProgress }: AnalysisRequest): Promise<AnalysisResult> {
    if (!url) throw new AnalysisError("Missing URL");

    const start = Date.now();
    let last = 0;
    let settled = false;

    const timer = window.setInterval(() => {
      const elapsed = Math.min(1, (Date.now() - start) / MIN_DURATION_MS);
      const ceiling = settled ? 100 : WAITING_CEILING;
      const percent = Math.max(last, Math.min(ceiling, Math.round(ease(elapsed) * 100)));
      last = percent;
      onProgress?.({ percent, stageId: stageForPercent(percent) });
    }, TICK_MS);

    try {
      const response = await inspectWebsite({ data: { url }, signal });
      if (signal?.aborted) throw new AnalysisError("Aborted");
      if (!response || !("ok" in response) || !response.ok) {
        throw new AnalysisError("Could not read the page");
      }

      const evidence = response.evidence;
      const evaluation = evaluateEvidence(evidence);
      const understanding = buildUnderstanding(evidence);

      // Hold the minimum duration so the timeline never jumps.
      const remaining = MIN_DURATION_MS - (Date.now() - start);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      settled = true;
      onProgress?.({ percent: 100, stageId: "report" });

      return {
        url: evidence.finalUrl,
        completedAt: new Date().toISOString(),
        overallScore: evaluation.overallScore,
        categories: evaluation.categories.map(({ id, label, score }) => ({ id, label, score })),
        evidence,
        understanding,
      };
    } finally {
      window.clearInterval(timer);
    }
  },
};
