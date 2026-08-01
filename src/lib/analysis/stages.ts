import type { AnalysisStage, StageId } from "@/lib/analysis/types";

/** Ordered stage timeline (PRD Volume 3). */
export const ANALYSIS_STAGES: AnalysisStage[] = [
  { id: "connecting", label: "Connecting..." },
  { id: "loading", label: "Loading Website..." },
  { id: "layout", label: "Inspecting Layout..." },
  { id: "accessibility", label: "Reviewing Accessibility..." },
  { id: "performance", label: "Evaluating Performance..." },
  { id: "report", label: "Preparing Report..." },
];

/** Rotating status detail lines shown beneath the progress bar. */
export const STATUS_MESSAGES = [
  "Checking typography...",
  "Inspecting visual hierarchy...",
  "Reviewing responsiveness...",
  "Analyzing navigation...",
  "Evaluating business structure...",
  "Preparing recommendations...",
];

export function stageIndex(id: StageId): number {
  return ANALYSIS_STAGES.findIndex((stage) => stage.id === id);
}

/** Maps a 0–100 progress value onto the stage timeline. */
export function stageForPercent(percent: number): StageId {
  const index = Math.min(
    ANALYSIS_STAGES.length - 1,
    Math.floor((percent / 100) * ANALYSIS_STAGES.length),
  );
  return ANALYSIS_STAGES[index]!.id;
}
