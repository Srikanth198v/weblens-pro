import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";

import { FREE_MESSAGE_LIMIT, validateAskRequest, type AskResponse } from "@/lib/chat/ask.shared";

export const askWebLens = createServerFn({ method: "POST" })
  .inputValidator(validateAskRequest)
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
