import type { ScoreStatus } from "@/lib/dashboard/types";

/** Shared score thresholds — one source of truth across every section. */
export function statusForScore(score: number): ScoreStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  return "needs-improvement";
}

export const STATUS_LABEL: Record<ScoreStatus, string> = {
  excellent: "Excellent",
  good: "Good",
  "needs-improvement": "Needs Improvement",
};

/**
 * Calm, never-aggressive tone classes. Low scores read as "room to grow",
 * not as an alarm, per the WebLens error philosophy.
 */
export const STATUS_TEXT_CLASS: Record<ScoreStatus, string> = {
  excellent: "text-primary",
  good: "text-primary",
  "needs-improvement": "text-warning",
};

export const STATUS_BADGE_CLASS: Record<ScoreStatus, string> = {
  excellent: "bg-primary-soft text-accent-foreground",
  good: "bg-secondary text-secondary-foreground",
  "needs-improvement": "bg-warning/15 text-warning-foreground dark:text-warning",
};

/** Ring / bar colour stays emerald for healthy scores, warm amber below 70. */
export function scoreStroke(score: number): string {
  return statusForScore(score) === "needs-improvement"
    ? "var(--color-warning)"
    : "var(--color-primary)";
}
