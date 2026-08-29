import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { FREE_MESSAGE_LIMIT, validateAskRequest, type AskResponse } from "@/lib/chat/ask.shared";

/**
 * Ask WebLens AI usage is account-bound: the balance lives in the database and
 * is spent through an atomic RPC, so every device signed into the same account
 * reads and shares one balance and concurrent questions cannot overspend it.
 */
export const askWebLens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateAskRequest)
  .handler(async ({ data, context }): Promise<AskResponse> => {
    const { supabase } = context;

    // Atomic: increments only while below the limit, returns -1 when exhausted.
    const { data: consumed, error: consumeError } = await supabase.rpc("consume_ask_question", {
      _limit: FREE_MESSAGE_LIMIT,
    });

    if (consumeError) {
      console.error("Ask WebLens AI usage error", consumeError);
      return {
        ok: false,
        reason: "error",
        message: "WebLens AI couldn't answer just now. Your question is still here — try again in a moment.",
        used: 0,
        remaining: FREE_MESSAGE_LIMIT,
      };
    }

    const used = Number(consumed ?? -1);
    if (used < 0) {
      return { ok: false, reason: "limit", used: FREE_MESSAGE_LIMIT, remaining: 0 };
    }

    const { buildBrief, askModel } = await import("@/lib/chat/ask.server");

    try {
      const answer = await askModel(buildBrief(data.context), data.messages);

      return {
        ok: true,
        answer,
        used,
        remaining: Math.max(0, FREE_MESSAGE_LIMIT - used),
      };
    } catch (error) {
      // Log the detail server-side; send the visitor a plain, non-technical
      // message so no provider, key or stack detail reaches the browser.
      console.error("Ask WebLens AI error", error);

      // A failed answer must not cost a question: give the credit back.
      const refunded = Math.max(0, used - 1);
      await supabase.rpc("refund_ask_question");

      const detail = error instanceof Error ? error.message : "";
      const rateLimited = /429|rate limit|quota/i.test(detail);
      return {
        ok: false,
        reason: "error",
        message: rateLimited
          ? "WebLens AI is handling a lot of questions right now. Wait a few seconds and send it again — this one didn't use a free question."
          : "WebLens AI couldn't answer just now. Your question is still here — try again in a moment.",
        used: refunded,
        remaining: Math.max(0, FREE_MESSAGE_LIMIT - refunded),
      };
    }
  });

/** Reads the account's remaining free questions without spending one. */
export const askUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_ask_usage");
    if (error) {
      console.error("Ask WebLens AI usage read error", error);
      return { used: 0, remaining: FREE_MESSAGE_LIMIT };
    }
    const used = Math.min(FREE_MESSAGE_LIMIT, Math.max(0, Number(data ?? 0)));
    return { used, remaining: Math.max(0, FREE_MESSAGE_LIMIT - used) };
  });
