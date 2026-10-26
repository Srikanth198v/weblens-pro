import { describe, expect, it } from "vitest";

import { buildFindings } from "./findings";
import type { CategoryDetail } from "./types";

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
    expect(findings[0]!.severity).toBe("critical");
  });
  it("routes crawlability to technical health and viewport to mobile", () => {
    expect(findings.find((f) => f.id === "seo-crawlability")!.area).toBe("technical");
    expect(findings.find((f) => f.id === "design-mobile-ready")!.area).toBe("mobile");
  });
  it("omits unmapped design checks", () => {
    expect(findings.some((f) => f.id === "design-focal-point")).toBe(false);
  });
  it("never shows a fix on passed checks", () => {
    expect(findings.find((f) => f.id === "seo-title")!.fix).toBeNull();
  });
});
