import { track } from "@/lib/analytics/track";
import type { AnalysisResult } from "@/lib/analysis/types";
import { saveCloudReport } from "@/lib/reports/cloud";
import { setPendingAnalysis } from "@/lib/reports/pending";
import { saveReport } from "@/lib/reports/storage";

/**
 * Holds the most recent analysis result for the next screen to read.
 * Session-scoped so a refresh on the dashboard does not lose the report.
 */
const KEY = "weblens:last-analysis";

let inMemory: AnalysisResult | null = null;

/** Makes a report the one the dashboard, report page and Ask WebLens read. */
export function setCurrentAnalysis(result: AnalysisResult) {
  inMemory = result;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    // Storage unavailable — in-memory copy is enough for this session.
  }
}

export function saveAnalysisResult(result: AnalysisResult) {
  setCurrentAnalysis(result);
  // Keep the report library in sync; saving the same analysis twice is a no-op.
  saveReport(result);
  track("report_saved");
  // Signed-in users get the report on their account. Guests keep it pending on
  // this device until they sign in, then it is attached automatically.
  void saveCloudReport(result)
    .then((saved) => {
      if (!saved) setPendingAnalysis(result);
    })
    .catch(() => setPendingAnalysis(result));
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
