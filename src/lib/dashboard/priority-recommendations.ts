/**
 * Phase 11 — Smart, evidence-based priority recommendations.
 *
 * This layer never invents advice. It re-ranks the recommendations that were
 * already derived from measured evidence (metadata, headings, images, links,
 * performance, accessibility, business signals and visual analysis), keeps the
 * three to five with the strongest business impact per unit of effort, and
 * frames them the way a senior consultant would: hedged, specific, actionable.
 *
 * Relevance is decided once, in the shared recommendation context, so every
 * section of the report applies exactly the same contextual rules.
 */

import {
  assessTopic,
  buildRecommendationContext,
  topicForText,
  type RecommendationContext,
} from "@/lib/analysis/recommendation-context";
import type { SiteClassification } from "@/lib/analysis/site-category";

import type {
  CategoryId,
  DashboardReport,
  Recommendation,
  RecommendationDifficulty,
  RecommendationPriority,
} from "@/lib/dashboard/types";

export type PriorityEffort = "Easy" | "Moderate" | "Hard";

export type PriorityRecommendation = {
  id: string;
  category: CategoryId;
  title: string;
  /** What was actually observed on the page. */
  evidence: string[];
  whyItMatters: string;
  priority: RecommendationPriority;
  effort: PriorityEffort;
  estimatedTime: string;
  suggestedFix: string[];
  estimatedGain: number;
  /** Business impact per unit of effort — drives the ranking. */
  impactScore: number;
  /** Why this ranked where it did for this kind of website. */
  contextNote: string | null;
  /** Why this recommendation applies to this website at all. */
  relevanceNote: string;
};

export type ExpectedImpact = {
  label: string;
  detail: string;
  icon: "search" | "gauge" | "shield" | "smartphone" | "accessibility";
};

export type PriorityRecommendationsView = {
  items: PriorityRecommendation[];
  /** Highest impact for the lowest effort — the one to start with. */
  doThisFirst: PriorityRecommendation | null;
  expectedImpact: ExpectedImpact[];
  /** Shown when nothing measurable came back. */
  emptyReason: string | null;
  /** The kind of website these priorities were tuned for. */
  classification: SiteClassification;
  /** How the ranking was tuned for that kind of website. */
  focus: string;
};

const EFFORT_FROM_DIFFICULTY: Record<RecommendationDifficulty, PriorityEffort> = {
  Easy: "Easy",
  Moderate: "Moderate",
  Advanced: "Hard",
};

const EFFORT_COST: Record<PriorityEffort, number> = { Easy: 1, Moderate: 1.6, Hard: 2.6 };
const PRIORITY_WEIGHT: Record<RecommendationPriority, number> = { high: 3, medium: 2, low: 1 };
const IMPACT_WEIGHT = { High: 3, Medium: 2, Low: 1 } as const;

const EXPECTED_IMPACT: Record<CategoryId, ExpectedImpact> = {
  seo: {
    label: "Better search visibility",
    detail: "Clearer signals for search engines could improve how this page is found and clicked.",
    icon: "search",
  },
  performance: {
    label: "Faster load time",
    detail: "Lighter, less blocking page delivery may reduce the wait before content appears.",
    icon: "gauge",
  },
  business: {
    label: "Higher trust",
    detail: "Stronger proof, pricing and contact signals could make the offer easier to believe.",
    icon: "shield",
  },
  design: {
    label: "Better mobile usability",
    detail: "A clearer layout and focal point may help small-screen visitors act sooner.",
    icon: "smartphone",
  },
  accessibility: {
    label: "Improved accessibility",
    detail: "Better labelling and structure could make the page usable by more people.",
    icon: "accessibility",
  },
};

function toPriorityItem(
  item: Recommendation,
  context: RecommendationContext,
  relevanceNote: string,
): PriorityRecommendation {
  const effort = EFFORT_FROM_DIFFICULTY[item.difficulty];
  const topic = topicForText(`${item.title} ${item.description}`);
  const { rule, strength, classification } = context;

  const base =
    ((item.estimatedGain + 1) * PRIORITY_WEIGHT[item.priority] * IMPACT_WEIGHT[item.impact]) /
    EFFORT_COST[effort];

  let multiplier = 1;
  let contextNote: string | null = null;
  const label = context.utility ? "utility / dashboard" : classification.label.toLowerCase();

  if (rule.boostCategories.includes(item.category) || rule.boostTopics.includes(topic)) {
    multiplier += 0.45 * strength;
    contextNote = `Raised for a ${label} site, based on the signals observed during this analysis.`;
  }
  if (rule.dampTopics.includes(topic)) {
    multiplier -= 0.35 * strength;
    contextNote = `Kept lower for a ${label} site — other observed issues appear to matter more here.`;
  }

  return {
    id: item.id,
    category: item.category,
    title: item.title,
    evidence: item.evidence.length ? item.evidence : ["Not detected during this analysis."],
    whyItMatters: item.whyItMatters,
    priority: item.priority,
    effort,
    estimatedTime: item.estimatedTime,
    suggestedFix: item.howToFix,
    estimatedGain: item.estimatedGain,
    impactScore: Math.round(base * multiplier * 10) / 10,
    contextNote,
    relevanceNote,
  };
}

export function buildPriorityRecommendations(
  report: DashboardReport,
  classificationInput?: SiteClassification,
): PriorityRecommendationsView {
  const context =
    classificationInput || !report.context
      ? buildRecommendationContext(report.evidence, classificationInput)
      : report.context;

  const ranked = report.recommendations
    .flatMap((item) => {
      const applicability = assessTopic(context, topicForText(`${item.title} ${item.description}`));
      if (!applicability.applicable) return [];
      return [toPriorityItem(item, context, applicability.reason)];
    })
    .sort((a, b) => b.impactScore - a.impactScore);

  if (!ranked.length) {
    return {
      items: [],
      doThisFirst: null,
      expectedImpact: [],
      emptyReason: report.evidence
        ? "No blocking issues were detected during this analysis, so there is nothing to prioritise right now."
        : "This analysis was saved before evidence collection, so priorities could not be derived. Re-running the analysis would rebuild them.",
      classification: context.classification,
      focus: context.focus,
    };
  }

  const items = ranked.slice(0, Math.min(5, Math.max(3, ranked.length)));

  // "Do this first": among the strongest candidates, the cheapest to act on.
  const doThisFirst =
    [...items]
      .sort(
        (a, b) => EFFORT_COST[a.effort] - EFFORT_COST[b.effort] || b.impactScore - a.impactScore,
      )
      .at(0) ?? null;

  const categories = Array.from(new Set(items.map((item) => item.category)));
  const expectedImpact = categories.map((category) => EXPECTED_IMPACT[category]);

  return {
    items,
    doThisFirst,
    expectedImpact,
    emptyReason: null,
    classification: context.classification,
    focus: context.focus,
  };
}
