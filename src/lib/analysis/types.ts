/**
 * Engine-independent analysis contract.
 * The UI only knows these types — the engine behind them can later be swapped
 * for a real crawler or AI service without touching presentation code.
 */

import type { SiteEvidence, WebsiteUnderstanding } from "@/lib/analysis/evidence";

export type StageId =
  | "connecting"
  | "loading"
  | "layout"
  | "accessibility"
  | "performance"
  | "report";

export type AnalysisStage = {
  id: StageId;
  label: string;
};

export type CategoryScore = {
  id: "design" | "performance" | "seo" | "accessibility" | "business";
  label: string;
  score: number;
};

export type AnalysisResult = {
  url: string;
  completedAt: string;
  overallScore: number;
  categories: CategoryScore[];
  /**
   * Everything measured from the live page. Reports are built from this, so a
   * result without evidence is treated as an older, unverifiable analysis.
   */
  evidence?: SiteEvidence;
  understanding?: WebsiteUnderstanding;
};

export type AnalysisProgress = {
  /** 0–100, always monotonically increasing. */
  percent: number;
  stageId: StageId;
};

export type AnalysisRequest = {
  url: string;
  signal?: AbortSignal;
  onProgress?: (progress: AnalysisProgress) => void;
};

export interface AnalysisEngine {
  run(request: AnalysisRequest): Promise<AnalysisResult>;
}

/** Thrown when analysis cannot complete. Never surfaced verbatim to users. */
export class AnalysisError extends Error {}
