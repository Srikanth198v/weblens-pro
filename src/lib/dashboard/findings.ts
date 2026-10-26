import type { CategoryDetail, CategoryFactor } from "@/lib/dashboard/types";

/**
 * Findings view: re-groups the already-measured checks into five report
 * areas. No new scoring — every finding is an existing measured check.
 */

export type FindingArea = "seo" | "performance" | "accessibility" | "mobile" | "technical";
export type FindingSeverity = "critical" | "warning" | "passed";

export type Finding = {
  id: string;
  area: FindingArea;
  title: string;
  severity: FindingSeverity;
  /** Page or element the check looked at. */
  affected: string;
  evidence: string;
  fix: string | null;
};

export const AREA_LABEL: Record<FindingArea, string> = {
  seo: "SEO",
  performance: "Performance",
  accessibility: "Accessibility",
  mobile: "Mobile usability",
  technical: "Technical health",
};

/** Checks that belong to mobile usability or technical health, by check id. */
const AREA_OVERRIDE: Record<string, FindingArea> = {
  "design-mobile-ready": "mobile",
  "a11y-viewport-zoom": "mobile",
  "design-layout-stability": "mobile",
  "perf-response-time": "technical",
  "perf-render-blocking": "technical",
  "seo-crawlability": "technical",
  "seo-structured-data": "technical",
  "design-inline-styles": "technical",
};

const AFFECTED: Record<string, string> = {
  "seo-title": "<title> tag",
  "seo-description": '<meta name="description">',
  "seo-social-preview": "Open Graph / Twitter meta tags",
  "seo-structured-data": "JSON-LD structured data",
  "seo-crawlability": "robots.txt, sitemap.xml, canonical link",
  "seo-content-depth": "Page body text",
  "perf-response-time": "HTML document response",
  "perf-page-weight": "HTML document size",
  "perf-render-blocking": "Scripts and stylesheets in <head>",
  "perf-third-party": "Third-party <script> tags",
  "perf-image-delivery": "<img> elements",
  "a11y-alt-text": "<img> alt attributes",
  "a11y-language": "<html lang> attribute",
  "a11y-form-labels": "Form inputs and labels",
  "a11y-structure": "Heading and landmark structure",
  "a11y-viewport-zoom": '<meta name="viewport">',
  "design-mobile-ready": '<meta name="viewport">',
  "design-layout-stability": "<img> width/height attributes",
  "design-inline-styles": "Inline style attributes",
};

function areaFor(categoryId: CategoryDetail["id"], factor: CategoryFactor): FindingArea | null {
  if (factor.id && AREA_OVERRIDE[factor.id]) return AREA_OVERRIDE[factor.id]!;
  if (categoryId === "seo" || categoryId === "performance" || categoryId === "accessibility") {
    return categoryId;
  }
  return null; // design/business checks stay in their own sections
}

const SEVERITY: Record<CategoryFactor["verdict"], FindingSeverity> = {
  fail: "critical",
  warn: "warning",
  pass: "passed",
};

const ORDER: Record<FindingSeverity, number> = { critical: 0, warning: 1, passed: 2 };

export function buildFindings(categories: CategoryDetail[], pageUrl: string): Finding[] {
  const findings: Finding[] = [];
  for (const category of categories) {
    category.factors.forEach((factor, index) => {
      const area = areaFor(category.id, factor);
      if (!area) return;
      const severity = SEVERITY[factor.verdict];
      findings.push({
        id: factor.id ?? `${category.id}-${index}`,
        area,
        title: factor.label,
        severity,
        affected: `${(factor.id && AFFECTED[factor.id]) || "Page"} — ${pageUrl}`,
        evidence: factor.detail,
        fix: severity === "passed" ? null : (factor.improvement ?? null),
      });
    });
  }
  return findings.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}
