import type { AskReportContext } from "@/lib/chat/context";

/** Free questions allowed per visitor before the upgrade prompt appears. */
export const FREE_MESSAGE_LIMIT = 8;

export type AskMessage = { role: "user" | "assistant"; content: string };

export type AskRequest = {
  context: AskReportContext;
  messages: AskMessage[];
};

export type AskResponse =
  | { ok: true; answer: string; used: number; remaining: number }
  | { ok: false; reason: "limit"; used: number; remaining: 0 }
  | { ok: false; reason: "error"; message: string; used: number; remaining: number };

export const STARTER_QUESTIONS = [
  "What should I fix first?",
  "Why is my score this low?",
  "Explain my SEO problems",
  "How can I improve performance?",
  "Is my website mobile-friendly?",
  "Give me a simple action plan",
] as const;

/** Normalizes and validates an incoming ask request payload. */
export function validateAskRequest(input: unknown): AskRequest {
  const value = (input ?? {}) as Partial<AskRequest>;
  const context = value.context;
  if (!context || typeof context.url !== "string" || !context.url) {
    throw new Error("A completed analysis is required.");
  }

  const messages: AskMessage[] = (Array.isArray(value.messages) ? value.messages : [])
    .map((item) => item as Partial<AskMessage>)
    .filter(
      (item): item is AskMessage =>
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .slice(-12)
    .map((item) => ({ role: item.role, content: item.content.slice(0, 1200) }));

  if (!messages.some((item) => item.role === "user")) throw new Error("A question is required.");

  return { context, messages };
}
