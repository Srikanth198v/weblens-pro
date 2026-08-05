import type { SiteEvidence } from "@/lib/analysis/evidence";

/**
 * Evidence ledger.
 *
 * Phase 7 rule: the report may only claim what was actually collected. This
 * module turns the raw evidence object into an auditable list of what was
 * read, what could not be read, and how much of the picture that leaves us
 * with. Nothing here infers a finding — it only reports collection status.
 */

export type EvidenceStatus = "collected" | "not-available" | "blocked" | "skipped" | "timed-out";

export const EVIDENCE_STATUS_LABEL: Record<EvidenceStatus, string> = {
  collected: "Collected",
  "not-available": "Not available",
  blocked: "Blocked",
  skipped: "Skipped",
  "timed-out": "Timed out",
};

export type EvidenceItem = {
  id: string;
  label: string;
  status: EvidenceStatus;
  /** What was found, or why it could not be collected. */
  detail: string;
  /** Share of the confidence calculation this item carries. */
  weight: number;
};

export type ConfidenceLevel = "Very High" | "High" | "Moderate" | "Limited";
export type QualityLevel = "Excellent" | "High" | "Moderate" | "Limited";

export type EvidenceReport = {
  items: EvidenceItem[];
  collectedCount: number;
  totalCount: number;
  /** 0–100, weighted by how important each source is to the conclusions. */
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  confidenceNote: string;
  quality: QualityLevel;
  qualityNote: string;
  limitations: Array<{ title: string; detail: string }>;
  methodology: Array<{ title: string; detail: string }>;
};

function level(score: number): ConfidenceLevel {
  if (score >= 85) return "Very High";
  if (score >= 70) return "High";
  if (score >= 50) return "Moderate";
  return "Limited";
}

function quality(score: number): QualityLevel {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "High";
  if (score >= 50) return "Moderate";
  return "Limited";
}

const METHODOLOGY: Array<{ title: string; detail: string }> = [
  {
    title: "Website verification",
    detail:
      "We first check that the address resolves and responds, and follow any redirects to the page a visitor would actually land on.",
  },
  {
    title: "HTML analysis",
    detail:
      "The page's own markup is read to see how it is structured: headings, images, links, forms and scripts.",
  },
  {
    title: "Metadata extraction",
    detail:
      "Title, description, canonical, robots, social sharing tags and favicon are read exactly as search engines and social platforms would read them.",
  },
  {
    title: "Load measurement",
    detail:
      "We measure how long the page took to respond and how heavy the document is, and count anything that blocks the first render.",
  },
  {
    title: "Accessibility checks",
    detail:
      "Markup-level checks look for language settings, image alternatives, form labels and heading order.",
  },
  {
    title: "Business understanding",
    detail:
      "The page's own words — headline, description, navigation and calls to action — are used to describe what the site appears to be for.",
  },
  {
    title: "Interpretation",
    detail:
      "Each measurement is scored against a published weighting, then translated into plain-language guidance. Every conclusion links back to the measurement it came from.",
  },
];

const LIMITATIONS: Array<{ title: string; detail: string }> = [
  {
    title: "Pages behind a login",
    detail: "Authenticated dashboards and member areas were not reached during this analysis.",
  },
  {
    title: "Private APIs and backend behaviour",
    detail: "Server-side logic and private endpoints are not visible from a public page request.",
  },
  {
    title: "Content added after load",
    detail:
      "Anything rendered only after scripts run in a real browser may not appear in the collected markup.",
  },
  {
    title: "Blocked or restricted resources",
    detail:
      "Files a site chooses not to serve to automated requests cannot be inspected, and are reported as unavailable rather than assumed.",
  },
  {
    title: "Pages other than the one submitted",
    detail:
      "Only the submitted address was analysed. Findings describe that page, not the whole site.",
  },
];

/** Sources we deliberately do not claim, so the report never over-states itself. */
const UNCOLLECTED: Array<Omit<EvidenceItem, "weight"> & { weight: number }> = [
  {
    id: "screenshot",
    label: "Website screenshot",
    status: "skipped",
    detail: "Visual capture is not part of this analysis, so no visual claims are made.",
    weight: 0,
  },
  {
    id: "lighthouse",
    label: "Lighthouse lab metrics",
    status: "not-available",
    detail:
      "Browser-based lab metrics were not run. Speed findings come from the measured server response and render-blocking resources instead.",
    weight: 0,
  },
];

export function buildEvidenceReport(evidence: SiteEvidence | null): EvidenceReport {
  if (!evidence) {
    return {
      items: UNCOLLECTED.map((item) => ({ ...item })),
      collectedCount: 0,
      totalCount: 0,
      confidence: 0,
      confidenceLevel: "Limited",
      confidenceNote:
        "No evidence was stored with this analysis, so nothing on this page can be verified. Re-run the analysis to collect it.",
      quality: "Limited",
      qualityNote: "No sources were available for this saved analysis.",
      limitations: LIMITATIONS,
      methodology: METHODOLOGY,
    };
  }

  const items: EvidenceItem[] = [
    {
      id: "html",
      label: "HTML document",
      status: "collected",
      detail: `${(evidence.htmlBytes / 1024).toFixed(0)} KB of markup read from ${evidence.finalUrl}${
        evidence.redirected ? " (after redirect)" : ""
      }.`,
      weight: 3,
    },
    {
      id: "metadata",
      label: "Metadata",
      status: evidence.metadata.title || evidence.metadata.description ? "collected" : "not-available",
      detail:
        evidence.metadata.title || evidence.metadata.description
          ? `Title, description and indexing tags read${evidence.metadata.canonical ? ", canonical present" : ""}.`
          : "No title or description was present in the page markup.",
      weight: 2,
    },
    {
      id: "headings",
      label: "Heading structure",
      status: evidence.headings.total > 0 ? "collected" : "not-available",
      detail:
        evidence.headings.total > 0
          ? `${evidence.headings.total} headings read, including ${evidence.headings.h1.length} H1.`
          : "No headings were detected in the markup.",
      weight: 2,
    },
    {
      id: "images",
      label: "Images",
      status: evidence.images.total > 0 ? "collected" : "not-available",
      detail:
        evidence.images.total > 0
          ? `${evidence.images.total} images inspected, ${evidence.images.missingAlt} without alternative text.`
          : "No images were found in the markup.",
      weight: 1,
    },
    {
      id: "links",
      label: "Internal links",
      status: evidence.links.total > 0 ? "collected" : "not-available",
      detail:
        evidence.links.total > 0
          ? `${evidence.links.total} links read (${evidence.links.internal} internal, ${evidence.links.external} external).`
          : "No links were detected on the page.",
      weight: 1,
    },
    {
      id: "performance",
      label: "Load measurements",
      status: "collected",
      detail: `Document responded in ${evidence.fetchMs} ms with ${evidence.scripts.renderBlocking + evidence.styles.renderBlocking} render-blocking resources.`,
      weight: 3,
    },
    {
      id: "accessibility",
      label: "Accessibility markup",
      status:
        evidence.images.total + evidence.forms.inputs > 0 || evidence.document.lang
          ? "collected"
          : "not-available",
      detail:
        evidence.document.lang
          ? `Language set to “${evidence.document.lang}”; labels, alternatives and heading order checked.`
          : "Language attribute not detected; remaining markup checks were still applied.",
      weight: 2,
    },
    {
      id: "open-graph",
      label: "Open Graph & social tags",
      status: evidence.metadata.ogTitle || evidence.metadata.ogImage ? "collected" : "not-available",
      detail:
        evidence.metadata.ogTitle || evidence.metadata.ogImage
          ? "Social sharing tags detected and read."
          : "No Open Graph tags were detected during this analysis.",
      weight: 1,
    },
    {
      id: "structured-data",
      label: "Structured data",
      status: evidence.structuredData.present ? "collected" : "not-available",
      detail: evidence.structuredData.present
        ? `Schema types detected: ${evidence.structuredData.types.join(", ") || "unnamed"}.`
        : "No structured data was detected during this analysis.",
      weight: 1,
    },
    {
      id: "robots",
      label: "Robots.txt",
      status:
        evidence.network.robotsTxt === true
          ? "collected"
          : evidence.network.robotsTxt === false
            ? "not-available"
            : "timed-out",
      detail:
        evidence.network.robotsTxt === true
          ? "robots.txt was reachable and read."
          : evidence.network.robotsTxt === false
            ? "robots.txt was not served at the usual address."
            : "The request for robots.txt did not complete in time.",
      weight: 1,
    },
    {
      id: "sitemap",
      label: "Sitemap.xml",
      status:
        evidence.network.sitemap === true
          ? "collected"
          : evidence.network.sitemap === false
            ? "not-available"
            : "skipped",
      detail:
        evidence.network.sitemap === true
          ? "A sitemap reference was found in robots.txt."
          : evidence.network.sitemap === false
            ? "No sitemap reference was found in robots.txt."
            : "Sitemap could not be checked because robots.txt was unavailable.",
      weight: 1,
    },
    ...UNCOLLECTED.map((item) => ({ ...item })),
  ];

  const scored = items.filter((item) => item.weight > 0);
  const totalWeight = scored.reduce((sum, item) => sum + item.weight, 0);
  const gotWeight = scored
    .filter((item) => item.status === "collected")
    .reduce((sum, item) => sum + item.weight, 0);
  const confidence = totalWeight ? Math.round((gotWeight / totalWeight) * 100) : 0;

  const collectedCount = scored.filter((item) => item.status === "collected").length;
  const missing = scored.filter((item) => item.status !== "collected");

  return {
    items,
    collectedCount,
    totalCount: scored.length,
    confidence,
    confidenceLevel: level(confidence),
    confidenceNote: missing.length
      ? `Based on ${collectedCount} of ${scored.length} evidence sources. Confidence is reduced because ${missing
          .slice(0, 3)
          .map((item) => item.label.toLowerCase())
          .join(", ")}${missing.length > 3 ? " and others" : ""} could not be collected.`
      : `Every evidence source we check was collected successfully for this page.`,
    quality: quality(confidence),
    qualityNote: missing.length
      ? `${collectedCount} of ${scored.length} sources returned usable data during this analysis.`
      : "All sources returned usable data during this analysis.",
    limitations: LIMITATIONS,
    methodology: METHODOLOGY,
  };
}
