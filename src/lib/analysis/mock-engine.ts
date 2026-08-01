import { stageForPercent } from "@/lib/analysis/stages";
import {
  AnalysisError,
  type AnalysisEngine,
  type AnalysisRequest,
  type AnalysisResult,
} from "@/lib/analysis/types";

const MIN_DURATION_MS = 4200;
const MAX_DURATION_MS = 5800;
const TICK_MS = 60;

/** Ease-out so progress moves quickly early, then settles — never jumps. */
function ease(t: number): number {
  return 1 - Math.pow(1 - t, 2.2);
}

function scoreFor(seed: number, min: number, max: number): number {
  return min + Math.round(Math.abs(Math.sin(seed)) * (max - min));
}

function buildResult(url: string): AnalysisResult {
  const seed = [...url].reduce((total, char) => total + char.charCodeAt(0), 0);
  const categories: AnalysisResult["categories"] = [
    { id: "design", label: "Design", score: scoreFor(seed * 0.7, 62, 96) },
    { id: "performance", label: "Performance", score: scoreFor(seed * 1.3, 55, 94) },
    { id: "seo", label: "SEO", score: scoreFor(seed * 1.9, 58, 95) },
    { id: "accessibility", label: "Accessibility", score: scoreFor(seed * 2.4, 52, 93) },
    { id: "business", label: "Business", score: scoreFor(seed * 3.1, 60, 92) },
  ];
  const overallScore = Math.round(
    categories.reduce((total, category) => total + category.score, 0) / categories.length,
  );

  return { url, completedAt: new Date().toISOString(), overallScore, categories };
}

/**
 * Temporary mock engine — no AI, no network. Emits smooth progress over
 * roughly 4–6 seconds and returns deterministic mock data.
 */
export const mockAnalysisEngine: AnalysisEngine = {
  run({ url, signal, onProgress }: AnalysisRequest) {
    return new Promise<AnalysisResult>((resolve, reject) => {
      if (!url) {
        reject(new AnalysisError("Missing URL"));
        return;
      }

      const duration =
        MIN_DURATION_MS + Math.random() * (MAX_DURATION_MS - MIN_DURATION_MS);
      const start = Date.now();
      let last = 0;

      const cleanup = () => {
        window.clearInterval(timer);
        signal?.removeEventListener("abort", onAbort);
      };

      const onAbort = () => {
        cleanup();
        reject(new AnalysisError("Aborted"));
      };

      const timer = window.setInterval(() => {
        const elapsed = Math.min(1, (Date.now() - start) / duration);
        const percent = Math.max(last, Math.round(ease(elapsed) * 100));
        last = percent;
        onProgress?.({ percent, stageId: stageForPercent(percent) });

        if (elapsed >= 1) {
          cleanup();
          resolve(buildResult(url));
        }
      }, TICK_MS);

      signal?.addEventListener("abort", onAbort);
    });
  },
};
