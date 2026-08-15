/**
 * Phase 11 — Smart, evidence-based priority recommendations.
 *
 * This layer never invents advice. It re-ranks the recommendations that were
 * already derived from measured evidence (metadata, headings, images, links,
 * performance, accessibility, business signals and visual analysis), keeps the
 * three to five with the strongest business impact per unit of effort, and
 * frames them the way a senior consultant would: hedged, specific, actionable.
 */

import { classifySite, type SiteCategoryId, type SiteClassification } from "@/lib/analysis/site-category";
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

/**
 * Topics let us tune advice to the kind of website that was detected without
 * ever inventing a finding — a topic only matches text that came from a
 * measured recommendation.
 */
type Topic =
  | "testimonials"
  | "pricing"
  | "cta"
  | "contact"
  | "navigation"
  | "media"
  | "title-length"
  | "readability"
  | "mobile"
  | "search"
  | "forms"
  | "schema"
  | "i18n"
  | "other";

const TOPIC_PATTERNS: Array<{ topic: Topic; pattern: RegExp }> = [
  { topic: "testimonials", pattern: /testimonial|review|social proof|customer proof|case stud/i },
  { topic: "schema", pattern: /structured data|schema|json-?ld|rich result|microdata/i },
  { topic: "i18n", pattern: /language|hreflang|localis|localiz|internationalis|internationaliz|region|locale/i },
  { topic: "pricing", pattern: /pricing|price|plans?\b/i },
  { topic: "cta", pattern: /call to action|cta|conversion|sign[- ]?up|primary action/i },
  { topic: "contact", pattern: /contact|phone|address|enquir|inquir/i },
  { topic: "navigation", pattern: /navigation|internal link|menu|structure of the page|sitemap/i },
  { topic: "media", pattern: /image|media|lazy|dimension|format|screenshot|video/i },
  { topic: "title-length", pattern: /title (tag|length)|meta title|shorten the title|description length/i },
  { topic: "readability", pattern: /heading|readab|content length|word count|copy/i },
  { topic: "mobile", pattern: /mobile|viewport|small screen|touch/i },
  { topic: "search", pattern: /search|discover|find (products|content)/i },
  { topic: "forms", pattern: /form|input|label|field/i },
];


function topicOf(item: Recommendation): Topic {
  const text = `${item.title} ${item.description}`;
  return TOPIC_PATTERNS.find((entry) => entry.pattern.test(text))?.topic ?? "other";
}

type ContextRule = {
  /** Areas that matter most for this kind of website. */
  boostCategories: CategoryId[];
  boostTopics: Topic[];
  /** Advice that is usually noise for this kind of website. */
  dampTopics: Topic[];
  /** Advice that does not apply to this kind of website at all. */
  dropTopics: Topic[];
  /**
   * Topics that are only shown when the page itself carries evidence that the
   * site operates that way — never because something is simply missing.
   */
  gatedTopics?: Topic[];
  focus: string;
};

/** Signals that a site is genuinely selling something on this page. */
function hasCommercialEvidence(evidence: SiteEvidence | null): boolean {
  if (!evidence) return false;
  return (
    evidence.content.hasPricingSection ||
    evidence.content.hasTestimonials ||
    evidence.links.hasPricing ||
    evidence.structuredData.types.some((type) => /product|offer|service|store/i.test(type))
  );
}

/** Signals that direct contact is part of how this site converts. */
function hasContactEvidence(evidence: SiteEvidence | null): boolean {
  if (!evidence) return false;
  return (
    evidence.content.hasContactDetails ||
    evidence.links.mailto > 0 ||
    evidence.links.tel > 0
  );
}

type Relevance = { relevant: boolean; reason: string };

/**
 * Decides whether an observed recommendation actually applies to this kind of
 * website. Missing-by-default advice is suppressed instead of being forced in.
 */
function assessRelevance(
  topic: Topic,
  rule: ContextRule,
  classification: SiteClassification,
  evidence: SiteEvidence | null,
): Relevance {
  const label = classification.label.toLowerCase();

  if (!rule.gatedTopics?.includes(topic)) {
    return { relevant: true, reason: `Applies to a ${label} site based on the evidence collected here.` };
  }

  if (topic === "contact") {
    return hasContactEvidence(evidence)
      ? { relevant: true, reason: "Contact details were detected on the page, so this path is already part of how the site converts." }
      : { relevant: false, reason: "" };
  }

  return hasCommercialEvidence(evidence)
    ? {
        relevant: true,
        reason: `Commercial signals (pricing, offers or customer proof) were detected during this analysis, so this applies to a ${label} site.`,
      }
    : { relevant: false, reason: "" };
}


const DEFAULT_RULE: ContextRule = {
  boostCategories: [],
  boostTopics: [],
  dampTopics: [],
  dropTopics: [],
  focus: "Priorities are balanced across every area measured during this analysis.",
};

const CONTEXT_RULES: Partial<Record<SiteCategoryId, ContextRule>> = {
  enterprise: {
    boostCategories: ["performance", "accessibility"],
    boostTopics: ["navigation", "media", "schema", "i18n", "mobile"],
    dampTopics: [],
    dropTopics: ["testimonials", "pricing", "title-length"],
    focus:
      "Weighted towards performance, accessibility, structured data, media delivery, navigation clarity and internationalisation.",
  },

  saas: {
    boostCategories: ["business", "design"],
    boostTopics: ["cta", "pricing", "testimonials"],
    dampTopics: ["contact"],
    dropTopics: [],
    focus: "Weighted towards onboarding, value proposition, CTA hierarchy, pricing clarity and social proof.",
  },
  ecommerce: {
    boostCategories: ["performance", "business"],
    boostTopics: ["search", "media", "mobile", "cta"],
    dampTopics: ["readability"],
    dropTopics: [],
    focus: "Weighted towards product discovery, search, trust signals, checkout flow and mobile conversion.",
  },
  local: {
    boostCategories: ["business"],
    boostTopics: ["contact", "testimonials", "pricing", "mobile"],
    dampTopics: [],
    dropTopics: [],
    focus: "Weighted towards contact details, hours, location, pricing transparency and trust signals.",
  },
  content: {
    boostCategories: ["seo", "performance"],
    boostTopics: ["readability", "navigation", "search"],
    dampTopics: ["pricing", "testimonials"],
    dropTopics: [],
    focus: "Weighted towards readability, article structure, internal linking, search and page speed.",
  },
  utility: {
    boostCategories: ["accessibility", "performance", "design"],
    boostTopics: ["forms", "cta", "mobile"],
    dampTopics: ["testimonials", "pricing"],
    dropTopics: [],
    focus: "Weighted towards task completion, clarity of actions, mobile usability, performance and accessibility.",
  },
  marketplace: {
    boostCategories: ["business", "performance"],
    boostTopics: ["search", "navigation", "mobile"],
    dampTopics: [],
    dropTopics: [],
    focus: "Weighted towards listing discovery, search, trust signals and mobile flow.",
  },
  community: {
    boostCategories: ["performance", "accessibility"],
    boostTopics: ["navigation", "readability", "search"],
    dampTopics: ["pricing"],
    dropTopics: [],
    focus: "Weighted towards navigation, readability, search and page speed.",
  },
  nonprofit: {
    boostCategories: ["accessibility", "business"],
    boostTopics: ["cta", "contact", "readability"],
    dampTopics: ["pricing"],
    dropTopics: [],
    focus: "Weighted towards clarity of the main action, accessibility and trust signals.",
  },
  portfolio: {
    boostCategories: ["design", "performance"],
    boostTopics: ["media", "contact", "cta"],
    dampTopics: ["pricing"],
    dropTopics: [],
    focus: "Weighted towards presentation, media delivery and how easily someone can get in touch.",
  },
};

function toPriorityItem(
  item: Recommendation,
  rule: ContextRule,
  classification: SiteClassification,
  strength: number,
): PriorityRecommendation {
  const effort = EFFORT_FROM_DIFFICULTY[item.difficulty];
  const topic = topicOf(item);

  const base =
    ((item.estimatedGain + 1) * PRIORITY_WEIGHT[item.priority] * IMPACT_WEIGHT[item.impact]) /
    EFFORT_COST[effort];



  let multiplier = 1;
  let contextNote: string | null = null;

  if (rule.boostCategories.includes(item.category) || rule.boostTopics.includes(topic)) {
    multiplier += 0.45 * strength;
    contextNote = `Raised for a ${classification.label.toLowerCase()} site, based on the signals observed during this analysis.`;
  }
  if (rule.dampTopics.includes(topic)) {
    multiplier -= 0.35 * strength;
    contextNote = `Kept lower for a ${classification.label.toLowerCase()} site — other observed issues appear to matter more here.`;
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
  };
}

export function buildPriorityRecommendations(
  report: DashboardReport,
  classificationInput?: SiteClassification,
): PriorityRecommendationsView {
  const classification = classificationInput ?? classifySite(report.evidence);

  // Enterprise rules apply from 50% confidence upwards; every other category
  // waits for the usual 70% threshold before tuning kicks in.
  const enterpriseTuned =
    classification.category === "enterprise" && classification.confidence >= 50;
  const tuned = enterpriseTuned || !classification.conservative;

  const rule = (tuned && CONTEXT_RULES[classification.category]) || DEFAULT_RULE;
  const strength = tuned ? 1 : 0.4;

  const source = tuned
    ? report.recommendations.filter((item) => !rule.dropTopics.includes(topicOf(item)))
    : report.recommendations;

  const ranked = source
    .map((item) => toPriorityItem(item, rule, classification, strength))
    .sort((a, b) => b.impactScore - a.impactScore);


  if (!ranked.length) {
    return {
      items: [],
      doThisFirst: null,
      expectedImpact: [],
      emptyReason: report.evidence
        ? "No blocking issues were detected during this analysis, so there is nothing to prioritise right now."
        : "This analysis was saved before evidence collection, so priorities could not be derived. Re-running the analysis would rebuild them.",
      classification,
      focus: DEFAULT_RULE.focus,
    };
  }

  const items = ranked.slice(0, Math.min(5, Math.max(3, ranked.length)));

  // "Do this first": among the strongest candidates, the cheapest to act on.
  const doThisFirst =
    [...items]
      .sort(
        (a, b) =>
          EFFORT_COST[a.effort] - EFFORT_COST[b.effort] || b.impactScore - a.impactScore,
      )
      .at(0) ?? null;

  const categories = Array.from(new Set(items.map((item) => item.category)));
  const expectedImpact = categories.map((category) => EXPECTED_IMPACT[category]);

  return { items, doThisFirst, expectedImpact, emptyReason: null, classification, focus: rule.focus };
}

