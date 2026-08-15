/**
 * Smart context-aware classification.
 *
 * Reads only signals observed during the analysis (navigation, links, copy,
 * structured data, forms, content volume). There are no domain checks and no
 * brand lists anywhere in this file — a site is classified purely by what its
 * page shows.
 */

import type { SiteEvidence } from "@/lib/analysis/evidence";

export type SiteCategoryId =
  | "enterprise"
  | "saas"
  | "ecommerce"
  | "local"
  | "content"
  | "portfolio"
  | "nonprofit"
  | "utility"
  | "marketplace"
  | "community"
  | "unknown";

export type SiteClassification = {
  category: SiteCategoryId;
  label: string;
  /** 0–100 — how strongly the observed signals point at this category. */
  confidence: number;
  /** Plain-language description of each signal actually observed. */
  signals: string[];
  /** True when confidence is below 70 and advice stays deliberately mixed. */
  conservative: boolean;
  note: string | null;
};

export const SITE_CATEGORY_LABEL: Record<SiteCategoryId, string> = {
  enterprise: "Enterprise / global brand",
  saas: "SaaS / software",
  ecommerce: "E-commerce",
  local: "Local business",
  content: "Content / media",
  portfolio: "Portfolio / personal",
  nonprofit: "Nonprofit / educational",
  utility: "Utility / dashboard application",
  marketplace: "Marketplace",
  community: "Community / forum",
  unknown: "Unknown",
};

type Signal = {
  category: SiteCategoryId;
  weight: number;
  when: boolean;
  describe: string;
};

function haystack(evidence: SiteEvidence): string {
  return [
    evidence.metadata.title ?? "",
    evidence.metadata.description ?? "",
    evidence.content.headline ?? "",
    evidence.content.intro ?? "",
    evidence.headings.h1.join(" "),
    evidence.headings.h2.join(" "),
    evidence.links.nav.join(" "),
    evidence.content.ctas.join(" "),
    evidence.content.keywords.join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

export function classifySite(evidence: SiteEvidence | null): SiteClassification {
  if (!evidence) {
    return {
      category: "unknown",
      label: SITE_CATEGORY_LABEL.unknown,
      confidence: 0,
      signals: [],
      conservative: true,
      note: "Website category could not be determined with high confidence.",
    };
  }

  const text = haystack(evidence);
  const nav = evidence.links.nav.length;
  const schema = evidence.structuredData.types.map((type) => type.toLowerCase());

  const signals: Signal[] = [
    // Enterprise / global brand
    {
      category: "enterprise",
      weight: 3,
      when: nav >= 7,
      describe: `${nav} primary navigation categories`,
    },
    {
      category: "enterprise",
      weight: 2,
      when: has(text, /\b(support|help ?cent(er|re)|customer service)\b/),
      describe: "support or help links in navigation",
    },
    {
      category: "enterprise",
      weight: 3,
      when: has(text, /\b(careers|investors?|press|newsroom|corporate|global)\b/),
      describe: "careers, investor or press links",
    },
    {
      category: "enterprise",
      weight: 2,
      when: evidence.headings.h2.length >= 6 && evidence.links.total >= 60,
      describe: `${evidence.headings.h2.length} product sections across ${evidence.links.total} links`,
    },
    {
      category: "enterprise",
      weight: 2,
      when: evidence.content.wordCount > 1200,
      describe: `${evidence.content.wordCount.toLocaleString()} words of content`,
    },
    {
      category: "enterprise",
      weight: 2,
      when: schema.some((type) => /organization|corporation/.test(type)),
      describe: "organization structured data",
    },
    {
      category: "enterprise",
      weight: 2,
      when: has(text, /\b(products?|solutions?|services?|business|for (business|enterprise|teams))\b/) && nav >= 5,
      describe: "multiple product or solution families in navigation",
    },
    {
      category: "enterprise",
      weight: 2,
      when: has(text, /\b(region|country|language|global site|worldwide|choose your (country|region))\b/),
      describe: "region or language selection signals",
    },
    {
      category: "enterprise",
      weight: 1,
      when: evidence.links.social.length >= 3 && evidence.links.total >= 40,
      describe: `${evidence.links.social.length} corporate social channels on a large link structure`,
    },
    {
      category: "enterprise",
      weight: 2,
      when: has(text, /\b(privacy|legal|terms|cookie preferences|accessibility statement|compliance)\b/),
      describe: "legal, privacy or compliance links",
    },


    // SaaS / software
    {
      category: "saas",
      weight: 3,
      when: has(text, /\b(start (for )?free|get started free|try (it )?free|free trial|sign up)\b/),
      describe: "free trial or sign-up call to action",
    },
    {
      category: "saas",
      weight: 3,
      when: has(text, /\b(book a demo|request a demo|see it in action|talk to sales)\b/),
      describe: "demo booking call to action",
    },
    {
      category: "saas",
      weight: 2,
      when: evidence.links.hasPricing || evidence.content.hasPricingSection,
      describe: "pricing section or pricing link",
    },
    {
      category: "saas",
      weight: 2,
      when: has(text, /\b(features|integrations?|api|workflow|automation)\b/),
      describe: "features and integrations language",
    },
    {
      category: "saas",
      weight: 2,
      when: has(text, /\b(teams?|workspace|dashboard|log ?in to (your )?app|platform)\b/),
      describe: "teams, workspace or app language",
    },

    // E-commerce — needs transactional evidence, not just retail vocabulary
    {
      category: "ecommerce",
      weight: 3,
      when: has(text, /\b(add to (cart|bag)|buy now|checkout|view (cart|bag)|my (cart|bag))\b/),
      describe: "cart or checkout actions",
    },
    {
      category: "ecommerce",
      weight: 1,
      when: has(text, /\b(shop|store|collections?|products?|sale|shipping|returns)\b/),
      describe: "shop, product and shipping language",
    },
    {
      category: "ecommerce",
      weight: 2,
      when: schema.some((type) => /product|offer|aggregateoffer/.test(type)),
      describe: "product structured data",
    },
    {
      category: "ecommerce",
      weight: 1,
      when: has(text, /\b(shipping|free (delivery|returns)|returns policy|order tracking|wishlist)\b/),
      describe: "shipping, returns or order-tracking language",
    },
    {
      category: "ecommerce",
      weight: 2,
      when:
        evidence.images.total >= 20 &&
        has(text, /\b(price|from ?[₹$€£]|[₹$€£]\s?\d)/) &&
        has(text, /\b(add to (cart|bag)|buy|checkout|shop)\b/),
      describe: `${evidence.images.total} product images with visible price labels`,
    },

    // Local business
    {
      category: "local",
      weight: 3,
      when: evidence.links.tel > 0,
      describe: "phone number linked on the page",
    },
    {
      category: "local",
      weight: 3,
      when: has(text, /\b(opening hours|hours|mon(day)?\s?[-–]\s?(fri|sat|sun))\b/),
      describe: "opening hours listed",
    },
    {
      category: "local",
      weight: 2,
      when: has(text, /\b(directions|find us|our location|map|address)\b/),
      describe: "address or map directions",
    },
    {
      category: "local",
      weight: 2,
      when: has(text, /\b(book (a )?(table|appointment)|reserve|reservation|whatsapp|call us)\b/),
      describe: "booking or contact-first call to action",
    },
    {
      category: "local",
      weight: 2,
      when: schema.some((type) => /localbusiness|restaurant|store|place/.test(type)),
      describe: "local business structured data",
    },

    // Content / media
    {
      category: "content",
      weight: 3,
      when: has(text, /\b(articles?|news|stories|latest|editorial|magazine|blog)\b/),
      describe: "article, news or blog sections",
    },
    {
      category: "content",
      weight: 2,
      when: schema.some((type) => /article|newsarticle|blogposting/.test(type)),
      describe: "article structured data",
    },
    {
      category: "content",
      weight: 2,
      when: has(text, /\b(by [a-z]+ [a-z]+|author|published|updated on|min read)\b/),
      describe: "author or publish date signals",
    },
    {
      category: "content",
      weight: 2,
      when: has(text, /\b(categories|topics|tags|archive|search)\b/),
      describe: "categories, tags or archive search",
    },
    {
      category: "content",
      weight: 2,
      when: evidence.content.wordCount > 900 && evidence.links.internal >= 40,
      describe: `${evidence.links.internal} internal links across long-form content`,
    },

    // Portfolio / personal
    {
      category: "portfolio",
      weight: 3,
      when: has(text, /\b(portfolio|my work|selected work|about me|freelance|hire me|résumé|resume)\b/),
      describe: "personal portfolio language",
    },
    {
      category: "portfolio",
      weight: 1,
      when: nav > 0 && nav <= 4 && evidence.content.wordCount < 500,
      describe: "small navigation with a short single-page story",
    },

    // Nonprofit / educational
    {
      category: "nonprofit",
      weight: 3,
      when: has(text, /\b(donate|donation|volunteer|charity|foundation|fundrais)/),
      describe: "donation or volunteering calls to action",
    },
    {
      category: "nonprofit",
      weight: 3,
      when: has(text, /\b(courses?|curriculum|students?|admissions?|syllabus|academy|university|school)\b/),
      describe: "course, student or admissions language",
    },

    // Utility / dashboard application
    {
      category: "utility",
      weight: 3,
      when: has(text, /\b(calculator|converter|tool|checker|tracker|generator|scanner)\b/),
      describe: "task-oriented tool language",
    },
    {
      category: "utility",
      weight: 3,
      when: has(text, /\b(dashboard|live data|real[- ]time|forecast|weather|analytics|monitor|prices? today|rates?)\b/),
      describe: "live data or dashboard language",
    },
    {
      category: "utility",
      weight: 2,
      when: evidence.forms.total > 0 && evidence.forms.inputs >= 2 && evidence.content.wordCount < 900,
      describe: `${evidence.forms.inputs} form inputs on a task-focused page`,
    },
    {
      category: "utility",
      weight: 2,
      when: has(text, /\b(check|calculate|search|submit|apply|track|scan|analyz|analys)/),
      describe: "action verbs as the main page actions",
    },
    {
      category: "utility",
      weight: 3,
      when: schema.some((type) => /softwareapplication|webapplication/.test(type)),
      describe: "software application structured data",
    },
    {
      category: "utility",
      weight: 2,
      when: nav > 0 && nav <= 5 && evidence.content.wordCount < 600 && evidence.forms.total > 0,
      describe: "application-style navigation around a single task",
    },

    // Marketplace
    {
      category: "marketplace",
      weight: 3,
      when: has(text, /\b(sellers?|buyers?|vendors?|listings?|browse listings|become a (seller|host|partner))\b/),
      describe: "buyer and seller language",
    },
    {
      category: "marketplace",
      weight: 2,
      when: has(text, /\b(marketplace|book a (stay|ride)|find (a )?(pro|freelancer|service))\b/),
      describe: "two-sided marketplace actions",
    },

    // Community / forum
    {
      category: "community",
      weight: 3,
      when: has(text, /\b(forum|community|discussions?|threads?|members|join the conversation|replies)\b/),
      describe: "forum or community discussion language",
    },
    {
      category: "community",
      weight: 2,
      when: has(text, /\b(upvote|comments?|moderator|post a question)\b/),
      describe: "posting and moderation language",
    },
  ];

  const observed = signals.filter((signal) => signal.when);

  const totals = new Map<SiteCategoryId, { score: number; signals: string[] }>();
  for (const signal of observed) {
    const entry = totals.get(signal.category) ?? { score: 0, signals: [] };
    entry.score += signal.weight;
    entry.signals.push(signal.describe);
    totals.set(signal.category, entry);
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1].score - a[1].score);
  const top = ranked[0];
  const runnerUp = ranked[1];

  if (!top || top[1].score < 3) {
    return {
      category: "unknown",
      label: SITE_CATEGORY_LABEL.unknown,
      confidence: top ? Math.round(top[1].score * 10) : 0,
      signals: top?.[1].signals ?? [],
      conservative: true,
      note: "Website category could not be determined with high confidence.",
    };
  }

  const totalScore = ranked.reduce((sum, [, entry]) => sum + entry.score, 0);
  const share = top[1].score / Math.max(totalScore, 1);
  const margin = (top[1].score - (runnerUp?.[1].score ?? 0)) / Math.max(top[1].score, 1);
  const depth = Math.min(top[1].score / 9, 1);

  const confidence = Math.max(
    30,
    Math.min(97, Math.round((share * 45 + margin * 25 + depth * 30) * 100) / 100),
  );

  const conservative = confidence < 70;

  return {
    category: top[0],
    label: SITE_CATEGORY_LABEL[top[0]],
    confidence: Math.round(confidence),
    signals: top[1].signals.slice(0, 6),
    conservative,
    note: conservative ? "Website category could not be determined with high confidence." : null,
  };
}
