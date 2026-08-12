import type { SiteEvidence, WebsiteUnderstanding } from "@/lib/analysis/evidence";

/**
 * AI Website Understanding (presentation-level reading).
 *
 * Derived only from the collected evidence and the stored understanding.
 * Where the page says nothing, we say so rather than inventing a fact.
 */

export type AiUnderstandingField = {
  id: string;
  label: string;
  value: string;
  /** True when the page did not state this clearly. */
  unknown: boolean;
};

export type AiWebsiteUnderstanding = {
  fields: AiUnderstandingField[];
  summary: string;
  confidence: number;
  /** Shown when confidence is below 70%. */
  partial: boolean;
};

const UNKNOWN = "Not stated clearly on the page.";

function isUnknown(value: string | null | undefined): boolean {
  return !value || /^not stated/i.test(value);
}

function brandName(evidence: SiteEvidence | null, fallback: string): string {
  const host = evidence?.host.replace(/^www\./, "");
  const fromTitle = evidence?.metadata.title?.split(/[|–—·-]/)[0]?.trim();
  if (fromTitle && fromTitle.length >= 2 && fromTitle.length <= 40) return fromTitle;
  if (!host) return fallback;
  const label = host.split(".")[0] ?? host;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function websiteType(understanding: WebsiteUnderstanding): string {
  const industry = isUnknown(understanding.industry) ? null : understanding.industry;
  const type = isUnknown(understanding.businessType) ? null : understanding.businessType;
  if (industry && type) return `${industry} — ${type.toLowerCase()}`;
  return industry ?? type ?? UNKNOWN;
}

function valueProposition(
  understanding: WebsiteUnderstanding,
  evidence: SiteEvidence | null,
): string {
  const headline = evidence?.content.headline?.trim();
  const description = evidence?.metadata.description?.trim();
  const source = headline || description || (isUnknown(understanding.purpose) ? null : understanding.purpose);
  if (!source) return UNKNOWN;
  return source.length > 220 ? `${source.slice(0, 217)}…` : source;
}

function brandTone(evidence: SiteEvidence | null): string {
  if (!evidence) return UNKNOWN;
  const words: string[] = [];
  const text = [
    evidence.metadata.title ?? "",
    evidence.metadata.description ?? "",
    evidence.content.headline ?? "",
    evidence.content.intro ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (/\b(free|easy|simple|quick|fast|instantly)\b/.test(text)) words.push("direct");
  if (/\b(trusted|secure|reliable|proven|certified|guarantee)\b/.test(text)) words.push("trust-led");
  if (/\b(enterprise|solutions?|platform|scalable|compliance)\b/.test(text)) words.push("formal");
  if (/\b(we|our team|you|your)\b/.test(text)) words.push("conversational");
  if (evidence.content.hasTestimonials) words.push("proof-driven");
  if (evidence.content.wordCount < 250) words.push("concise");
  if (evidence.content.wordCount > 1200) words.push("detailed");

  if (!words.length) return UNKNOWN;
  const unique = Array.from(new Set(words)).slice(0, 3);
  return unique.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(", ");
}

export function buildAiUnderstanding(
  understanding: WebsiteUnderstanding | null,
  evidence: SiteEvidence | null,
  siteName: string,
): AiWebsiteUnderstanding | null {
  if (!understanding) return null;

  const name = brandName(evidence, siteName);
  const confidence = understanding.confidence;
  const hedge = confidence < 80 ? "appears to" : "is";

  const purpose = isUnknown(understanding.purpose) ? UNKNOWN : understanding.purpose;
  const audience = isUnknown(understanding.audience) ? UNKNOWN : understanding.audience;
  const type = websiteType(understanding);
  const proposition = valueProposition(understanding, evidence);
  const tone = brandTone(evidence);
  const cta = understanding.primaryCta ?? "No call-to-action label was detected on the page.";

  const fields: AiUnderstandingField[] = [
    { id: "type", label: "Website Type", value: type, unknown: isUnknown(type) },
    { id: "purpose", label: "Primary Purpose", value: purpose, unknown: isUnknown(purpose) },
    { id: "audience", label: "Target Audience", value: audience, unknown: isUnknown(audience) },
    {
      id: "value",
      label: "Main Value Proposition",
      value: proposition,
      unknown: isUnknown(proposition),
    },
    {
      id: "cta",
      label: "Primary Call To Action",
      value: understanding.primaryCta ? `“${understanding.primaryCta}”` : cta,
      unknown: !understanding.primaryCta,
    },
    { id: "tone", label: "Brand Tone", value: tone, unknown: isUnknown(tone) },
  ];

  const summary = (() => {
    const opening = isUnknown(type)
      ? `${name} ${hedge === "is" ? "does not state" : "does not appear to state"} what kind of site it is in its title, description or main heading.`
      : `${name} ${hedge} ${/^[aeiou]/i.test(type) ? "an" : "a"} ${type.toLowerCase()}.`;

    const middle = isUnknown(proposition)
      ? "The page does not lead with a clear value statement."
      : `The page leads with “${proposition}”.`;

    const closing = understanding.primaryCta
      ? `The clearest next step it offers a visitor ${hedge === "is" ? "is" : "seems to be"} “${understanding.primaryCta}”.`
      : evidence && evidence.forms.total > 0
        ? "There is no prominent call-to-action button, though the page does carry a form."
        : "No prominent call to action was found, so the intended next step is unclear.";

    const partialNote =
      confidence < 70
        ? " We could only partially understand this website from the available content."
        : "";

    return `${opening} ${middle} ${closing}${partialNote}`;
  })();

  return { fields, summary, confidence, partial: confidence < 70 };
}
