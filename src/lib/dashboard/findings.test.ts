import { describe, expect, it } from "vitest";

import { buildFindings, findingFixText } from "./findings";
import type { CategoryDetail, Recommendation } from "./types";

const base = { summary: "", measured: [], whyThisScore: "", biggestFactor: "", whatWouldImprove: "", strengths: [], weaknesses: [], suggestions: [], score: 50 };

const cats: CategoryDetail[] = [
  { ...base, id: "seo", label: "SEO", factors: [
    { id: "seo-title", label: "Title", detail: "ok", verdict: "pass", improvement: "x" },
    { id: "seo-crawlability", label: "Crawl", detail: "no sitemap", verdict: "fail", improvement: "Add sitemap" },
  ] },
  { ...base, id: "design", label: "Design", factors: [
    { id: "design-mobile-ready", label: "Viewport", detail: "missing", verdict: "warn" },
    { id: "design-focal-point", label: "Focal", detail: "-", verdict: "fail" },
  ] },
];

describe("buildFindings", () => {
  const findings = buildFindings(cats, "example.com");
  it("maps fail to critical and sorts it first", () => {
    expect(findings[0]?.severity).toBe("critical");
  });
  it("routes crawlability to technical health and viewport to mobile", () => {
    expect(findings.find((f) => f.id === "seo-crawlability")?.area).toBe("technical");
    expect(findings.find((f) => f.id === "design-mobile-ready")?.area).toBe("mobile");
  });
  it("omits unmapped design checks", () => {
    expect(findings.some((f) => f.id === "design-focal-point")).toBe(false);
  });
  it("never shows a fix on passed checks", () => {
    expect(findings.find((f) => f.id === "seo-title")?.fix).toBeNull();
  });
});

const recommendation: Recommendation = {
  id: "seo-crawlability", category: "seo", icon: "search", title: "Publish sitemap",
  description: "Publish the sitemap", evidence: ["no sitemap"], sources: ["Metadata"],
  whyItMatters: "Help search engines discover pages.", businessImpact: "Search visibility",
  howToFix: ["Publish sitemap.xml", "Re-run the analysis"], currentState: "no sitemap",
  recommendedState: "Sitemap available", expectedResults: ["Improved discovery"],
  estimatedGain: 2, priority: "high", impact: "High", difficulty: "Easy", estimatedTime: "15 Minutes",
};

describe("finding guidance", () => {
  it("joins only the existing recommendation with the same check ID", () => {
    const findings = buildFindings(cats, "example.com", [recommendation]);
    expect(findings.find((f) => f.id === "seo-crawlability")?.recommendation).toEqual(recommendation);
    expect(findings.find((f) => f.id === "design-mobile-ready")?.recommendation).toBeNull();
  });
  it("does not attach suggested changes to passed checks", () => {
    const finding = buildFindings(cats, "example.com", [{ ...recommendation, id: "seo-title" }]).find((f) => f.id === "seo-title");
    expect(finding?.recommendation).toBeNull();
    if (!finding) throw new Error("Missing title check");
    expect(findingFixText(finding)).toBeNull();
  });
  it("copies the measured finding's existing steps without other report data", () => {
    const finding = buildFindings(cats, "example.com", [recommendation]).find((f) => f.id === "seo-crawlability");
    if (!finding) throw new Error("Missing crawlability check");
    expect(findingFixText(finding)).toBe("Crawl\n1. Publish sitemap.xml\n2. Re-run the analysis");
  });
  it("keeps measured fixes for older reports without inventing effort or impact", () => {
    const finding = buildFindings(cats, "example.com").find((f) => f.id === "seo-crawlability");
    if (!finding) throw new Error("Missing crawlability check");
    expect(finding.recommendation).toBeNull();
    expect(findingFixText(finding)).toBe("Crawl\n1. Add sitemap");
  });
});
