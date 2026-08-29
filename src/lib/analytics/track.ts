/**
 * Privacy-conscious product analytics.
 *
 * Records only that something happened — never report contents, AI
 * conversations, URLs analysed, emails, passwords or any personal data.
 * A random per-device id (no personal information) lets us tell one visitor's
 * session from another. Every call is fire-and-forget and never throws, so
 * analytics can never break a user flow.
 */

import { supabase } from "@/integrations/supabase/client";

export type ProductEvent =
  | "analysis_started"
  | "analysis_completed"
  | "analysis_failed"
  | "ask_opened"
  | "ask_answered"
  | "report_saved"
  | "report_shared"
  | "signup_completed";

const ANON_KEY = "weblens:anon-id";

function anonId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(ANON_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(ANON_KEY, next);
    return next;
  } catch {
    return null;
  }
}

/** Only the route shape is kept — never query strings or ids. */
function safePath(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  return path.startsWith("/s/") ? "/s/:shareId" : path.slice(0, 200);
}

export function track(event: ProductEvent): void {
  if (typeof window === "undefined") return;
  void supabase
    .from("product_events")
    .insert({ event, anon_id: anonId(), path: safePath() })
    .then(
      () => undefined,
      () => undefined,
    );
}
