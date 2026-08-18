/**
 * Multi-signal website classification.
 *
 * A site's primary category is decided by combining independent signal
 * families — organisation scale, navigation structure, product/service
 * families, structured data, commerce signals, corporate pages, region or
 * language selectors, account/dashboard signals, booking/order signals and
 * publishing signals. No domain checks, no brand lists: a site is classified
 * purely by what its page shows.
 */

import type { SiteEvidence } from "@/lib/analysis/evidence";

export type SiteCategoryId =
  | "enterprise"
  | "saas"
  | "ecommerce"
  | "local"
  | "restaurant"
  | "healthcare"
  | "agency"
  | "publisher"
  | "portfolio"
  | "community"
  | "education"
  | "government"
  | "other";

export type SiteClassification = {
  /** Primary detected category. */
  primaryCategory: SiteCategoryId;
  /** Additional characteristics the page also shows, strongest first. */
  secondaryCategories: SiteCategoryId[];
  /** Alias of primaryCategory kept for existing consumers. */
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
  ecommerce: "E-commerce / online store",
  local: "Local business",
  restaurant: "Restaurant / food",
  healthcare: "Healthcare / clinic",
  agency: "Agency / professional services",
  publisher: "Blog / publisher / news",
  portfolio: "Portfolio / personal",
  community: "Community / nonprofit",
  education: "Educational",
  government: "Government",
  other: "Other",
};

/** Independent signal families. A category needs several to lead. */
type SignalFamily =
  | "scale"
  | "navigation"
  | "product-families"
  | "structured-data"
  | "commerce"
  | "corporate"
  | "i18n"
  | "account"
  | "booking"
  | "publishing"
  | "content"
  | "layout";

type Signal = {
  category: SiteCategoryId;
  family: SignalFamily;
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

function unknownClassification(confidence = 0, signals: string[] = []): SiteClassification {
  return {
    primaryCategory: "other",
    secondaryCategories: [],
    category: "other",
    label: SITE_CATEGORY_LABEL.other,
    confidence,
    signals,
    conservative: true,
    note: "Website category could not be determined with high confidence.",
  };
}

export function classifySite(evidence: SiteEvidence | null): SiteClassification {
  if (!evidence) return unknownClassification();

  const text = haystack(evidence);
  const nav = evidence.links.nav.length;
  const schema = evidence.structuredData.types.map((type) => type.toLowerCase());
  const navText = evidence.links.nav.join(" ").toLowerCase();

  /** Distinct product/service families named in the navigation. */
  const productFamilies = new Set(
    evidence.links.nav
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 2 && !/^(home|search|cart|bag|login|sign in|menu)$/.test(entry)),
  ).size;

  const signals: Signal[] = [
    // ---------- Enterprise / global brand (needs several families) ----------
    {
      category: "enterprise",
      family: "corporate",
      weight: 3,
      when: has(text, /\b(careers|investors?|press|newsroom|corporate|annual report|leadership)\b/),
      describe: "careers, investor or press sections",
    },
    {
      category: "enterprise",
      family: "corporate",
      weight: 2,
      when: has(text, /\b(privacy|legal|terms|cookie preferences|accessibility statement|compliance)\b/),
      describe: "legal, privacy or compliance pages",
    },
    {
      category: "enterprise",
      family: "i18n",
      weight: 3,
      when: has(text, /\b(choose your (country|region)|global site|worldwide|select (your )?(region|language)|country selector)\b/),
      describe: "region or language selector",
    },
    {
      category: "enterprise",
      family: "product-families",
      weight: 3,
      when: productFamilies >= 6 && has(text, /\b(products?|solutions?|services?|business|enterprise)\b/),
      describe: `${productFamilies} distinct product or solution families in navigation`,
    },
    {
      category: "enterprise",
      family: "scale",
      weight: 2,
      when: evidence.links.total >= 80 && evidence.content.wordCount > 900,
      describe: `${evidence.links.total} links across ${evidence.content.wordCount.toLocaleString()} words of content`,
    },
    {
      category: "enterprise",
      family: "structured-data",
      weight: 2,
      when: schema.some((type) => /organization|corporation/.test(type)),
      describe: "organization structured data",
    },
    {
      category: "enterprise",
      family: "corporate",
      weight: 2,
      when: has(text, /\b(support|help ?cent(er|re)|customer service|contact us)\b/) && nav >= 5,
      describe: "dedicated support or customer service entry point",
    },
    {
      category: "enterprise",
      family: "navigation",
      weight: 1,
      when: nav >= 7,
      describe: `${nav} primary navigation categories`,
    },

    // ---------- SaaS / software ----------
    {
      category: "saas",
      family: "account",
      weight: 3,
      when: has(text, /\b(start (for )?free|get started free|try (it )?free|free trial|sign up|create (an )?account)\b/),
      describe: "free trial or sign-up call to action",
    },
    {
      category: "saas",
      family: "account",
      weight: 2,
      when: has(text, /\b(log ?in|sign in|dashboard|workspace|console|my account)\b/),
      describe: "login or dashboard entry point",
    },
    {
      category: "saas",
      family: "booking",
      weight: 3,
      when: has(text, /\b(book a demo|request a demo|see it in action|talk to sales)\b/),
      describe: "demo booking call to action",
    },
    {
      category: "saas",
      family: "commerce",
      weight: 2,
      when: evidence.links.hasPricing || evidence.content.hasPricingSection,
      describe: "pricing page or pricing section",
    },
    {
      category: "saas",
      family: "product-families",
      weight: 2,
      when: has(text, /\b(features|integrations?|api|sdk|workflow|automation|docs|documentation)\b/),
      describe: "product feature, API or documentation sections",
    },
    {
      category: "saas",
      family: "structured-data",
      weight: 3,
      when: schema.some((type) => /softwareapplication|webapplication/.test(type)),
      describe: "software application structured data",
    },

    // ---------- E-commerce / online store ----------
    {
      category: "ecommerce",
      family: "commerce",
      weight: 3,
      when: has(text, /\b(add to (cart|bag)|buy now|checkout|view (cart|bag)|my (cart|bag))\b/),
      describe: "cart or checkout actions",
    },
    {
      category: "ecommerce",
      family: "structured-data",
      weight: 3,
      when: schema.some((type) => /product|offer|aggregateoffer/.test(type)),
      describe: "product structured data",
    },
    {
      category: "ecommerce",
      family: "commerce",
      weight: 2,
      when: has(text, /\b(shipping|free (delivery|returns)|returns policy|order tracking|wishlist)\b/),
      describe: "shipping, returns or order-tracking information",
    },
    {
      category: "ecommerce",
      family: "navigation",
      weight: 1,
      when: has(navText, /\b(shop|store|collections?|categories|sale|deals)\b/),
      describe: "shop or collections navigation",
    },
    {
      category: "ecommerce",
      family: "layout",
      weight: 2,
      when:
        evidence.images.total >= 20 &&
        has(text, /(from ?[₹$€£]|[₹$€£]\s?\d|\bprice\b)/) &&
        has(text, /\b(add to (cart|bag)|buy|checkout|shop)\b/),
      describe: `${evidence.images.total} product images shown with price labels`,
    },

    // ---------- Local business ----------
    {
      category: "local",
      family: "booking",
      weight: 3,
      when: evidence.links.tel > 0,
      describe: "phone number linked on the page",
    },
    {
      category: "local",
      family: "content",
      weight: 3,
      when: has(text, /\b(opening hours|hours|mon(day)?\s?[-–]\s?(fri|sat|sun))\b/),
      describe: "opening hours listed",
    },
    {
      category: "local",
      family: "content",
      weight: 2,
      when: has(text, /\b(directions|find us|our location|visit us|map|address)\b/),
      describe: "address or map directions",
    },
    {
      category: "local",
      family: "structured-data",
      weight: 3,
      when: schema.some((type) => /localbusiness|store|place/.test(type)),
      describe: "local business structured data",
    },

    // ---------- Restaurant / food ----------
    {
      category: "restaurant",
      family: "content",
      weight: 3,
      when: has(text, /\b(menu|dishes|cuisine|dine[- ]in|takeaway|take ?out|delivery|order online|reservations?)\b/),
      describe: "menu, ordering or reservation language",
    },
    {
      category: "restaurant",
      family: "booking",
      weight: 3,
      when: has(text, /\b(book a table|reserve a table|table booking|order food)\b/),
      describe: "table booking or food ordering action",
    },
    {
      category: "restaurant",
      family: "structured-data",
      weight: 3,
      when: schema.some((type) => /restaurant|foodestablishment|menu/.test(type)),
      describe: "restaurant structured data",
    },

    // ---------- Healthcare / clinic ----------
    {
      category: "healthcare",
      family: "content",
      weight: 3,
      when: has(text, /\b(clinic|hospital|patients?|doctors?|physician|dental|treatments?|diagnos|therapy|medical)\b/),
      describe: "clinical, patient or treatment language",
    },
    {
      category: "healthcare",
      family: "booking",
      weight: 3,
      when: has(text, /\b(book an appointment|schedule (a )?(visit|consultation)|patient portal)\b/),
      describe: "appointment booking or patient portal",
    },
    {
      category: "healthcare",
      family: "structured-data",
      weight: 3,
      when: schema.some((type) => /medical|physician|hospital|dentist/.test(type)),
      describe: "medical organisation structured data",
    },

    // ---------- Agency / professional services ----------
    {
      category: "agency",
      family: "content",
      weight: 3,
      when: has(text, /\b(agency|consultanc|our services|what we do|case stud|clients?|studio|law firm|accounting)\b/),
      describe: "agency, services or client-work language",
    },
    {
      category: "agency",
      family: "booking",
      weight: 2,
      when: has(text, /\b(book a call|get a quote|request a proposal|work with us|start a project)\b/),
      describe: "quote, proposal or project enquiry action",
    },
    {
      category: "agency",
      family: "structured-data",
      weight: 2,
      when: schema.some((type) => /professionalservice|legalservice|accountingservice/.test(type)),
      describe: "professional services structured data",
    },

    // ---------- Blog / publisher / news ----------
    {
      category: "publisher",
      family: "publishing",
      weight: 3,
      when: has(text, /\b(articles?|news|stories|latest|editorial|magazine|blog|opinion)\b/),
      describe: "article, news or blog sections",
    },
    {
      category: "publisher",
      family: "structured-data",
      weight: 3,
      when: schema.some((type) => /article|newsarticle|blogposting|liveblog/.test(type)),
      describe: "article structured data",
    },
    {
      category: "publisher",
      family: "publishing",
      weight: 2,
      when: has(text, /\b(by [a-z]+ [a-z]+|author|published|updated on|min read|subscribe|newsletter)\b/),
      describe: "bylines, publish dates or newsletter signup",
    },
    {
      category: "publisher",
      family: "navigation",
      weight: 2,
      when: has(navText, /\b(categories|topics|tags|archive|sections?)\b/),
      describe: "topic, tag or archive navigation",
    },
    {
      category: "publisher",
      family: "content",
      weight: 2,
      when: evidence.content.wordCount > 900 && evidence.links.internal >= 40,
      describe: `${evidence.links.internal} internal links across long-form content`,
    },

    // ---------- Portfolio / personal ----------
    {
      category: "portfolio",
      family: "content",
      weight: 3,
      when: has(text, /\b(portfolio|my work|selected work|about me|freelance|hire me|résumé|resume)\b/),
      describe: "personal portfolio language",
    },
    {
      category: "portfolio",
      family: "layout",
      weight: 2,
      when: nav > 0 && nav <= 4 && evidence.content.wordCount < 500,
      describe: "small navigation with a short single-page story",
    },

    // ---------- Community / nonprofit ----------
    {
      category: "community",
      family: "content",
      weight: 3,
      when: has(text, /\b(donate|donation|volunteer|charity|foundation|fundrais|our mission)\b/),
      describe: "donation, volunteering or mission language",
    },
    {
      category: "community",
      family: "content",
      weight: 3,
      when: has(text, /\b(forum|community|discussions?|threads?|members|join the conversation|replies)\b/),
      describe: "forum or community discussion language",
    },
    {
      category: "community",
      family: "structured-data",
      weight: 2,
      when: schema.some((type) => /ngo|nonprofit/.test(type)),
      describe: "nonprofit structured data",
    },

    // ---------- Educational ----------
    {
      category: "education",
      family: "content",
      weight: 3,
      when: has(text, /\b(courses?|curriculum|students?|admissions?|syllabus|academy|university|college|school|tuition)\b/),
      describe: "course, student or admissions language",
    },
    {
      category: "education",
      family: "structured-data",
      weight: 3,
      when: schema.some((type) => /educationalorganization|school|course|collegeoruniversity/.test(type)),
      describe: "educational organisation structured data",
    },
    {
      category: "education",
      family: "account",
      weight: 2,
      when: has(text, /\b(student portal|apply now|enroll|enrol|learning platform)\b/),
      describe: "enrolment or student portal actions",
    },

    // ---------- Government ----------
    {
      category: "government",
      family: "content",
      weight: 3,
      when: has(text, /\b(government|ministry|municipal|city council|public services?|citizens?|department of|official (site|portal))\b/),
      describe: "government or public-service language",
    },
    {
      category: "government",
      family: "structured-data",
      weight: 3,
      when: schema.some((type) => /governmentorganization|governmentservice/.test(type)),
      describe: "government organisation structured data",
    },
    {
      category: "government",
      family: "content",
      weight: 2,
      when: has(text, /\b(schemes?|grants?|permits?|licen[cs]e|tax|regulations?|notifications?|gazette)\b/),
      describe: "schemes, permits or regulatory sections",
    },
  ];

  const observed = signals.filter((signal) => signal.when);
  if (!observed.length) return unknownClassification();

  type Total = { score: number; signals: string[]; families: Set<SignalFamily> };
  const totals = new Map<SiteCategoryId, Total>();
  for (const signal of observed) {
    const entry = totals.get(signal.category) ?? { score: 0, signals: [], families: new Set() };
    entry.score += signal.weight;
    entry.signals.push(signal.describe);
    entry.families.add(signal.family);
    totals.set(signal.category, entry);
  }

  // Enterprise is never awarded on navigation size alone: it needs at least
  // three independent signal families and real corporate evidence.
  const enterprise = totals.get("enterprise");
  const enterpriseQualifies =
    !!enterprise &&
    enterprise.families.size >= 3 &&
    enterprise.score >= 8 &&
    (enterprise.families.has("corporate") ||
      enterprise.families.has("i18n") ||
      enterprise.families.has("product-families"));

  if (enterprise && !enterpriseQualifies) {
    // Keep the observations, but they cannot make the site an enterprise brand.
    enterprise.score = Math.min(enterprise.score, 4);
  }

  const ranked = [...totals.entries()].sort(
    (a, b) => b[1].score - a[1].score || b[1].families.size - a[1].families.size,
  );

  // A site can be commercial AND a global brand. When enterprise qualifies on
  // its own evidence and is close to the leader, it represents the primary
  // context and the leader becomes a secondary characteristic.
  const leader = ranked[0];
  const enterprisePrimary =
    enterpriseQualifies &&
    !!leader &&
    leader[0] !== "enterprise" &&
    enterprise!.score >= leader[1].score * 0.7;

  const order = enterprisePrimary
    ? ([[
        "enterprise",
        enterprise!,
      ] as const, ...ranked.filter(([id]) => id !== "enterprise")] as typeof ranked)
    : ranked;

  const top = order[0];
  const runnerUp = order[1];

  if (!top || top[1].score < 4 || top[1].families.size < 2) {
    return unknownClassification(top ? Math.round(top[1].score * 8) : 0, top?.[1].signals.slice(0, 6) ?? []);
  }

  const totalScore = order.reduce((sum, [, entry]) => sum + entry.score, 0);
  const share = top[1].score / Math.max(totalScore, 1);
  const margin = (top[1].score - (runnerUp?.[1].score ?? 0)) / Math.max(top[1].score, 1);
  const breadth = Math.min(top[1].families.size / 4, 1);

  const confidence = Math.max(
    30,
    Math.min(97, Math.round(share * 40 + margin * 25 + breadth * 35)),
  );

  const conservative = confidence < 70 && !enterprisePrimary;

  const secondaryCategories = order
    .slice(1)
    .filter(([, entry]) => entry.score >= 4 && entry.families.size >= 2)
    .slice(0, 2)
    .map(([id]) => id);

  const secondaryLabels = secondaryCategories.map((id) => SITE_CATEGORY_LABEL[id].toLowerCase());

  return {
    primaryCategory: top[0],
    secondaryCategories,
    category: top[0],
    label: SITE_CATEGORY_LABEL[top[0]],
    confidence: Math.round(enterprisePrimary ? Math.max(confidence, 65) : confidence),
    signals: top[1].signals.slice(0, 6),
    conservative,
    note: conservative
      ? "Website category could not be determined with high confidence."
      : secondaryLabels.length
        ? `Also shows ${secondaryLabels.join(" and ")} characteristics; ${SITE_CATEGORY_LABEL[top[0]].toLowerCase()} is the primary context.`
        : null,
  };
}
