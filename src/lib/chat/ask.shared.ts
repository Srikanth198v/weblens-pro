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
