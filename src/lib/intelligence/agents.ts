/**
 * Multi-agent intelligence (Phase 9).
 *
 * Six specialist "agents" read the same evidence-backed report from different
 * professional angles. Nothing here invents a finding: each verdict, strength,
 * opportunity and action is derived from a measurement already present in the
 * report. Where a signal is missing, the agent says so explicitly.
 */

import { filterApplicableText } from "@/lib/analysis/recommendation-context";
import type { CategoryDetail, CategoryId, DashboardReport } from "@/lib/dashboard/types";

export const NO_EVIDENCE = "Not enough evidence collected during this analysis.";

export type AgentId =
  | "seo"
  | "ux"
  | "accessibility"
  | "performance"
  | "copywriting"
  | "business";

export type SpecialistAgent = {
  id: AgentId;
  name: string;
  role: string;
  /** Icon key resolved by the presentation layer. */
  icon: "search" | "layout" | "accessibility" | "gauge" | "pen-line" | "briefcase";
  verdict: string;
  confidence: number;
  score: number | null;
  strengths: string[];
  opportunities: string[];
  highestImpactAction: string;
  /** Category this agent's priority maps to, used for the agreement score. */
  priorityCategory: CategoryId;
};

export type MasterSynthesis = {
  working: string[];
  limiting: string[];
  fixFirst: string;
  businessImpact: string;
  agreementScore: number;
  agreementNote: string;
  topPriorityLabel: string;
};

export type AgentPanel = {
  agents: SpecialistAgent[];
  synthesis: MasterSynthesis;
};

function byId(report: DashboardReport, id: CategoryId): CategoryDetail | undefined {
  return report.categories.find((category) => category.id === id);
}

function take(list: string[], count: number, fallback: string): string[] {
  const cleaned = list.filter(Boolean).slice(0, count);
  return cleaned.length ? cleaned : [fallback];
}

function confidenceFor(report: DashboardReport, signals: number): number {
  const base = report.evidenceReport?.confidence ?? report.confidence.score;
  return Math.max(40, Math.min(96, Math.round(base * 0.7 + Math.min(signals, 4) * 7)));
}

function verdictFor(label: string, category: CategoryDetail | undefined): string {
  if (!category || !category.factors.length) return NO_EVIDENCE;
  if (category.score >= 85) return `${label} is a genuine strength — ${category.summary}`;
  if (category.score >= 70) return `${label} is solid with clear headroom — ${category.summary}`;
  if (category.score >= 50) return `${label} is holding the site back — ${category.biggestFactor}`;
  return `${label} needs attention before anything else — ${category.biggestFactor}`;
}

function actionFor(
  report: DashboardReport,
  category: CategoryId,
  fallbackCategory: CategoryDetail | undefined,
): string {
  const match = report.recommendations
    .filter((item) => item.category === category)
    .sort((a, b) => b.estimatedGain - a.estimatedGain)[0];

  if (match) {
    return `${match.title} — ${match.howToFix[0] ?? match.description} (${match.difficulty}, ${match.estimatedTime}).`;
  }
  return fallbackCategory?.whatWouldImprove ?? NO_EVIDENCE;
}

function buildAgent(
  report: DashboardReport,
  config: {
    id: AgentId;
    name: string;
    role: string;
    icon: SpecialistAgent["icon"];
    category: CategoryId;
    extraStrengths?: string[];
    extraOpportunities?: string[];
    label: string;
  },
): SpecialistAgent {
  const category = byId(report, config.category);
  const strengths = [...(config.extraStrengths ?? []), ...(category?.strengths ?? [])];
  const opportunities = filterApplicableText(report.context, [
    ...(config.extraOpportunities ?? []),
    ...(category?.weaknesses ?? []),
  ]);
  const signals = strengths.length + opportunities.length;

  return {
    id: config.id,
    name: config.name,
    role: config.role,
    icon: config.icon,
    verdict: verdictFor(config.label, category),
    confidence: confidenceFor(report, signals),
    score: category?.factors.length ? category.score : null,
    strengths: take(strengths, 2, NO_EVIDENCE),
    opportunities: take(opportunities, 2, NO_EVIDENCE),
    highestImpactAction: actionFor(report, config.category, category),
    priorityCategory: config.category,
  };
}

function copywritingAgent(report: DashboardReport): SpecialistAgent {
  const evidence = report.evidence;
  const understanding = report.understanding;
  const strengths: string[] = [];
  const opportunities: string[] = [];

  if (evidence) {
    const { content, metadata, headings } = evidence;
    if (content.headline) strengths.push(`The page leads with a clear headline: "${content.headline}".`);
    if (content.ctas.length)
      strengths.push(
        `${content.ctas.length} call-to-action label${content.ctas.length === 1 ? "" : "s"} found on the page, starting with "${content.ctas[0]}".`,
      );
    if (content.wordCount >= 300)
      strengths.push(`${content.wordCount} words of copy — enough for a visitor to understand the offer.`);
    if (content.hasTestimonials) strengths.push("Testimonial copy is present, which supports the claims made.");

    if (content.wordCount < 300)
      opportunities.push(
        `Only ${content.wordCount} words of copy were found — too little for a visitor or a search engine to judge the offer.`,
      );
    if (!content.ctas.length)
      opportunities.push("No call-to-action text was found, so the page never asks the visitor to do anything.");
    if (!metadata.description)
      opportunities.push("No meta description, so the search snippet is written by the engine, not by you.");
    if (!headings.h1.length)
      opportunities.push("No H1 was found, so the page has no single written promise at the top.");
    else if (headings.h1.length > 1)
      opportunities.push(`${headings.h1.length} H1 headings compete for the page's main message.`);
    if (!content.hasTestimonials)
      opportunities.push("No testimonial or proof copy was found to back up the claims on the page.");
  }

  if (understanding?.positioning) strengths.push(understanding.positioning);

  // Suppress advice that does not apply to this kind of website (for example
  // proof copy on a global brand page with no commercial signals).
  const applicable = filterApplicableText(report.context, opportunities);
  opportunities.length = 0;
  opportunities.push(...applicable);

  const signals = strengths.length + opportunities.length;
  const verdict = !evidence
    ? NO_EVIDENCE
    : opportunities.length === 0
      ? "The written message is doing its job — the promise, proof and ask are all on the page."
      : `The copy is readable, but ${opportunities[0]!.charAt(0).toLowerCase()}${opportunities[0]!.slice(1)}`;

  const action = !evidence
    ? NO_EVIDENCE
    : !opportunities.length
      ? "The written message is already carrying its weight — keep it as the standard for new pages."
    : !evidence.content.ctas.length
      ? "Add one explicit primary action in the hero, written as the visitor's next step (for example \"Book a call\"), and repeat it once near the foot of the page."
      : !evidence.metadata.description
        ? "Write a 140–160 character meta description that names the offer and the audience, so the search snippet sells rather than samples."
        : evidence.content.wordCount < 300
          ? "Expand the page to at least 300 words covering what you do, who it is for, and what happens next."
          : `Lead with the strongest proof you already have${evidence.content.hasTestimonials ? " — move a testimonial above the fold" : " and add one concrete customer result near the primary action"}.`;

  return {
    id: "copywriting",
    name: "Copywriting Expert",
    role: "Message clarity and persuasion",
    icon: "pen-line",
    verdict,
    confidence: confidenceFor(report, signals),
    score: byId(report, "business")?.score ?? null,
    strengths: take(strengths, 2, NO_EVIDENCE),
    opportunities: take(opportunities, 2, NO_EVIDENCE),
    highestImpactAction: action,
    priorityCategory: "business",
  };
}

/** Builds all six specialists plus the master synthesis. */
export function buildAgentPanel(report: DashboardReport): AgentPanel {
  const agents: SpecialistAgent[] = [
    buildAgent(report, {
      id: "seo",
      name: "SEO Expert",
      role: "Discoverability and search readiness",
      icon: "search",
      category: "seo",
      label: "Search readiness",
    }),
    buildAgent(report, {
      id: "ux",
      name: "UX Designer",
      role: "Structure, hierarchy and first impression",
      icon: "layout",
      category: "design",
      label: "The on-page experience",
    }),
    buildAgent(report, {
      id: "accessibility",
      name: "Accessibility Expert",
      role: "Inclusive, usable-by-everyone markup",
      icon: "accessibility",
      category: "accessibility",
      label: "Accessibility",
    }),
    buildAgent(report, {
      id: "performance",
      name: "Performance Engineer",
      role: "Speed and delivery weight",
      icon: "gauge",
      category: "performance",
      label: "Page performance",
    }),
    copywritingAgent(report),
    buildAgent(report, {
      id: "business",
      name: "Business Consultant",
      role: "Conversion and commercial signals",
      icon: "briefcase",
      category: "business",
      label: "The site as a business asset",
    }),
  ];

  return { agents, synthesis: synthesize(report, agents) };
}

function synthesize(report: DashboardReport, agents: SpecialistAgent[]): MasterSynthesis {
  const scored = report.categories.filter((category) => category.factors.length > 0);

  if (!scored.length) {
    return {
      working: [NO_EVIDENCE],
      limiting: [NO_EVIDENCE],
      fixFirst: NO_EVIDENCE,
      businessImpact: NO_EVIDENCE,
      agreementScore: 0,
      agreementNote: NO_EVIDENCE,
      topPriorityLabel: "Unknown",
    };
  }

  const ranked = [...scored].sort((a, b) => a.score - b.score);
  const weakest = ranked[0]!;
  const strongest = ranked[ranked.length - 1]!;

  // Each agent votes for the area it considers its own biggest constraint.
  const votes = new Map<CategoryId, number>();
  for (const agent of agents) {
    const category = report.categories.find((item) => item.id === agent.priorityCategory);
    if (!category || !category.factors.length) continue;
    // An agent only votes when its own area scores at or below the median.
    const median = ranked[Math.floor(ranked.length / 2)]!.score;
    if (category.score <= median) votes.set(category.id, (votes.get(category.id) ?? 0) + 1);
  }

  const totalVotes = [...votes.values()].reduce((sum, value) => sum + value, 0);
  const topVote = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
  const topCategory = topVote
    ? (report.categories.find((item) => item.id === topVote[0]) ?? weakest)
    : weakest;

  const share = totalVotes ? (topVote?.[1] ?? 0) / totalVotes : 0;
  const gap = Math.max(0, strongest.score - weakest.score);
  const agreementScore = Math.max(
    35,
    Math.min(98, Math.round(share * 60 + Math.min(gap, 40) * 0.7 + 20)),
  );

  const working = report.categories
    .filter((category) => category.factors.length && category.score >= 70)
    .slice(0, 3)
    .flatMap((category) => {
      const strength = category.strengths[0];
      return strength ? [`${category.label} (${category.score}/100) — ${strength}`] : [];
    });

  const limiting = ranked
    .filter((category) => category.score < 70)
    .slice(0, 3)
    .map((category) => `${category.label} (${category.score}/100) — ${category.biggestFactor}`);

  const topRecommendation = report.recommendations
    .filter((item) => item.category === topCategory.id)
    .sort((a, b) => b.estimatedGain - a.estimatedGain)[0];

  const gainPool = report.recommendations
    .filter((item) => item.priority === "high")
    .reduce((sum, item) => sum + item.estimatedGain, 0);

  return {
    working: working.length ? working : [NO_EVIDENCE],
    limiting: limiting.length
      ? limiting
      : ["No area scored below 70 on the evidence collected — the site has no single blocking weakness."],
    fixFirst: topRecommendation
      ? `${topRecommendation.title}. ${topRecommendation.whyItMatters} Expected gain: about ${topRecommendation.estimatedGain} points on the overall score (${topRecommendation.difficulty}, ${topRecommendation.estimatedTime}).`
      : `${topCategory.label}: ${topCategory.whatWouldImprove}`,
    businessImpact: topRecommendation
      ? topRecommendation.businessImpact
      : `Lifting ${topCategory.label.toLowerCase()} from ${topCategory.score} towards the level already reached in ${strongest.label.toLowerCase()} (${strongest.score}) would move the overall score by roughly ${Math.max(1, Math.round(((strongest.score - topCategory.score) * 0.2)))} points.`,
    agreementScore,
    agreementNote: `${topCategory.label} is the clearest shared priority across the six specialists${
      gainPool ? `, with about ${gainPool} points of scoring headroom in the high-priority actions` : ""
    }.`,
    topPriorityLabel: topCategory.label,
  };
}
