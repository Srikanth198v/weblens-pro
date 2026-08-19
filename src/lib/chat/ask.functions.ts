import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

import type { AskReportContext } from "@/lib/chat/context";
import { FREE_MESSAGE_LIMIT, type AskMessage, type AskRequest, type AskResponse } from "@/lib/chat/ask.shared";

function validate(input: unknown): AskRequest {
  const value = (input ?? {}) as Partial<AskRequest>;
  const context = value.context as AskReportContext | undefined;
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

export const askWebLens = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<AskResponse> => {
    const password =
      process.env["ASK_SESSION_SECRET"] ??
      `weblens-ask-session-fallback-secret-${process.env["AGENTROUTER_API_KEY"] ?? "local"}`.slice(0, 64);

    const session = await useSession<{ used?: number }>({
      name: "weblens_ask",
      password: password.padEnd(32, "0"),
    });

    const used = Number(session.data.used ?? 0);
    if (used >= FREE_MESSAGE_LIMIT) {
      return { ok: false, reason: "limit", used: FREE_MESSAGE_LIMIT, remaining: 0 };
    }

    const { buildBrief, askModel } = await import("@/lib/chat/ask.server");

    try {
      const answer = await askModel(buildBrief(data.context), data.messages);
      const nextUsed = used + 1;
      await session.update({ used: nextUsed });

      return {
        ok: true,
        answer,
        used: nextUsed,
        remaining: Math.max(0, FREE_MESSAGE_LIMIT - nextUsed),
      };
    } catch (error) {
      console.error("Ask WebLens AI error", error);
      return {
        ok: false,
        reason: "error",
        message:
          error instanceof Error ? error.message : "WebLens AI could not answer just now.",
        used,
        remaining: Math.max(0, FREE_MESSAGE_LIMIT - used),
      };
    }
  });

/** Reads the remaining free questions without spending one. */
export const askUsage = createServerFn({ method: "GET" }).handler(async () => {
  const password =
    process.env["ASK_SESSION_SECRET"] ??
    `weblens-ask-session-fallback-secret-${process.env["AGENTROUTER_API_KEY"] ?? "local"}`.slice(0, 64);

  const session = await useSession<{ used?: number }>({
    name: "weblens_ask",
    password: password.padEnd(32, "0"),
  });

  const used = Math.min(FREE_MESSAGE_LIMIT, Number(session.data.used ?? 0));
  return { used, remaining: Math.max(0, FREE_MESSAGE_LIMIT - used) };
});
