/**
 * WebLens Intelligence contract.
 *
 * Deliberately independent from the analysis engine: a provider receives a
 * plain snapshot of scores and returns consultant-style guidance. Swapping the
 * heuristic provider for a real AI service requires no UI changes.
 */

export type IntelligenceSnapshot = {
  siteName: string;
  overallScore: number;
  categories: Array<{ id: string; label: string; score: number }>;
  business: Array<{ id: string; label: string; score: number }>;
};

export type IntelligenceHighlightKind = "top-opportunity" | "quick-win" | "greatest-strength";

export type IntelligenceHighlight = {
  kind: IntelligenceHighlightKind;
  title: string;
  subject: string;
  detail: string;
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
  /** 0–100 confidence in this guidance. */
  confidence: number;
};

export type IntelligenceReport = {
  highlights: IntelligenceHighlight[];
  recommendations: ConsultantRecommendation[];
  /** Celebratory note so the section is never only about problems. */
  celebration: string;
};

export interface IntelligenceProvider {
  readonly id: string;
  generate(snapshot: IntelligenceSnapshot): IntelligenceReport;
}
