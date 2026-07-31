/**
 * URL validation for the analysis input.
 * Presentation layer never parses URLs itself — it calls these helpers.
 */

export type UrlValidation =
  | { status: "empty" }
  | { status: "invalid"; message: string }
  | { status: "valid"; url: string };

const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

/** Adds https:// when the user typed a bare domain. */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function validateUrl(raw: string): UrlValidation {
  const trimmed = raw.trim();
  if (!trimmed) return { status: "empty" };

  let parsed: URL;
  try {
    parsed = new URL(normalizeUrl(trimmed));
  } catch {
    return {
      status: "invalid",
      message: "That address doesn't look complete yet. Try something like example.com.",
    };
  }

  if (!HOST_PATTERN.test(parsed.hostname)) {
    return {
      status: "invalid",
      message: "That address doesn't look complete yet. Try something like example.com.",
    };
  }

  return { status: "valid", url: parsed.toString() };
}
