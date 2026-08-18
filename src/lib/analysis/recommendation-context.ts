/**
 * Shared recommendation context.
 *
 * One classification, one set of rules, used by every layer that produces
 * advice: the dashboard report builder, the business review, WebLens
 * Intelligence, the multi-agent panel, the master synthesis and the priority
 * recommendations.
 *
 * The rule is always the same: a recommendation is only produced when
 * (1) the evidence shows the issue exists, and (2) the issue is relevant to the
 * kind of website that was detected. When a check does not apply, it is marked
 * "Not applicable" rather than treated as a failure.
 */

import type { SiteEvidence } from "@/lib/analysis/evidence";
import {
  classifySite,
  SITE_CATEGORY_LABEL,
  type SiteCategoryId,
  type SiteClassification,
} from "@/lib/analysis/site-category";
import type { CategoryId } from "@/lib/dashboard/types";

/**
 * Topics let us tune advice to the kind of website that was detected without
 * ever inventing a finding — a topic only matches text that came from a
 * measured recommendation.
 */
export type Topic =
  | "testimonials"
  | "pricing"
  | "about"
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
  {
    topic: "i18n",
    pattern: /language|hreflang|localis|localiz|internationalis|internationaliz|region|locale/i,
  },
  { topic: "pricing", pattern: /pricing|price|plans?\b/i },
  { topic: "about", pattern: /about (page|us|section)|company story|who you are/i },
  { topic: "cta", pattern: /call to action|cta|conversion|sign[- ]?up|book a call|primary action/i },
  { topic: "contact", pattern: /contact|phone|address|enquir|inquir/i },
  { topic: "navigation", pattern: /navigation|internal link|menu|structure of the page|sitemap/i },
  { topic: "media", pattern: /image|media|lazy|dimension|format|screenshot|video/i },
  {
    topic: "title-length",
    pattern: /title (tag|length)|meta title|shorten the title|description length/i,
  },
  { topic: "readability", pattern: /heading|readab|content length|word count|copy/i },
  { topic: "mobile", pattern: /mobile|viewport|small screen|touch/i },
  { topic: "search", pattern: /search|discover|find (products|content)/i },
  { topic: "forms", pattern: /form|input|label|field/i },
];

export function topicForText(text: string): Topic {
  return TOPIC_PATTERNS.find((entry) => entry.pattern.test(text))?.topic ?? "other";
}

export type ContextRule = {
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

export const DEFAULT_RULE: ContextRule = {
  boostCategories: [],
  boostTopics: [],
  dampTopics: [],
  dropTopics: [],
  focus: "Priorities are balanced across every area measured during this analysis.",
};

export const CONTEXT_RULES: Partial<Record<SiteCategoryId, ContextRule>> = {
  enterprise: {
    boostCategories: ["performance", "accessibility", "seo"],
    boostTopics: ["navigation", "media", "schema", "i18n", "mobile"],
    dampTopics: [],
    dropTopics: ["title-length", "about"],
    gatedTopics: ["testimonials", "pricing", "contact", "cta"],
    focus:
      "Weighted towards performance, accessibility, SEO, structured data, image delivery, navigation clarity, internationalisation and technical reliability.",
  },
  saas: {
    boostCategories: ["business", "design"],
    boostTopics: ["cta", "pricing", "testimonials", "readability"],
    dampTopics: ["contact"],
    dropTopics: [],
    focus:
      "Weighted towards value proposition, product clarity, signup or demo actions, pricing, documentation and trust.",
  },
  ecommerce: {
    boostCategories: ["performance", "business"],
    boostTopics: ["search", "media", "mobile", "cta", "pricing", "testimonials"],
    dampTopics: ["readability"],
    dropTopics: [],
    focus:
      "Weighted towards product discovery, pricing, purchase flow, trust signals and mobile conversion.",
  },
  local: {
    boostCategories: ["business"],
    boostTopics: ["contact", "testimonials", "pricing", "mobile", "schema"],
    dampTopics: [],
    dropTopics: [],
    focus:
      "Weighted towards contact details, location, hours, services, reviews and booking or ordering actions.",
  },
  restaurant: {
    boostCategories: ["business", "design"],
    boostTopics: ["contact", "media", "mobile", "cta"],
    dampTopics: ["readability"],
    dropTopics: [],
    focus:
      "Weighted towards menu clarity, booking and ordering actions, contact details and mobile usability.",
  },
  healthcare: {
    boostCategories: ["accessibility", "business"],
    boostTopics: ["contact", "cta", "readability", "forms"],
    dampTopics: ["pricing"],
    dropTopics: [],
    focus:
      "Weighted towards accessibility, clarity of services, appointment actions and contact details.",
  },
  agency: {
    boostCategories: ["business", "design"],
    boostTopics: ["cta", "testimonials", "contact", "media"],
    dampTopics: [],
    dropTopics: [],
    focus: "Weighted towards positioning, proof of work, enquiry actions and presentation quality.",
  },
  publisher: {
    boostCategories: ["seo", "performance"],
    boostTopics: ["readability", "navigation", "search"],
    dampTopics: [],
    dropTopics: [],
    gatedTopics: ["pricing", "testimonials"],
    focus:
      "Weighted towards content structure, readability, internal linking, metadata and subscription actions.",
  },
  community: {
    boostCategories: ["accessibility", "performance"],
    boostTopics: ["navigation", "readability", "search", "cta"],
    dampTopics: [],
    dropTopics: [],
    gatedTopics: ["testimonials", "pricing"],
    focus: "Weighted towards clarity of the main action, navigation, readability and accessibility.",
  },
  education: {
    boostCategories: ["accessibility", "seo"],
    boostTopics: ["navigation", "readability", "forms", "cta"],
    dampTopics: [],
    dropTopics: [],
    gatedTopics: ["testimonials", "pricing"],
    focus:
      "Weighted towards navigation, readability, accessibility and clarity of enrolment actions.",
  },
  government: {
    boostCategories: ["accessibility", "performance", "seo"],
    boostTopics: ["navigation", "readability", "forms", "i18n", "mobile"],
    dampTopics: [],
    dropTopics: ["testimonials", "pricing", "cta", "about"],
    focus:
      "Weighted towards accessibility, findability, plain language, forms and technical reliability.",
  },
  portfolio: {
    boostCategories: ["design", "performance"],
    boostTopics: ["media", "contact", "cta"],
    dampTopics: [],
    dropTopics: [],
    gatedTopics: ["pricing"],
    focus:
      "Weighted towards presentation, media delivery and how easily someone can get in touch.",
  },
};

/**
 * A utility or dashboard-style application is detected as SaaS or "other" by
 * the classifier; when the evidence shows an application rather than a
 * marketing site, task completion comes first and commercial advice is gated.
 */
export const UTILITY_RULE: ContextRule = {
  boostCategories: ["accessibility", "performance", "design"],
  boostTopics: ["navigation", "cta", "forms", "mobile", "search"],
  dampTopics: [],
  dropTopics: [],
  gatedTopics: ["testimonials", "pricing", "about"],
  focus:
    "Weighted towards task completion, usability, navigation, accessibility, performance, discoverability and clear actions.",
};

/** Signals that a site is genuinely selling something on this page. */
export function hasCommercialEvidence(evidence: SiteEvidence | null): boolean {
  if (!evidence) return false;
  return (
    evidence.content.hasPricingSection ||
    evidence.content.hasTestimonials ||
    evidence.links.hasPricing ||
    evidence.structuredData.types.some((type) => /product|offer|service|store/i.test(type))
  );
}

/** Signals that direct contact is part of how this site converts. */
export function hasContactEvidence(evidence: SiteEvidence | null): boolean {
  if (!evidence) return false;
  return (
    evidence.content.hasContactDetails || evidence.links.mailto > 0 || evidence.links.tel > 0
  );
}

/** Signals that the page behaves like an application rather than a brochure. */
function looksLikeUtility(evidence: SiteEvidence | null): boolean {
  if (!evidence) return false;
  const appSchema = evidence.structuredData.types.some((type) =>
    /softwareapplication|webapplication/i.test(type),
  );
  const taskUi = evidence.forms.total > 0 && evidence.links.nav.length <= 6;
  const taskWords = /dashboard|calculator|converter|generator|tracker|tool|login|sign in/i.test(
    `${evidence.metadata.title ?? ""} ${evidence.content.headline ?? ""} ${evidence.content.ctas.join(" ")}`,
  );
  return appSchema || (taskUi && taskWords);
}

export type RecommendationContext = {
  classification: SiteClassification;
  evidence: SiteEvidence | null;
  rule: ContextRule;
  /** True when the classification was confident enough to tune advice. */
  tuned: boolean;
  /** 0–1 multiplier applied to any contextual re-ranking. */
  strength: number;
  focus: string;
  /** True when the page behaves like a utility/dashboard application. */
  utility: boolean;
};

/**
 * Merges the primary rule with the secondary characteristics of the site, so a
 * site that is (for example) an enterprise brand with retail traits keeps the
 * enterprise suppressions while still gaining relevant retail priorities.
 */
function resolveRule(classification: SiteClassification, utility: boolean): ContextRule {
  const primary = utility
    ? UTILITY_RULE
    : (CONTEXT_RULES[classification.primaryCategory] ?? DEFAULT_RULE);
  const secondaries = classification.secondaryCategories
    .map((id) => CONTEXT_RULES[id])
    .filter((rule): rule is ContextRule => !!rule);

  if (!secondaries.length) return primary;

  const merged: ContextRule = {
    boostCategories: [...primary.boostCategories],
    boostTopics: [...primary.boostTopics],
    dampTopics: [...primary.dampTopics],
    dropTopics: [...primary.dropTopics],
    gatedTopics: [...(primary.gatedTopics ?? [])],
    focus: primary.focus,
  };

  for (const rule of secondaries) {
    for (const category of rule.boostCategories) {
      if (!merged.boostCategories.includes(category)) merged.boostCategories.push(category);
    }
    for (const topic of rule.boostTopics) {
      // The primary category always wins: never re-introduce what it drops or gates.
      if (
        merged.dropTopics.includes(topic) ||
        merged.dampTopics.includes(topic) ||
        merged.gatedTopics?.includes(topic)
      ) {
        continue;
      }
      if (!merged.boostTopics.includes(topic)) merged.boostTopics.push(topic);
    }
  }

  const labels = classification.secondaryCategories.map((id) =>
    SITE_CATEGORY_LABEL[id].toLowerCase(),
  );
  merged.focus = `${primary.focus} Secondary ${labels.join(" and ")} characteristics were also taken into account.`;

  return merged;
}

/** Builds the single context every recommendation layer shares. */
export function buildRecommendationContext(
  evidence: SiteEvidence | null,
  classificationInput?: SiteClassification,
): RecommendationContext {
  const classification = classificationInput ?? classifySite(evidence);
  const utility = looksLikeUtility(evidence);

  // Enterprise rules apply from 50% confidence upwards; every other category
  // waits for the usual 70% threshold before tuning kicks in.
  const enterpriseTuned =
    classification.primaryCategory === "enterprise" && classification.confidence >= 50;
  const tuned = enterpriseTuned || utility || !classification.conservative;

  const rule = tuned ? resolveRule(classification, utility) : DEFAULT_RULE;

  return {
    classification,
    evidence,
    rule,
    tuned,
    strength: tuned ? 1 : 0.4,
    focus: rule.focus,
    utility,
  };
}

export type Applicability = {
  topic: Topic;
  applicable: boolean;
  /** Why this applies (when it does). */
  reason: string;
  /** Why this was marked "Not applicable" (when it isn't). */
  notApplicableReason: string | null;
};

/** Decides whether a topic applies to this website at all. */
export function assessTopic(context: RecommendationContext, topic: Topic): Applicability {
  const label = context.utility
    ? "utility / dashboard"
    : context.classification.label.toLowerCase();

  if (!context.tuned) {
    return {
      topic,
      applicable: true,
      reason:
        "Website category could not be determined with high confidence, so this is kept under a conservative mixed reading of the evidence.",
      notApplicableReason: null,
    };
  }

  const { rule } = context;

  if (rule.dropTopics.includes(topic)) {
    return {
      topic,
      applicable: false,
      reason: "",
      notApplicableReason: `Not applicable — this is a standard check for smaller sites and does not fit a ${label} site on the evidence collected.`,
    };
  }

  if (!rule.gatedTopics?.includes(topic)) {
    return {
      topic,
      applicable: true,
      reason: `Applies to a ${label} site based on the evidence collected here.`,
      notApplicableReason: null,
    };
  }

  if (topic === "contact") {
    return hasContactEvidence(context.evidence)
      ? {
          topic,
          applicable: true,
          reason:
            "Contact details were detected on the page, so this path is already part of how the site converts.",
          notApplicableReason: null,
        }
      : {
          topic,
          applicable: false,
          reason: "",
          notApplicableReason: `Not applicable — no evidence that direct contact is how a ${label} site converts here.`,
        };
  }

  return hasCommercialEvidence(context.evidence)
    ? {
        topic,
        applicable: true,
        reason: `Commercial signals (pricing, offers or customer proof) were detected during this analysis, so this applies to a ${label} site.`,
        notApplicableReason: null,
      }
    : {
        topic,
        applicable: false,
        reason: "",
        notApplicableReason: `Not applicable — no commercial signals on this page suggest a ${label} site needs this, so its absence is not counted against the site.`,
      };
}

/** Convenience wrapper: derives the topic from recommendation text first. */
export function assessText(context: RecommendationContext, text: string): Applicability {
  return assessTopic(context, topicForText(text));
}
