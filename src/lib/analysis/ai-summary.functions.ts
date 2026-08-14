import { createServerFn } from "@tanstack/react-start";

/**
 * GPT Integration v1 — one real, model-written reading of the website.
 *
 * The key stays server-side. If the model is unavailable, slow or returns
 * something we cannot parse, we say so and the caller falls back to the
 * existing rule-based summary.
 */

const BASE_URL = "https://agentrouter.org/v1";
const MODEL = "gpt-5.6-sol";
const TIMEOUT_MS = 12_000;

export type GptSummaryPayload = {
  url: string;
  title: string;
  metaDescription: string;
  topHeadings: string[];
  primaryButtons: string[];
  scores: { label: string; score: number }[];
  screenshot: string;
  websiteType: string;
  audience: string;
  purpose: string;
};

export type GptSummary = {
  summary: string;
  valueProposition: string;
  brandTone: string;
  confidence: number;
};

export type GptSummaryResult =
  | { ok: true; data: GptSummary }
  | { ok: false; reason: string };

const PROMPT = `You are a senior digital consultant summarising a website for a client report.

Work only from the structured facts provided. Never invent facts, features, pricing, claims or audiences that are not supported by the data. Where the data is thin, say so plainly and use hedged language ("appears to", "seems to").

Write like a consultant, not a marketer. No generic SEO advice, no recommendations, no bullet lists, no headings.

Return ONLY minified JSON with exactly this shape:
{"summary":"under 120 words describing the business, its audience and the main value it offers","valueProposition":"one sentence","brandTone":"two to four descriptive words","confidence":0-100}

confidence reflects how much the supplied data actually reveals about the business.`;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parse(content: string): GptSummary | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }

  const summary = text(raw["summary"]);
  if (!summary) return null;

  const confidenceValue = Number(raw["confidence"]);
  const confidence = Number.isFinite(confidenceValue)
    ? Math.max(0, Math.min(100, Math.round(confidenceValue)))
    : 0;

  return {
    summary,
    valueProposition: text(raw["valueProposition"]),
    brandTone: text(raw["brandTone"]),
    confidence,
  };
}

function validate(input: unknown): GptSummaryPayload {
  const value = (input ?? {}) as Partial<GptSummaryPayload>;
  if (!text(value.url)) throw new Error("A website address is required.");

  const strings = (list: unknown): string[] =>
    (Array.isArray(list) ? list : []).map((item) => text(item)).filter(Boolean).slice(0, 8);

  return {
    url: text(value.url),
    title: text(value.title),
    metaDescription: text(value.metaDescription),
    topHeadings: strings(value.topHeadings),
    primaryButtons: strings(value.primaryButtons),
    scores: (Array.isArray(value.scores) ? value.scores : [])
      .map((entry) => entry as { label?: unknown; score?: unknown })
      .filter((entry) => text(entry.label))
      .slice(0, 8)
      .map((entry) => ({ label: text(entry.label), score: Number(entry.score) || 0 })),
    screenshot: text(value.screenshot),
    websiteType: text(value.websiteType),
    audience: text(value.audience),
    purpose: text(value.purpose),
  };
}

export const generateAiSummary = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<GptSummaryResult> => {
    const apiKey = process.env["AGENTROUTER_API_KEY"];
    if (!apiKey) return { ok: false, reason: "missing-key" };

    const facts = [
      `URL: ${data.url}`,
      `Page title: ${data.title || "not stated"}`,
      `Meta description: ${data.metaDescription || "not stated"}`,
      `Top headings: ${data.topHeadings.join(" | ") || "none read"}`,
      `Primary buttons: ${data.primaryButtons.join(" | ") || "none detected"}`,
      `Measured scores: ${
        data.scores.map((entry) => `${entry.label} ${entry.score}/100`).join(", ") || "not measured"
      }`,
      `Screenshot available: ${data.screenshot ? "yes" : "no"}`,
      `Detected website type: ${data.websiteType || "unknown"}`,
      `Detected audience: ${data.audience || "unknown"}`,
      `Detected purpose: ${data.purpose || "unknown"}`,
    ].join("\n");

    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: PROMPT },
            { role: "user", content: facts },
          ],
        }),
      });

      if (!response.ok) {
        console.error(`AgentRouter summary failed: ${response.status}`);
        return { ok: false, reason: `status-${response.status}` };
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const content = text(payload.choices?.[0]?.message?.content);
      const parsed = content ? parse(content) : null;
      if (!parsed) {
        console.error("AgentRouter summary returned unusable content.");
        return { ok: false, reason: "invalid-json" };
      }

      return { ok: true, data: parsed };
    } catch (error) {
      console.error("AgentRouter summary error", error);
      return { ok: false, reason: "network" };
    }
  });
