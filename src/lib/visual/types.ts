/**
 * Visual Intelligence contract.
 *
 * Everything here is derived from the captured screenshots. If a screenshot
 * could not be captured or read, the report says so rather than guessing.
 */

export type VisualPinKind =
  | "primary-focus"
  | "secondary-focus"
  | "cta"
  | "distraction"
  | "trust-signal";

export const VISUAL_PIN_LABEL: Record<VisualPinKind, string> = {
  "primary-focus": "Primary focus",
  "secondary-focus": "Secondary focus",
  cta: "Call to action",
  distraction: "Distraction",
  "trust-signal": "Trust signal",
};

export type VisualPin = {
  /** 1–5, in the order the consultant walks the page. */
  index: number;
  kind: VisualPinKind;
  /** The element visible on the screenshot this pin marks. */
  label: string;
  /** Position on the desktop screenshot, in percent. */
  x: number;
  y: number;
};

export type VisualDimensionId =
  | "first-impression"
  | "hierarchy"
  | "cta-clarity"
  | "readability"
  | "trust"
  | "mobile";

export type VisualDimension = {
  id: VisualDimensionId;
  label: string;
  score: number;
  /** What was visible on screen that produced this score. */
  note: string;
};

export type VisualCheck = {
  label: string;
  verdict: "pass" | "warn" | "fail";
  detail: string;
};

export type VisualRecommendation = {
  id: string;
  title: string;
  /** The visible element(s) on the screenshot this is based on. */
  evidence: string;
  /** Where on the page it applies, e.g. "Hero, above the fold". */
  area: string;
  impact: "Low" | "Medium" | "High";
};

export type VisualScreenshots = {
  desktop: string | null;
  mobile: string | null;
  /** Full-page capture when the provider can produce one. */
  fullPage: string | null;
};

export type VisualIntelligence = {
  screenshots: VisualScreenshots;
  /** Consultant-style read of the page as it appears on screen. */
  summary: string;
  /** Visual Experience score, 0–100, averaged from the dimensions. */
  score: number;
  dimensions: VisualDimension[];
  checks: VisualCheck[];
  pins: VisualPin[];
  recommendations: VisualRecommendation[];
  /** Present when the screenshots were captured but could not be interpreted. */
  note: string | null;
};

export const VISUAL_DIMENSION_LABEL: Record<VisualDimensionId, string> = {
  "first-impression": "First impression",
  hierarchy: "Hierarchy",
  "cta-clarity": "CTA clarity",
  readability: "Readability",
  trust: "Trust",
  mobile: "Mobile visual quality",
};
