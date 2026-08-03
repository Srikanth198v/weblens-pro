/**
 * WebLens Intelligence contract.
 *
 * A provider receives the finished, evidence-backed report and returns
 * consultant-style guidance. Swapping this heuristic provider for a real AI
 * service requires no UI changes — only the same shapes back.
 */

import type { DashboardReport, ReportConfidence } from "@/lib/dashboard/types";

export type IntelligenceHighlightKind = "top-opportunity" | "quick-win" | "greatest-strength";

export type IntelligenceHighlight = {
  kind: IntelligenceHighlightKind;
  title: string;
  subject: string;
  detail: string;
  /** The measurement this highlight is drawn from. */
  evidence: string;
  score: number;
};

export type IntelligencePriority = "critical" | "important" | "helpful";

export type ConsultantRecommendation = {
  id: string;
  title: string;
  priority: IntelligencePriority;
  businessImpact: string;
  difficulty: "Easy" | "Moderate" | "Advanced";
  estimatedTime: string;
  whyThisMatters: string;
  recommendedAction: string[];
  /** Measured facts behind this advice. Never empty. */
  evidence: string[];
  /** 0–100 confidence in this guidance. */
  confidence: number;
};

export type IntelligenceReport = {
  /** The consultant's read of the site, in two or three sentences. */
  briefing: string;
  highlights: IntelligenceHighlight[];
  recommendations: ConsultantRecommendation[];
  /** Celebratory note so the section is never only about problems. */
  celebration: string;
  confidence: ReportConfidence;
};

export interface IntelligenceProvider {
  readonly id: string;
  generate(report: DashboardReport): IntelligenceReport;
}
