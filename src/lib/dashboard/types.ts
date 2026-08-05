/**
 * Dashboard view model.
 *
 * The dashboard never reads the analysis engine directly. A report builder
 * turns the collected evidence into these shapes, so a future AI or crawler
 * engine can be swapped in without touching presentation code.
 *
 * Rule: every string a user reads here must be derived from measured
 * evidence. Nothing in this layer invents a finding.
 */

import type { EvidenceSourceId, SiteEvidence, WebsiteUnderstanding } from "@/lib/analysis/evidence";
import type { EvidenceReport } from "@/lib/dashboard/evidence-report";

export type ScoreStatus = "excellent" | "good" | "needs-improvement";

export type CategoryId = "design" | "performance" | "seo" | "accessibility" | "business";

export type CategoryFactor = {
  label: string;
  detail: string;
  verdict: "pass" | "warn" | "fail";
};

export type CategoryDetail = {
  id: CategoryId;
  label: string;
  score: number;
  /** One-line plain-language summary used by the quick summary cards. */
  summary: string;
  /** What was measured to produce this score. */
  measured: string[];
  factors: CategoryFactor[];
  whyThisScore: string;
  biggestFactor: string;
  whatWouldImprove: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

export type BusinessMetric = {
  id: string;
  label: string;
  score: number;
  explanation: string;
  /** The measurement the explanation is based on. */
  evidence: string;
};

export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationImpact = "High" | "Medium" | "Low";
export type RecommendationDifficulty = "Easy" | "Moderate" | "Advanced";

export type Recommendation = {
  id: string;
  category: CategoryId;
  /** Icon key resolved by the presentation layer — no components in data. */
  icon: "layout" | "gauge" | "search" | "accessibility" | "briefcase" | "sparkles";
  title: string;
  description: string;
  /** Measured facts that triggered this recommendation. Never empty. */
  evidence: string[];
  /** Consultant framing: why the measurement is worth acting on. */
  whyItMatters: string;
  /** The commercial consequence of leaving it as-is. */
  businessImpact: string;
  /** Concrete steps, derived from the measurement — never generic filler. */
  howToFix: string[];
  /** Before vs after, both grounded in the measurement. */
  currentState: string;
  recommendedState: string;
  expectedResults: string[];
  /** Estimated points added to the overall score if fully resolved. */
  estimatedGain: number;
  priority: RecommendationPriority;
  impact: RecommendationImpact;
  difficulty: RecommendationDifficulty;
  estimatedTime: string;
};

export type ScoreBreakdownItem = {
  id: CategoryId;
  label: string;
  score: number;
  /** Percentage share of the overall score. */
  weight: number;
  /** Points this area contributes to the overall score, out of `weight`. */
  contribution: number;
  /** Why this area carries this weight. */
  explanation: string;
};

export type ReportConfidence = {
  /** 0–100, based on how much of the page we were able to read. */
  score: number;
  sources: Array<{ id: EvidenceSourceId; label: string; used: boolean }>;
};

export type DashboardReport = {
  url: string;
  /** Human-friendly site name derived from the address. */
  siteName: string;
  displayUrl: string;
  completedAt: string;
  overallScore: number;
  /** Published weighting behind the overall score. */
  breakdown: ScoreBreakdownItem[];
  categories: CategoryDetail[];
  business: BusinessMetric[];
  recommendations: Recommendation[];
  understanding: WebsiteUnderstanding | null;
  evidence: SiteEvidence | null;
  confidence: ReportConfidence;
};
