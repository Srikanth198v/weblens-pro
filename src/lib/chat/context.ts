/**
 * Ask WebLens AI — report context.
 *
 * Turns the dashboard report into a compact, factual brief the assistant can
 * answer from. Nothing here invents a finding: every line is copied from the
 * measured report, including which checks were marked "Not applicable" for the
 * detected kind of website.
 */

import type { DashboardReport } from "@/lib/dashboard/types";
import { buildPriorityRecommendations } from "@/lib/dashboard/priority-recommendations";

export type AskReportContext = {
  url: string;
  siteName: string;
  completedAt: string;
  overallScore: number;
  scores: { label: string; score: number; weight: number }[];
  classification: {
    primary: string;
    secondary: string[];
    confidence: number;
    signals: string[];
    focus: string;
  };
  understanding: string[];
  confidence: { score: number; sourcesUsed: string[]; sourcesMissing: string[] };
  evidence: string[];
  problems: string[];
  business: { label: string; score: number; evidence: string; notApplicable: string | null }[];
  recommendations: {
    title: string;
    category: string;
    priority: string;
    impact: string;
    difficulty: string;
    estimatedTime: string;
    evidence: string[];
    fixes: string[];
  }[];
  priorities: { title: string; priority: string; effort: string; evidence: string[]; fixes: string[] }[];
  notApplicable: string[];
};

function clip(list: string[], max: number): string[] {
  return list.filter(Boolean).slice(0, max);
}

export function buildAskContext(report: DashboardReport): AskReportContext {
  const priorities = buildPriorityRecommendations(report);
  const evidence = report.evidence;

  const measured = clip(
    [
      `Final URL: ${evidence?.finalUrl ?? report.url}`,
      evidence ? `HTTPS: ${evidence.secure ? "yes" : "no"}` : "",
      evidence ? `HTML download time: ${evidence.fetchMs}ms` : "",
      evidence ? `Page title: ${evidence.metadata.title ?? "missing"}` : "",
      evidence ? `Meta description: ${evidence.metadata.description ?? "missing"}` : "",
      evidence ? `H1 count: ${evidence.headings.h1.length}, headings total: ${evidence.headings.total}` : "",
      evidence ? `Images: ${evidence.images.total}, missing alt: ${evidence.images.missingAlt}` : "",
      evidence ? `Links: ${evidence.links.total} (internal ${evidence.links.internal})` : "",
      evidence ? `Viewport meta: ${evidence.document.hasViewport ? "present" : "missing"}` : "",
      evidence ? `Structured data: ${evidence.structuredData.present ? evidence.structuredData.types.join(", ") || "present" : "none"}` : "",
      evidence ? `Render-blocking scripts: ${evidence.scripts.renderBlocking}` : "",
      evidence ? `Word count: ${evidence.content.wordCount}` : "",
    ],
    20,
  );

  const problems = clip(
    report.categories.flatMap((category) =>
      category.weaknesses.map((item) => `${category.label}: ${item}`),
    ),
    16,
  );

  return {
    url: report.url,
    siteName: report.siteName,
    completedAt: report.completedAt,
    overallScore: report.overallScore,
    scores: report.breakdown.map((item) => ({
      label: item.label,
      score: item.score,
      weight: item.weight,
    })),
    classification: {
      primary: report.context.classification.label,
      secondary: report.context.classification.secondaryCategories,
      confidence: report.context.classification.confidence,
      signals: clip(report.context.classification.signals, 8),
      focus: report.context.focus,
    },
    understanding: clip(
      [
        report.understanding?.summary ?? "",
        report.understanding?.industry ? `Industry: ${report.understanding.industry}` : "",
        report.understanding?.audience ? `Audience: ${report.understanding.audience}` : "",
        report.understanding?.primaryGoal ? `Primary goal: ${report.understanding.primaryGoal}` : "",
        report.understanding?.primaryCta ? `Primary CTA: ${report.understanding.primaryCta}` : "",
      ],
      6,
    ),
    confidence: {
      score: report.confidence.score,
      sourcesUsed: report.confidence.sources.filter((s) => s.used).map((s) => s.label),
      sourcesMissing: report.confidence.sources.filter((s) => !s.used).map((s) => s.label),
    },
    evidence: measured,
    problems,
    business: report.business.map((metric) => ({
      label: metric.label,
      score: metric.score,
      evidence: metric.evidence,
      notApplicable: metric.applicable ? null : metric.notApplicableReason,
    })),
    recommendations: report.recommendations.slice(0, 12).map((item) => ({
      title: item.title,
      category: item.category,
      priority: item.priority,
      impact: item.impact,
      difficulty: item.difficulty,
      estimatedTime: item.estimatedTime,
      evidence: clip(item.evidence, 3),
      fixes: clip(item.howToFix, 3),
    })),
    priorities: priorities.items.slice(0, 6).map((item) => ({
      title: item.title,
      priority: item.priority,
      effort: item.effort,
      evidence: clip(item.evidence, 3),
      fixes: clip(item.suggestedFix, 3),
    })),
    notApplicable: report.business
      .filter((metric) => !metric.applicable && metric.notApplicableReason)
      .map((metric) => `${metric.label}: ${metric.notApplicableReason}`),
  };
}
