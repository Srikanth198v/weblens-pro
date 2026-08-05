import type { SiteEvidence, WebsiteUnderstanding } from "@/lib/analysis/evidence";

/**
 * Website Understanding.
 *
 * Every sentence below is composed from facts present in the evidence. Where
 * the page does not say something, we say so instead of guessing.
 */

const UNKNOWN = "Not stated clearly on the homepage.";

type IndustryRule = { label: string; pattern: RegExp };

const INDUSTRY_RULES: IndustryRule[] = [
  { label: "Search & online services", pattern: /\b(search engine|search the web|gmail|maps)\b/i },
  { label: "Software as a service", pattern: /\b(saas|platform|dashboard|workspace|integrations?|api)\b/i },
  { label: "E-commerce & retail", pattern: /\b(cart|checkout|shop|store|shipping|add to (bag|cart)|products?)\b/i },
  { label: "Agency & professional services", pattern: /\b(agency|consultanc|clients?|studio|services)\b/i },
  { label: "Education & training", pattern: /\b(course|curriculum|students?|lessons?|training|academy)\b/i },
  { label: "Health & wellbeing", pattern: /\b(clinic|patients?|health|therapy|wellness|doctor)\b/i },
  { label: "Finance", pattern: /\b(invoice|payments?|banking|invest|loans?|insurance)\b/i },
  { label: "Hospitality & food", pattern: /\b(menu|restaurant|reservation|booking|hotel|rooms)\b/i },
  { label: "Real estate", pattern: /\b(properties|listings|for sale|rent|estate agent)\b/i },
  { label: "Media & publishing", pattern: /\b(articles?|stories|newsroom|magazine|editorial)\b/i },
  { label: "Portfolio & personal", pattern: /\b(portfolio|my work|about me|freelance)\b/i },
];

const GOAL_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: "Start a free trial or sign-up", pattern: /^(get started|start free|sign up|try (it )?free|join)/i },
  { label: "Book a demo or call", pattern: /^(book|request( a)? (demo|quote)|schedule)/i },
  { label: "Make a purchase", pattern: /^(buy|shop|order|add to)/i },
  { label: "Make contact", pattern: /^(contact|get a quote|talk to)/i },
  { label: "Download or subscribe", pattern: /^(download|subscribe)/i },
];

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function brandName(evidence: SiteEvidence): string {
  const host = evidence.host.replace(/^www\./, "");
  const fromTitle = evidence.metadata.title?.split(/[|–—·-]/)[0]?.trim();
  if (fromTitle && fromTitle.length >= 2 && fromTitle.length <= 40) return fromTitle;
  const label = host.split(".")[0] ?? host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function buildUnderstanding(evidence: SiteEvidence): WebsiteUnderstanding {
  const name = brandName(evidence);
  const haystack = [
    evidence.metadata.title ?? "",
    evidence.metadata.description ?? "",
    evidence.content.headline ?? "",
    evidence.content.intro ?? "",
    evidence.headings.h2.join(" "),
    evidence.links.nav.join(" "),
    evidence.content.keywords.join(" "),
  ].join(" ");

  const industry = INDUSTRY_RULES.find((rule) => rule.pattern.test(haystack))?.label ?? UNKNOWN;

  const purposeSource = evidence.metadata.description ?? evidence.content.headline ?? evidence.content.intro;
  const purpose = purposeSource ? sentenceCase(purposeSource) : UNKNOWN;

  const primaryCta = evidence.content.ctas[0];
  const primaryGoal = primaryCta
    ? (GOAL_RULES.find((rule) => rule.pattern.test(primaryCta))?.label ??
      `Prompt visitors to “${primaryCta}”`)
    : evidence.forms.total > 0
      ? "Capture enquiries through the on-page form"
      : UNKNOWN;

  const audience = (() => {
    const match = haystack.match(
      /\bfor\s+((?:small |growing |modern |busy |independent )?[a-z][a-z-]+(?:\s+[a-z][a-z-]+){0,2})\b/i,
    );
    if (match?.[1]) return sentenceCase(match[1]);
    if (evidence.content.hasPricingSection && evidence.links.hasPricing) {
      return "Buyers comparing options and pricing before committing";
    }
    return UNKNOWN;
  })();

  const businessType = (() => {
    if (/\b(cart|checkout|add to (bag|cart)|shop now|shipping)\b/i.test(haystack)) {
      return "Online store selling directly to visitors";
    }
    if (evidence.content.hasPricingSection || evidence.links.hasPricing) {
      return "Product or service with published pricing";
    }
    if (evidence.forms.total > 0 && evidence.links.hasContact) {
      return "Enquiry-led business collecting leads through the site";
    }
    if (evidence.links.hasBlog && evidence.content.wordCount > 800) {
      return "Content-led site publishing articles or updates";
    }
    if (evidence.content.ctas.length > 0) {
      return "Marketing site pointing visitors to a single next step";
    }
    return UNKNOWN;
  })();

  const mainUserAction = primaryCta
    ? `Select “${primaryCta}”`
    : evidence.forms.total > 0
      ? "Complete the form on the page"
      : evidence.links.hasContact
        ? "Open the contact page"
        : UNKNOWN;

  const keyFeatures = (evidence.links.nav.length ? evidence.links.nav : evidence.headings.h2)
    .filter((label) => label.length > 1)
    .slice(0, 6);

  const positioning = (() => {
    const parts: string[] = [];
    if (evidence.content.hasTestimonials) parts.push("leans on customer proof");
    if (evidence.links.hasPricing || evidence.content.hasPricingSection) {
      parts.push("is open about pricing");
    }
    if (evidence.content.wordCount < 250) parts.push("keeps the homepage deliberately sparse");
    if (evidence.content.wordCount > 1200) parts.push("explains itself in depth");
    if (evidence.structuredData.types.length) {
      parts.push(`describes itself to search engines as ${evidence.structuredData.types.join(", ")}`);
    }
    return parts.length
      ? `${name} ${parts.join(", ")}.`
      : "The page does not yet carry enough positioning signals to read confidently.";
  })();

  const summary = (() => {
    const opening = evidence.metadata.description
      ? `${name} describes itself as: “${evidence.metadata.description}”.`
      : evidence.content.headline
        ? `${name} opens with the headline “${evidence.content.headline}”.`
        : `${name} does not state its purpose in a title, description or main heading.`;

    const structure = `The homepage carries ${evidence.content.wordCount.toLocaleString()} words, ${
      evidence.headings.total
    } headings and ${evidence.links.total} links${
      evidence.links.nav.length ? `, with ${evidence.links.nav.length} primary navigation items` : ""
    }.`;

    const intent = primaryCta
      ? `The most prominent action on the page is “${primaryCta}”, which points to the site's main goal.`
      : evidence.forms.total > 0
        ? `There is no obvious call-to-action button, though ${evidence.forms.total} form${
            evidence.forms.total === 1 ? "" : "s"
          } appear on the page.`
        : "No call-to-action button or form was found on the homepage, so the intended next step is unclear.";

    return `${opening} ${structure} ${intent}`;
  })();

  const evidenceList = [
    evidence.metadata.title ? `Page title: “${evidence.metadata.title}”` : "No page title found",
    evidence.metadata.description
      ? `Meta description: “${evidence.metadata.description}”`
      : "No meta description found",
    evidence.headings.h1.length
      ? `Main heading: “${evidence.headings.h1[0]}”`
      : "No H1 heading found",
    evidence.links.nav.length
      ? `Navigation: ${evidence.links.nav.join(", ")}`
      : `${evidence.links.total} links found, no <nav> landmark`,
    `${evidence.content.wordCount.toLocaleString()} words of visible copy`,
    evidence.content.ctas.length
      ? `Calls to action: ${evidence.content.ctas.join(", ")}`
      : "No recognised call-to-action labels",
  ];

  const signals = [
    Boolean(evidence.metadata.title),
    Boolean(evidence.metadata.description),
    evidence.headings.h1.length > 0,
    evidence.links.nav.length > 0,
    evidence.content.wordCount > 120,
    evidence.content.ctas.length > 0,
  ].filter(Boolean).length;

  return {
    summary,
    industry,
    businessType,
    purpose,
    audience,
    primaryGoal,
    primaryCta: primaryCta ?? null,
    mainUserAction,
    keyFeatures,
    positioning,
    evidence: evidenceList,
    confidence: Math.round((signals / 6) * 100),
  };
}
