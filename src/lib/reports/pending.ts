import type { AnalysisResult } from "@/lib/analysis/types";

/**
 * Pending guest analysis.
 *
 * A visitor can run a full analysis before creating an account. The result is
 * held on their device only, then attached to the account the moment they
 * sign in or confirm their new email — and cleared straight after, so nothing
 * lingers and no duplicate is ever created.
 */
const KEY = "weblens:pending-analysis";

function isBrowser() {
  return typeof window !== "undefined";
}

export function setPendingAnalysis(result: AnalysisResult) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    // Storage unavailable — the analysis still lives in this session.
  }
}

export function getPendingAnalysis(): AnalysisResult | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnalysisResult;
    return parsed?.url ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPendingAnalysis() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clean up.
  }
}
