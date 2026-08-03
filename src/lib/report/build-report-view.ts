import { STATUS_LABEL, statusForScore } from "@/lib/dashboard/scoring";
import type { DashboardReport, Recommendation } from "@/lib/dashboard/types";

/**
 * Report view model.
 *
 * Derived entirely from the existing DashboardReport — no analysis logic is
 * duplicated here. This layer only re-frames the same findings as a
 * client-ready document: an executive summary, celebrated strengths, tiered
 * opportunities and a roadmap.
 */

export type ReportStrength = {
  id: string;
  title: string;
  explanation: string;
  businessValue: string;
};

export type ImprovementTier = "quick-win" | "medium" | "long-term";

export type ImprovementItem = Recommendation & {
  tier: ImprovementTier;
  expectedResult: string;
};

export type ReportView = {
  summary: string[];
  strengths: ReportStrength[];
  improvements: Array<{
    tier: ImprovementTier;
    label: string;
    description: string;
    items: ImprovementItem[];
  }>;
};

const TIER_BY_DIFFICULTY: Record<Recommendation["difficulty"], ImprovementTier> = {
  Easy: "quick-win",
  Moderate: "medium",
  Advanced: "long-term",
};

export const TIER_META: Record<ImprovementTier, { label: string; description: string }> = {
  "quick-win": {
    label: "Quick Wins",
    description: "Small changes you can make this week for a visible difference.",
  },
  medium: {
    label: "Medium Priority",
    description: "Worthwhile improvements that need a little planning.",
  },
  "long-term": {
    label: "Long-Term Improvements",
    description: "Deeper work that pays off over the coming months.",
  },
};

const EXPECTED_RESULT: Record<Recommendation["impact"], string> = {
  High: "A clear lift in how many visitors take the next step.",
  Medium: "A steady improvement visitors will notice over time.",
  Low: "A small polish that makes the experience feel more considered.",
};

const BUSINESS_VALUE: Record<string, string> = {
  design: "Visitors understand the offer faster and stay longer.",
  performance: "Fewer people leave before the page becomes usable.",
  seo: "More of the right people find the site through search.",
  accessibility: "More visitors can complete key tasks without friction.",
  business: "More visits turn into enquiries and sales.",
};

function ordered(report: DashboardReport) {
  return [...report.categories].sort((a, b) => b.score - a.score);
}

function summaryFor(report: DashboardReport): string[] {
  const ranked = ordered(report);
  const best = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const status = STATUS_LABEL[statusForScore(report.overallScore)].toLowerCase();
  const opening = report.understanding
    ? report.understanding.summary
    : `${report.siteName} was analyzed at ${report.displayUrl}.`;

  return [
    `${opening} On the evidence collected from the page, it scores ${report.overallScore} out of 100 overall, which we read as ${status}.`,
    `The strongest area is ${best?.label.toLowerCase()} at ${best?.score} — ${best?.biggestFactor ?? best?.summary}. ` +
      `The area with the most room to grow is ${weakest?.label.toLowerCase()} at ${weakest?.score}: ${weakest?.biggestFactor ?? weakest?.summary}`,
    weakest
      ? `Nothing here needs a rebuild. ${weakest.whatWouldImprove} Working through the quick wins first, then the medium-priority items, should move ${report.siteName} into a stronger position without disrupting what already works.`
      : `Re-run this analysis to collect page evidence and see specific actions.`,
  ];
}

function strengthsFor(report: DashboardReport): ReportStrength[] {
  const fromCategories = ordered(report)
    .flatMap((category) =>
      category.factors
        .filter((factor) => factor.verdict === "pass")
        .slice(0, 1)
        .map((factor) => ({
          id: `category-${category.id}`,
          title: `${category.label} — ${factor.label}`,
          explanation: factor.detail,
          businessValue: BUSINESS_VALUE[category.id] ?? "A better experience for every visitor.",
        })),
    )
    .slice(0, 4);

  const fromBusiness = report.business
    .filter((metric) => statusForScore(metric.score) !== "needs-improvement")
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((metric) => ({
      id: `business-${metric.id}`,
      title: `${metric.label} is working well`,
      explanation: metric.evidence,
      businessValue: "Visitors get what they need here without extra effort.",
    }));

  return [...fromCategories, ...fromBusiness];
}


const PRIORITY_WEIGHT: Record<Recommendation["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function buildReportView(report: DashboardReport): ReportView {
  const items: ImprovementItem[] = [...report.recommendations]
    .sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority])
    .map((recommendation) => ({
      ...recommendation,
      tier: TIER_BY_DIFFICULTY[recommendation.difficulty],
      expectedResult: EXPECTED_RESULT[recommendation.impact],
    }));

  const tiers: ImprovementTier[] = ["quick-win", "medium", "long-term"];

  return {
    summary: summaryFor(report),
    strengths: strengthsFor(report),
    improvements: tiers
      .map((tier) => ({
        tier,
        ...TIER_META[tier],
        items: items.filter((item) => item.tier === tier),
      }))
      .filter((group) => group.items.length > 0),
  };
}

/** Roadmap lanes: the same recommendations, grouped by urgency instead of effort. */
export function roadmapFor(report: DashboardReport) {
  return [
    {
      id: "high",
      label: "High Priority",
      caption: "Start here",
      items: report.recommendations.filter((item) => item.priority === "high"),
    },
    {
      id: "medium",
      label: "Medium Priority",
      caption: "Next",
      items: report.recommendations.filter((item) => item.priority === "medium"),
    },
    {
      id: "future",
      label: "Future Improvements",
      caption: "Later",
      items: report.recommendations.filter((item) => item.priority === "low"),
    },
  ].filter((lane) => lane.items.length > 0);
}
