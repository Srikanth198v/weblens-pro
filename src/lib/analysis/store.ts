import type { AnalysisResult } from "@/lib/analysis/types";
import { saveReport } from "@/lib/reports/storage";

/**
 * Holds the most recent analysis result for the next screen to read.
 * Session-scoped so a refresh on the dashboard does not lose the report.
 */
const KEY = "weblens:last-analysis";

let inMemory: AnalysisResult | null = null;

export function saveAnalysisResult(result: AnalysisResult) {
  inMemory = result;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    // Storage unavailable — in-memory copy is enough for this session.
  }
  // Keep the report library in sync; saving the same analysis twice is a no-op.
  saveReport(result);
}

export function readAnalysisResult(): AnalysisResult | null {
  if (inMemory) return inMemory;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    inMemory = JSON.parse(raw) as AnalysisResult;
    return inMemory;
  } catch {
    return null;
  }
}
