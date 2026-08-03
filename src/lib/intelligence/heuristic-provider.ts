import type {
  ConsultantRecommendation,
  IntelligenceHighlight,
  IntelligenceProvider,
  IntelligenceReport,
} from "@/lib/intelligence/types";
import type { CategoryDetail, DashboardReport, Recommendation } from "@/lib/dashboard/types";

/**
 * Default provider: evidence-driven, no network.
 *
 * Every sentence it produces quotes a measurement taken from the analyzed
 * page. Where a measurement is missing, the provider stays quiet rather than
 * filling the gap with generic advice.
 */

const CATEGORY_STAKE: Record<string, string> = {
  design: "how quickly a first-time visitor understands the page",
  performance: "how many visitors stay long enough to read it",
  seo: "how many of the right people ever find the page",
  accessibility: "how many visitors can actually use the page",
  business: "how many visits turn into enquiries",
};

const PRIORITY_BY_RECOMMENDATION: Record<
  Recommendation["priority"],
  ConsultantRecommendation["priority"]
> = {
  high: "critical",
  medium: "important",
  low: "helpful",
};

function confidenceFor(report: DashboardReport, evidenceCount: number): number {
  const base = report.confidence.score;
  return Math.max(55, Math.min(97, Math.round(base * 0.75 + Math.min(evidenceCount, 3) * 8)));
}

function briefingFor(report: DashboardReport, weakest: CategoryDetail, strongest: CategoryDetail) {
  const understanding = report.understanding;
  const opening = understanding
    ? understanding.summary.split(". ")[0] + "."
    : `${report.siteName} was analyzed on the evidence available from the homepage.`;

  return `${opening} On the evidence collected, ${strongest.label.toLowerCase()} is the strongest area at ${
    strongest.score
  }/100 — ${strongest.factors.find((f) => f.verdict === "pass")?.detail ?? strongest.summary}. The clearest constraint is ${weakest.label.toLowerCase()} at ${
    weakest.score
  }/100: ${weakest.biggestFactor}. Addressing that first would most affect ${
    CATEGORY_STAKE[weakest.id] ?? "how the page performs commercially"
  }.`;
}

export const heuristicIntelligence: IntelligenceProvider = {
  id: "evidence-v1",

  generate(report: DashboardReport): IntelligenceReport {
    const measured = report.categories.filter((category) => category.factors.length > 0);

    if (!measured.length || !report.evidence) {
      return {
        briefing:
          "This analysis was saved without page evidence, so there is nothing here we can responsibly interpret. Re-run the analysis to collect it.",
        highlights: [],
        recommendations: [],
        celebration: "",
        confidence: report.confidence,
      };
    }

    const ranked = [...measured].sort((a, b) => a.score - b.score);
    const weakest = ranked[0]!;
    const strongest = ranked[ranked.length - 1]!;

    const quickWin =
      report.recommendations.find((item) => item.difficulty === "Easy" && item.priority === "high") ??
      report.recommendations.find((item) => item.difficulty === "Easy");

    const strongestPass = strongest.factors.find((factor) => factor.verdict === "pass");

    const highlights: IntelligenceHighlight[] = [
      {
        kind: "top-opportunity",
        title: "Top Opportunity",
        subject: weakest.label,
        detail: weakest.whatWouldImprove,
        evidence: weakest.biggestFactor,
        score: weakest.score,
      },
      ...(quickWin
        ? [
            {
              kind: "quick-win" as const,
              title: "Quick Win",
              subject: quickWin.title,
              detail: `${quickWin.difficulty} · about ${quickWin.estimatedTime}`,
              evidence: quickWin.evidence[0] ?? "",
              score:
                report.categories.find((category) => category.id === quickWin.category)?.score ??
                report.overallScore,
            },
          ]
        : []),
      ...(strongestPass
        ? [
            {
              kind: "greatest-strength" as const,
              title: "Greatest Strength",
              subject: strongest.label,
              detail: `Nothing to change here — keep this as the standard for the rest of the site.`,
              evidence: strongestPass.detail,
              score: strongest.score,
            },
          ]
        : []),
    ];

    const recommendations: ConsultantRecommendation[] = report.recommendations
      .slice(0, 6)
      .map((item) => {
        const category = report.categories.find((entry) => entry.id === item.category);
        return {
          id: `intel-${item.id}`,
          title: item.title,
          priority: PRIORITY_BY_RECOMMENDATION[item.priority],
          businessImpact: `Affects ${CATEGORY_STAKE[item.category] ?? "the visitor experience"}.`,
          difficulty: item.difficulty,
          estimatedTime: item.estimatedTime,
          whyThisMatters: `${item.description} We saw this directly on the page: ${item.evidence[0]}${
            category ? `, which is what holds ${category.label.toLowerCase()} at ${category.score}/100` : ""
          }.`,
          recommendedAction: item.evidence.slice(1).length
            ? item.evidence.slice(1)
            : [item.description],
          evidence: item.evidence,
          confidence: confidenceFor(report, item.evidence.length),
        };
      });

    const celebration = strongestPass
      ? `${report.siteName} already gets ${strongest.label.toLowerCase()} right — ${strongestPass.detail.toLowerCase()}. Hold that standard while you lift the rest.`
      : `${report.siteName} has a workable foundation; the fixes below are all measurable and specific.`;

    return {
      briefing: briefingFor(report, weakest, strongest),
      highlights,
      recommendations,
      celebration,
      confidence: report.confidence,
    };
  },
};
