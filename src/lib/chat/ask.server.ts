/**
 * Ask WebLens AI — server-only helpers.
 *
 * Holds the prompt, the model call and the brief builder. The API key never
 * leaves this boundary.
 */

import type { AskReportContext } from "@/lib/chat/context";
import type { AskMessage } from "@/lib/chat/ask.shared";

const AGENTROUTER_URL = "https://agentrouter.org/v1/chat/completions";
const AGENTROUTER_MODEL = "gpt-5.6-sol";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GATEWAY_MODEL = "google/gemini-3-flash-preview";

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

type Provider = { name: string; url: string; model: string; key: string };

/** Calls one OpenAI-compatible provider and returns its answer text. */
async function callProvider(
  provider: Provider,
  brief: string,
  messages: AskMessage[],
): Promise<string> {
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${provider.key}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: `Report brief for this conversation:\n\n${brief}` },
        ...messages,
      ],
    }),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    console.error(
      `[ask-weblens] ${provider.name} HTTP ${response.status}: ${rawBody.slice(0, 400)}`,
    );
    throw new Error(`${provider.name} responded with status ${response.status}`);
  }

  let payload: { choices?: { message?: { content?: unknown } }[] };
  try {
    payload = JSON.parse(rawBody) as { choices?: { message?: { content?: unknown } }[] };
  } catch {
    console.error(
      `[ask-weblens] ${provider.name} returned a non-JSON body: ${rawBody.slice(0, 400)}`,
    );
    throw new Error(`${provider.name} returned a non-JSON body`);
  }

  const content = payload.choices?.[0]?.message?.content;
  const answer = typeof content === "string" ? content.trim() : "";
  if (!answer) {
    console.error(`[ask-weblens] ${provider.name} returned an empty answer.`);
    throw new Error(`${provider.name} returned an empty answer`);
  }

  return answer;
}

/**
 * Asks the model. AgentRouter is tried first when configured; the Lovable AI
 * gateway is the fallback so the assistant keeps working when AgentRouter is
 * unreachable (it is currently behind a bot-protection page for server IPs).
 */
export async function askModel(brief: string, messages: AskMessage[]): Promise<string> {
  const agentRouterKey = process.env["AGENTROUTER_API_KEY"];
  const gatewayKey = process.env["LOVABLE_API_KEY"];

  const providers: Provider[] = [];
  if (agentRouterKey) {
    providers.push({
      name: "agentrouter",
      url: AGENTROUTER_URL,
      model: AGENTROUTER_MODEL,
      key: agentRouterKey,
    });
  }
  if (gatewayKey) {
    providers.push({
      name: "lovable-gateway",
      url: GATEWAY_URL,
      model: GATEWAY_MODEL,
      key: gatewayKey,
    });
  }

  if (providers.length === 0) {
    console.error("[ask-weblens] No AI provider key configured.");
    throw new Error("The assistant is not configured on this deployment.");
  }

  let lastError: unknown = null;
  for (const provider of providers) {
    try {
      return await callProvider(provider, brief, messages);
    } catch (error) {
      lastError = error;
      console.error(`[ask-weblens] provider ${provider.name} failed`, error);
    }
  }

  console.error("[ask-weblens] all providers failed", lastError);
  throw new Error("WebLens AI could not answer just now. Please try again.");
}
