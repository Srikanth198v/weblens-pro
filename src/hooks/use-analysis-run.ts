import { useCallback, useEffect, useRef, useState } from "react";

import { liveAnalysisEngine } from "@/lib/analysis/live-engine";
import { STATUS_MESSAGES, stageForPercent } from "@/lib/analysis/stages";
import { saveAnalysisResult } from "@/lib/analysis/store";
import type { AnalysisEngine, AnalysisResult, StageId } from "@/lib/analysis/types";

export type AnalysisRunStatus = "running" | "complete" | "failed";

const MESSAGE_INTERVAL_MS = 1100;

/**
 * Orchestrates a single analysis run: progress, stage, rotating status copy,
 * completion and failure. Presentation components stay stateless.
 */
export function useAnalysisRun(url: string, engine: AnalysisEngine = liveAnalysisEngine) {
  const [percent, setPercent] = useState(0);
  const [stageId, setStageId] = useState<StageId>("connecting");
  const [messageIndex, setMessageIndex] = useState(0);
  const [status, setStatus] = useState<AnalysisRunStatus>("running");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  const engineRef = useRef(engine);
  engineRef.current = engine;

  useEffect(() => {
    if (!url) {
      setStatus("failed");
      return;
    }

    const controller = new AbortController();
    let active = true;

    setStatus("running");
    setPercent(0);
    setStageId("connecting");
    setResult(null);

    const rotate = window.setInterval(() => {
      setMessageIndex((index) => (index + 1) % STATUS_MESSAGES.length);
    }, MESSAGE_INTERVAL_MS);

    engineRef.current
      .run({
        url,
        signal: controller.signal,
        onProgress: ({ percent: next }) => {
          if (!active) return;
          setPercent(next);
          setStageId(stageForPercent(next));
        },
      })
      .then((analysis) => {
        if (!active) return;
        setPercent(100);
        setStageId("report");
        setResult(analysis);
        saveAnalysisResult(analysis);
        setStatus("complete");
      })
      .catch(() => {
        if (!active || controller.signal.aborted) return;
        setStatus("failed");
      })
      .finally(() => {
        window.clearInterval(rotate);
      });

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(rotate);
    };
  }, [url, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    percent,
    stageId,
    statusMessage: STATUS_MESSAGES[messageIndex]!,
    status,
    result,
    retry,
  };
}
