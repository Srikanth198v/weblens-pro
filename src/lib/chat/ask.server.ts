/**
 * Ask WebLens AI — server-only helpers.
 *
 * Holds the prompt, the model call and the brief builder. The API key never
 * leaves this boundary.
 */

import type { AskReportContext } from "@/lib/chat/context";
import type { AskMessage } from "@/lib/chat/ask.shared";

const BASE_URL = "https://agentrouter.org/v1";
const MODEL = "gpt-5.6-sol";
const TIMEOUT_MS = 30_000;

export const SYSTEM_PROMPT = `You are WebLens AI, the in-product analysis assistant. You are never "ChatGPT" or "OpenAI" — you are WebLens AI.

You answer questions about ONE specific website analysis. A structured report brief is supplied with every question.

Rules:
- Answer only from the supplied report. Never invent metrics, page facts, traffic data, competitors or features that are not in it.
- Separate measured evidence from advice. Say "measured" for facts from the report, and frame suggestions as recommendations.
- Reference the relevant score or evidence line when you explain something.
- If the report lacks the evidence needed, say plainly what was not measured and what would be needed.
- Respect the detected website category and the contextual rules. Never recommend anything the report lists under "Not applicable" (for example testimonials or homepage pricing on an enterprise/global brand).
- Be concise and actionable: short paragraphs or tight bullet lists, no filler, no preamble.
- Professional, clear, consultant-like brand voice.`;

function section(title: string, lines: string[]): string {
  return lines.length ? `${title}:\n${lines.map((line) => `- ${line}`).join("\n")}` : "";
}

export function buildBrief(context: AskReportContext): string {
  return [
    `Website: ${context.siteName} (${context.url})`,
    `Analysed: ${context.completedAt}`,
    `Overall score: ${context.overallScore}/100`,
    section(
      "Category scores (weight of overall)",
      context.scores.map((s) => `${s.label}: ${s.score}/100 (weight ${s.weight}%)`),
    ),
    `Detected website category: ${context.classification.primary} (confidence ${context.classification.confidence}%)${
      context.classification.secondary.length
        ? `; also shows: ${context.classification.secondary.join(", ")}`
        : ""
    }`,
    `Advice focus for this category: ${context.classification.focus}`,
    section("Classification signals observed", context.classification.signals),
    section("Website understanding", context.understanding),
    `Analysis confidence: ${context.confidence.score}%. Sources read: ${
      context.confidence.sourcesUsed.join(", ") || "none"
    }. Not available: ${context.confidence.sourcesMissing.join(", ") || "none"}`,
    section("Measured evidence", context.evidence),
    section("Detected problems", context.problems),
    section(
      "Business review",
      context.business.map((metric) =>
        metric.notApplicable
          ? `${metric.label}: NOT APPLICABLE — ${metric.notApplicable}`
          : `${metric.label}: ${metric.score}/100 — ${metric.evidence}`,
      ),
    ),
    section("NOT APPLICABLE for this website (never recommend these)", context.notApplicable),
    section(
      "Priority recommendations",
      context.priorities.map(
        (item) =>
          `${item.title} [${item.priority} priority, ${item.effort} effort] — evidence: ${item.evidence.join("; ") || "n/a"} — fixes: ${item.fixes.join("; ") || "n/a"}`,
      ),
    ),
    section(
      "All recommendations",
      context.recommendations.map(
        (item) =>
          `${item.title} (${item.category}, ${item.priority}, impact ${item.impact}, ${item.difficulty}, ~${item.estimatedTime}) — evidence: ${item.evidence.join("; ") || "n/a"} — fixes: ${item.fixes.join("; ") || "n/a"}`,
      ),
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function askModel(brief: string, messages: AskMessage[]): Promise<string> {
  const apiKey = process.env["AGENTROUTER_API_KEY"];
  if (!apiKey) throw new Error("The assistant is not configured on this deployment.");

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `Report brief for this conversation:\n\n${brief}` },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    console.error(`Ask WebLens AI failed: ${response.status}`);
    throw new Error("WebLens AI could not answer just now. Please try again.");
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: unknown } }[] };
  const content = payload.choices?.[0]?.message?.content;
  const answer = typeof content === "string" ? content.trim() : "";
  if (!answer) throw new Error("WebLens AI returned an empty answer. Please try again.");

  return answer;
}
