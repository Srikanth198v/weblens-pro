import { EVIDENCE_SOURCE_LABEL, type EvidenceSourceId } from "@/lib/analysis/evidence";
import { buildEvidenceReport } from "@/lib/dashboard/evidence-report";
import { evaluateEvidence, type EvidenceFactor } from "@/lib/analysis/score-from-evidence";
import { buildUnderstanding } from "@/lib/analysis/understanding";
import {
  assessTopic,
  buildRecommendationContext,
  filterApplicableText,
  topicForText,
  type RecommendationContext,
} from "@/lib/analysis/recommendation-context";
import type { AnalysisResult } from "@/lib/analysis/types";
import {
  CATEGORY_BUSINESS_IMPACT,
  CATEGORY_EXPECTED_RESULTS,
  CATEGORY_WEIGHT,
  CATEGORY_WEIGHT_REASON,
  CATEGORY_WHY_IT_MATTERS,
} from "@/lib/dashboard/weights";
import type {
  BusinessMetric,
  CategoryDetail,
  CategoryId,
  DashboardReport,
  Recommendation,
  RecommendationPriority,
  ReportConfidence,
  ScoreBreakdownItem,
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

/**
 * Where each finding came from. Recommendations always name their origin so
 * a reader can trace the conclusion back to the analysis that produced it.
 */
const RECOMMENDATION_SOURCES: Record<CategoryId, string[]> = {
  design: ["HTML structure", "Heading structure", "Page content"],
  performance: ["Load measurements", "HTML structure"],
  seo: ["Metadata", "Structured data", "HTML structure"],
  accessibility: ["Accessibility markup", "Images", "Heading structure"],
  business: ["Business understanding", "Internal links", "Page content"],
};

function priorityFor(factor: EvidenceFactor): RecommendationPriority {
  const impact = factor.remedy?.impact ?? "Medium";
  if (factor.verdict === "fail") return impact === "Low" ? "medium" : "high";
  if (factor.verdict === "warn") return impact === "High" ? "medium" : "low";
  return "low";
}

/**
 * Estimated points added to the overall score if this factor were fully
 * resolved. Derived from the real factor weight inside its category and that
 * category's published share of the overall score — never a guess.
 */
function estimatedGainFor(factor: EvidenceFactor, factors: EvidenceFactor[]): number {
  const categoryWeight = factors
    .filter((item) => item.category === factor.category)
    .reduce((sum, item) => sum + item.weight, 0);
  if (!categoryWeight) return 0;

  const categoryPoints = ((100 - factor.score) * factor.weight) / categoryWeight;
  const overallPoints = (categoryPoints * CATEGORY_WEIGHT[factor.category]) / 100;
  return Math.max(1, Math.round(overallPoints));
}

/**
 * One recommendation per failing measurement — never more, never invented, and
 * only when the finding is relevant to the kind of website detected.
 */
function recommendationsFrom(
  factors: EvidenceFactor[],
  context: RecommendationContext,
): Recommendation[] {
  const items = factors
    .filter((factor) => factor.remedy && factor.verdict !== "pass")
    .filter((factor) => {
      const remedy = factor.remedy!;
      return assessTopic(context, topicForText(`${remedy.title} ${remedy.description}`)).applicable;
    })
    .map((factor) => {
      const remedy = factor.remedy!;
      const gain = estimatedGainFor(factor, factors);
      const fix = factor.improvement ?? remedy.description;

      return {
        id: factor.id,
        category: factor.category,
        icon: remedy.icon,
        title: remedy.title,
        description: remedy.description,
        evidence: [factor.detail, ...(factor.improvement ? [factor.improvement] : [])],
        sources: RECOMMENDATION_SOURCES[factor.category],
        whyItMatters: CATEGORY_WHY_IT_MATTERS[factor.category],
        businessImpact: CATEGORY_BUSINESS_IMPACT[factor.category],
        howToFix: [fix, `Re-run the analysis afterwards to confirm “${factor.label}” now passes.`],
        currentState: factor.detail,
        recommendedState: fix,
        expectedResults: [
          ...CATEGORY_EXPECTED_RESULTS[factor.category],
          `Estimated overall score +${gain}`,
        ],
        estimatedGain: gain,
        priority: priorityFor(factor),
        impact: remedy.impact,
        difficulty: remedy.difficulty,
        estimatedTime: remedy.estimatedTime,
      } satisfies Recommendation;
    });

  const order = { high: 0, medium: 1, low: 2 } as const;
  return items.sort((a, b) => order[a.priority] - order[b.priority] || b.estimatedGain - a.estimatedGain);
}

/**
 * The business review re-reads the same measurements from a commercial angle.
 * Each metric names the evidence it is based on.
 */
function businessFrom(
  factors: EvidenceFactor[],
  context: RecommendationContext,
): BusinessMetric[] {
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
    .map((factor) => {
      const label = LABELS[factor.id]!;
      const applicability = assessTopic(context, topicForText(`${label} ${factor.label}`));
      const applicable = applicability.applicable || factor.verdict === "pass";

      return {
        id: factor.id,
        label,
        score: factor.score,
        explanation: !applicable
          ? `${factor.detail}. This is not counted against the site: ${applicability.notApplicableReason ?? "the check does not apply to this kind of website."}`
          : factor.verdict === "pass"
            ? `${factor.detail}. This is working in your favour as it stands.`
            : `${factor.detail}. ${factor.improvement ?? "Worth revisiting when you next touch the page."}`,
        evidence: factor.detail,
        applicable,
        notApplicableReason: applicable ? null : applicability.notApplicableReason,
      } satisfies BusinessMetric;
    });
}

/**
 * Keeps the "what would improve this" line honest: if the headline suggestion
 * does not apply to this kind of website, the next applicable one is used.
 */
function applicableImprovement(
  headline: string,
  suggestions: string[],
  context: RecommendationContext,
): string {
  if (assessTopic(context, topicForText(headline)).applicable) return headline;
  return (
    filterApplicableText(context, suggestions)[0] ??
    "Nothing in this area is holding the site back once the checks that do not apply to this kind of website are set aside."
  );
}

function categoriesFrom(
  result: AnalysisResult,
  context: RecommendationContext,
): {
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
    whatWouldImprove: applicableImprovement(category.whatWouldImprove, category.suggestions, context),
    strengths: category.strengths,
    weaknesses: filterApplicableText(context, category.weaknesses),
    suggestions: filterApplicableText(context, category.suggestions),
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

/** The published weighting behind the overall score. */
function breakdownFrom(categories: CategoryDetail[]): ScoreBreakdownItem[] {
  return categories.map((category) => ({
    id: category.id,
    label: category.label,
    score: category.score,
    weight: CATEGORY_WEIGHT[category.id],
    contribution: Math.round((category.score * CATEGORY_WEIGHT[category.id]) / 100),
    explanation: CATEGORY_WEIGHT_REASON[category.id],
  }));
}

export function buildDashboardReport(result: AnalysisResult): DashboardReport {
  const base = {
    url: result.url,
    siteName: siteNameFor(result.url),
    displayUrl: displayUrl(result.url),
    completedAt: result.completedAt,
  };

  if (!result.evidence) {
    const legacy = legacyCategories(result);
    return {
      ...base,
      overallScore: result.overallScore,
      breakdown: breakdownFrom(legacy),
      categories: legacy,
      business: [],
      recommendations: [],
      understanding: null,
      evidence: null,
      confidence: confidenceFor([]),
      evidenceReport: buildEvidenceReport(null),
      context: buildRecommendationContext(null),
    };
  }

  const context = buildRecommendationContext(result.evidence);
  const { categories, factors } = categoriesFrom(result, context);
  const overallScore = Math.round(
    categories.reduce(
      (sum, category) => sum + (category.score * CATEGORY_WEIGHT[category.id]) / 100,
      0,
    ),
  );

  return {
    ...base,
    overallScore,
    breakdown: breakdownFrom(categories),
    categories,
    business: businessFrom(factors, context),
    recommendations: recommendationsFrom(factors, context),
    understanding: result.understanding ?? buildUnderstanding(result.evidence),
    evidence: result.evidence,
    confidence: confidenceFor(result.evidence.sources),
    evidenceReport: buildEvidenceReport(result.evidence),
    context,
  };

}
