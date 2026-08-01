/**
 * Dashboard view model.
 *
 * The dashboard never reads the analysis engine directly. A report builder
 * turns whatever the engine returns into these shapes, so a future AI or
 * crawler engine can be swapped in without touching presentation code.
 */

export type ScoreStatus = "excellent" | "good" | "needs-improvement";

export type CategoryId = "design" | "performance" | "seo" | "accessibility" | "business";

export type CategoryDetail = {
  id: CategoryId;
  label: string;
  score: number;
  /** One-line plain-language summary used by the quick summary cards. */
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

export type BusinessMetricId =
  | "homepage-clarity"
  | "call-to-action"
  | "trust-signals"
  | "testimonials"
  | "pricing"
  | "contact-information"
  | "navigation"
  | "faq"
  | "about-page";

export type BusinessMetric = {
  id: BusinessMetricId;
  label: string;
  score: number;
  explanation: string;
};

export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationImpact = "High" | "Medium" | "Low";
export type RecommendationDifficulty = "Easy" | "Moderate" | "Advanced";

export type Recommendation = {
  id: string;
  /** Icon key resolved by the presentation layer — no components in data. */
  icon: "layout" | "gauge" | "search" | "accessibility" | "briefcase" | "sparkles";
  title: string;
  description: string;
  priority: RecommendationPriority;
  impact: RecommendationImpact;
  difficulty: RecommendationDifficulty;
  estimatedTime: string;
};

export type DashboardReport = {
  url: string;
  /** Human-friendly site name derived from the address. */
  siteName: string;
  displayUrl: string;
  completedAt: string;
  overallScore: number;
  categories: CategoryDetail[];
  business: BusinessMetric[];
  recommendations: Recommendation[];
};
