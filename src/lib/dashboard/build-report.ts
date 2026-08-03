import { EVIDENCE_SOURCE_LABEL, type EvidenceSourceId } from "@/lib/analysis/evidence";
import { evaluateEvidence, type EvidenceFactor } from "@/lib/analysis/score-from-evidence";
import { buildUnderstanding } from "@/lib/analysis/understanding";
import type { AnalysisResult } from "@/lib/analysis/types";
import type {
  BusinessMetric,
  CategoryDetail,
  CategoryId,
  DashboardReport,
  Recommendation,
  RecommendationPriority,
  ReportConfidence,
} from "@/lib/dashboard/types";

/**
 * Turns collected evidence into the dashboard view model.
 *
 * Nothing here is generated from templates or randomness: every score,
 * explanation and recommendation traces back to a measurement taken from the
 * analyzed page. Results saved before evidence collection existed are shown
 * honestly as "not enough evidence" rather than padded with generic copy.
 */

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function siteNameFor(url: string): string {
  const host = displayUrl(url).split("/")[0] ?? "";
  const label = host.replace(/^www\./i, "").split(".")[0] ?? host;
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "Your website";
}

const ALL_SOURCES: EvidenceSourceId[] = [
  "html",
  "metadata",
  "headings",
  "images",
  "links",
  "structured-data",
  "performance",
  "accessibility",
];

function confidenceFor(used: EvidenceSourceId[]): ReportConfidence {
  const sources = ALL_SOURCES.map((id) => ({
    id,
    label: EVIDENCE_SOURCE_LABEL[id],
    used: used.includes(id),
  }));
  return {
    score: Math.round((sources.filter((source) => source.used).length / sources.length) * 100),
    sources,
  };
}

function priorityFor(factor: EvidenceFactor): RecommendationPriority {
  const impact = factor.remedy?.impact ?? "Medium";
  if (factor.verdict === "fail") return impact === "Low" ? "medium" : "high";
  if (factor.verdict === "warn") return impact === "High" ? "medium" : "low";
  return "low";
}

/** One recommendation per failing measurement — never more, never invented. */
function recommendationsFrom(factors: EvidenceFactor[]): Recommendation[] {
  const items = factors
    .filter((factor) => factor.remedy && factor.verdict !== "pass")
    .map((factor) => {
      const remedy = factor.remedy!;
      return {
        id: factor.id,
        category: factor.category,
        icon: remedy.icon,
        title: remedy.title,
        description: remedy.description,
        evidence: [factor.detail, ...(factor.improvement ? [factor.improvement] : [])],
        priority: priorityFor(factor),
        impact: remedy.impact,
        difficulty: remedy.difficulty,
        estimatedTime: remedy.estimatedTime,
      } satisfies Recommendation;
    });

  const order = { high: 0, medium: 1, low: 2 } as const;
  return items.sort((a, b) => order[a.priority] - order[b.priority]);
}

/**
 * The business review re-reads the same measurements from a commercial angle.
 * Each metric names the evidence it is based on.
 */
function businessFrom(factors: EvidenceFactor[]): BusinessMetric[] {
  const LABELS: Record<string, string> = {
    "biz-cta": "Call To Action",
    "biz-proof": "Trust & Testimonials",
    "biz-pricing": "Pricing Transparency",
    "biz-contact": "Contact Information",
    "biz-navigation": "Navigation",
    "biz-credibility": "Credibility Signals",
    "biz-questions": "FAQ & Support",
    "design-focal-point": "Homepage Clarity",
    "seo-content-depth": "Findability",
    "perf-render-blocking": "First Impression Speed",
  };

  return factors
    .filter((factor) => factor.id in LABELS)
    .map((factor) => ({
      id: factor.id,
      label: LABELS[factor.id]!,
      score: factor.score,
      explanation:
        factor.verdict === "pass"
          ? `${factor.detail}. This is working in your favour as it stands.`
          : `${factor.detail}. ${factor.improvement ?? "Worth revisiting when you next touch the page."}`,
      evidence: factor.detail,
    }));
}

function categoriesFrom(result: AnalysisResult): {
  categories: CategoryDetail[];
  factors: EvidenceFactor[];
} {
  const evidence = result.evidence!;
  const evaluation = evaluateEvidence(evidence);

  const categories: CategoryDetail[] = evaluation.categories.map((category) => ({
    id: category.id,
    label: category.label,
    score: category.score,
    summary: category.summary,
    measured: category.measured,
    factors: category.factors.map((factor) => ({
      label: factor.label,
      detail: factor.detail,
      verdict: factor.verdict,
    })),
    whyThisScore: category.whyThisScore,
    biggestFactor: category.biggestFactor,
    whatWouldImprove: category.whatWouldImprove,
    strengths: category.strengths,
    weaknesses: category.weaknesses,
    suggestions: category.suggestions,
  }));

  return { categories, factors: evaluation.factors };
}

/** Older saved analyses carry no evidence — we say so instead of filling gaps. */
function legacyCategories(result: AnalysisResult): CategoryDetail[] {
  const ids: CategoryId[] = ["design", "performance", "seo", "accessibility", "business"];
  return ids.map((id) => {
    const engineScore = result.categories.find((category) => category.id === id)?.score ?? 0;
    return {
      id,
      label: id === "seo" ? "SEO" : id.charAt(0).toUpperCase() + id.slice(1),
      score: engineScore,
      summary: "This analysis was saved before evidence collection — re-run it for the detail.",
      measured: [],
      factors: [],
      whyThisScore: "No evidence was stored with this analysis, so the score cannot be explained.",
      biggestFactor: "Not available for this saved analysis.",
      whatWouldImprove: "Re-run the analysis to collect evidence from the live page.",
      strengths: [],
      weaknesses: [],
      suggestions: [],
    };
  });
}

export function buildDashboardReport(result: AnalysisResult): DashboardReport {
  const base = {
    url: result.url,
    siteName: siteNameFor(result.url),
    displayUrl: displayUrl(result.url),
    completedAt: result.completedAt,
  };

  if (!result.evidence) {
    return {
      ...base,
      overallScore: result.overallScore,
      categories: legacyCategories(result),
      business: [],
      recommendations: [],
      understanding: null,
      evidence: null,
      confidence: confidenceFor([]),
    };
  }

  const { categories, factors } = categoriesFrom(result);
  const overallScore = Math.round(
    categories.reduce((sum, category) => sum + category.score, 0) / categories.length,
  );

  return {
    ...base,
    overallScore,
    categories,
    business: businessFrom(factors),
    recommendations: recommendationsFrom(factors),
    understanding: result.understanding ?? buildUnderstanding(result.evidence),
    evidence: result.evidence,
    confidence: confidenceFor(result.evidence.sources),
  };
}
