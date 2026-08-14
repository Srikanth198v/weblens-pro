import { useEffect, useState } from "react";

import { generateAiSummary, type GptSummary } from "@/lib/analysis/ai-summary.functions";
import type { DashboardReport } from "@/lib/dashboard/types";
import { screenshotUrls } from "@/lib/visual/screenshots";

/**
 * Asks the model for one written reading of the site — once per report.
 * Anything less than a clean answer leaves the local reading in place.
 */

type State = { status: "loading" | "fallback" } | { status: "ready"; summary: GptSummary };

const cache = new Map<string, State>();
const inflight = new Map<string, Promise<State>>();

function keyFor(report: DashboardReport): string {
  return `${report.url}|${report.completedAt}`;
}

export function useGptSummary(report: DashboardReport): State {
  const key = keyFor(report);
  const [state, setState] = useState<State>(() => cache.get(key) ?? { status: "loading" });

  useEffect(() => {
    let active = true;
    const cached = cache.get(key);
    if (cached) {
      setState(cached);
      return;
    }

    setState({ status: "loading" });

    const request =
      inflight.get(key) ??
      generateAiSummary({
        data: {
          url: report.url,
          title: report.evidence?.metadata.title ?? "",
          metaDescription: report.evidence?.metadata.description ?? "",
          topHeadings: [
            ...(report.evidence?.headings.h1 ?? []),
            ...(report.evidence?.headings.h2 ?? []),
          ].slice(0, 8),
          primaryButtons: report.evidence?.content.ctas ?? [],
          scores: [
            { label: "Overall", score: report.overallScore },
            ...report.categories.map((category) => ({
              label: category.label,
              score: category.score,
            })),
          ],
          screenshot: screenshotUrls(report.url).desktop,
          websiteType: report.understanding?.industry ?? "",
          audience: report.understanding?.audience ?? "",
          purpose: report.understanding?.purpose ?? "",
        },
      })
        .then<State>((result) =>
          result.ok ? { status: "ready", summary: result.data } : { status: "fallback" },
        )
        .catch<State>(() => ({ status: "fallback" }))
        .then((result) => {
          cache.set(key, result);
          inflight.delete(key);
          return result;
        });

    inflight.set(key, request);

    void request.then((result) => {
      if (active) setState(result);
    });

    return () => {
      active = false;
    };
  }, [key, report]);

  return state;
}
