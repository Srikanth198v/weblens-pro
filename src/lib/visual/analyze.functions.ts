import { createServerFn } from "@tanstack/react-start";

import { validateUrl } from "@/lib/url";
import { screenshotUrls } from "@/lib/visual/screenshots";
import {
  VISUAL_DIMENSION_LABEL,
  type VisualDimensionId,
  type VisualIntelligence,
} from "@/lib/visual/types";

/**
 * Looks at the rendered page, not its markup.
 *
 * The screenshots are captured first, then read by a vision model. If either
 * step fails we return the screenshots with an honest note instead of
 * inventing a visual review.
 */

const CAPTURE_ATTEMPTS = 3;
const CAPTURE_DELAY_MS = 2500;
/** Below this, the renderer is still returning a placeholder image. */
const MIN_IMAGE_BYTES = 12_000;

const DIMENSION_IDS: VisualDimensionId[] = [
  "first-impression",
  "hierarchy",
  "cta-clarity",
  "readability",
  "trust",
  "mobile",
];

const PIN_KINDS = ["primary-focus", "secondary-focus", "cta", "distraction", "trust-signal"];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function capture(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < CAPTURE_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength >= MIN_IMAGE_BYTES) {
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (const byte of bytes) binary += String.fromCharCode(byte);
          const type = response.headers.get("content-type") ?? "image/jpeg";
          return `data:${type};base64,${btoa(binary)}`;
        }
      }
    } catch {
      // Retry — the renderer is often still warming up.
    }
    await wait(CAPTURE_DELAY_MS);
  }
  return null;
}

const PROMPT = `You are a senior web design consultant reviewing a website from screenshots only.
The first image is the desktop view (1440px). The second, when present, is the mobile view (390px).

Judge only what is visible in the images. Never mention HTML, code or anything you cannot see.
Refer to concrete visible elements ("the emerald Get Started button top-right", "the three-column feature row").
Use measured, non-absolute language.

Return ONLY minified JSON with this exact shape:
{
 "summary": "3-4 sentence consultant read of how the page looks and feels on screen",
 "dimensions": [{"id":"first-impression|hierarchy|cta-clarity|readability|trust|mobile","score":0-100,"note":"what on screen produced this score"}],
 "checks": [{"label":"Headline visibility|CTA prominence|Competing elements|Above-the-fold clarity|White space|Alignment consistency|Readability|Trust indicators visible","verdict":"pass|warn|fail","detail":"one sentence about what is visible"}],
 "pins": [{"index":1-5,"kind":"primary-focus|secondary-focus|cta|distraction|trust-signal","label":"the visible element","x":0-100,"y":0-100}],
 "recommendations": [{"title":"...","evidence":"the visible element this is based on","area":"e.g. Hero, above the fold","impact":"Low|Medium|High"}]
}
Include all six dimensions and all eight checks. Give 3-5 pins positioned on the desktop image (x,y are percentages of its width and height) and 3-5 recommendations.`;

type RawVisual = {
  summary?: unknown;
  dimensions?: unknown;
  checks?: unknown;
  pins?: unknown;
  recommendations?: unknown;
};

function clampScore(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseVisual(content: string): Omit<VisualIntelligence, "screenshots" | "note"> | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  let raw: RawVisual;
  try {
    raw = JSON.parse(content.slice(start, end + 1)) as RawVisual;
  } catch {
    return null;
  }

  const dimensionsRaw = Array.isArray(raw.dimensions) ? raw.dimensions : [];
  const dimensions = DIMENSION_IDS.map((id) => {
    const match = dimensionsRaw.find(
      (entry) => (entry as { id?: string })?.id === id,
    ) as { score?: unknown; note?: unknown } | undefined;
    return {
      id,
      label: VISUAL_DIMENSION_LABEL[id],
      score: clampScore(match?.score),
      note: text(match?.note) || "Not assessable from the captured screenshots.",
    };
  });

  const summary = text(raw.summary);
  if (!summary) return null;

  const checks = (Array.isArray(raw.checks) ? raw.checks : [])
    .map((entry) => entry as { label?: unknown; verdict?: unknown; detail?: unknown })
    .filter((entry) => text(entry.label))
    .map((entry) => ({
      label: text(entry.label),
      verdict:
        entry.verdict === "pass" || entry.verdict === "fail"
          ? (entry.verdict as "pass" | "fail")
          : ("warn" as const),
      detail: text(entry.detail),
    }));

  const pins = (Array.isArray(raw.pins) ? raw.pins : [])
    .map((entry) => entry as Record<string, unknown>)
    .filter((entry) => PIN_KINDS.includes(String(entry["kind"])) && text(entry["label"]))
    .slice(0, 5)
    .map((entry, position) => ({
      index: position + 1,
      kind: String(entry["kind"]) as VisualIntelligence["pins"][number]["kind"],
      label: text(entry["label"]),
      x: Math.max(2, Math.min(98, Number(entry["x"]) || 50)),
      y: Math.max(2, Math.min(98, Number(entry["y"]) || 50)),
    }));

  const recommendations = (Array.isArray(raw.recommendations) ? raw.recommendations : [])
    .map((entry) => entry as Record<string, unknown>)
    .filter((entry) => text(entry["title"]) && text(entry["evidence"]))
    .slice(0, 6)
    .map((entry, position) => ({
      id: `visual-${position + 1}`,
      title: text(entry["title"]),
      evidence: text(entry["evidence"]),
      area: text(entry["area"]) || "Visible page area",
      impact:
        entry["impact"] === "High" || entry["impact"] === "Low"
          ? (entry["impact"] as "High" | "Low")
          : ("Medium" as const),
    }));

  const scored = dimensions.filter((dimension) => dimension.score > 0);
  const score = scored.length
    ? Math.round(scored.reduce((total, item) => total + item.score, 0) / scored.length)
    : 0;

  return { summary, score, dimensions, checks, pins, recommendations };
}

export const analyzeVisual = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => ({ url: String(data?.url ?? "") }))
  .handler(async ({ data }): Promise<VisualIntelligence | null> => {
    const validation = validateUrl(data.url);
    if (validation.status !== "valid") return null;

    const screenshots = screenshotUrls(validation.url);
    const [desktopImage, mobileImage] = await Promise.all([
      capture(screenshots.desktop!),
      capture(screenshots.mobile!),
    ]);

    if (!desktopImage) {
      return {
        screenshots: { desktop: null, mobile: null, fullPage: null },
        summary: "",
        score: 0,
        dimensions: [],
        checks: [],
        pins: [],
        recommendations: [],
        note: "A screenshot of this page could not be captured during this analysis, so no visual review was produced.",
      };
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        screenshots,
        summary: "",
        score: 0,
        dimensions: [],
        checks: [],
        pins: [],
        recommendations: [],
        note: "The screenshots were captured, but the visual review could not be completed during this analysis.",
      };
    }

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: PROMPT },
                { type: "image_url", image_url: { url: desktopImage } },
                ...(mobileImage
                  ? [{ type: "image_url", image_url: { url: mobileImage } }]
                  : []),
              ],
            },
          ],
        }),
      });

      if (!response.ok) throw new Error(`Gateway ${response.status}`);

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const parsed = parseVisual(payload.choices?.[0]?.message?.content ?? "");
      if (!parsed) throw new Error("Unreadable response");

      return {
        screenshots,
        ...parsed,
        note: mobileImage
          ? null
          : "The mobile screenshot could not be captured, so mobile visual quality is based on the desktop view alone.",
      };
    } catch {
      return {
        screenshots,
        summary: "",
        score: 0,
        dimensions: [],
        checks: [],
        pins: [],
        recommendations: [],
        note: "The screenshots were captured, but the visual review could not be completed during this analysis.",
      };
    }
  });
