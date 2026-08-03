import { createServerFn } from "@tanstack/react-start";

import { extractEvidence } from "@/lib/analysis/extract";
import type { SiteEvidence } from "@/lib/analysis/evidence";
import { validateUrl } from "@/lib/url";

const TIMEOUT_MS = 12000;
const ROBOTS_TIMEOUT_MS = 4000;
const MAX_BYTES = 2_000_000;

const UA = "WebLensAI/1.0 (+website analysis)";

async function fetchText(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Collects real evidence from the page: HTML, metadata, headings, images,
 * links, structured data and load measurements. If the page cannot be read,
 * we fail loudly rather than inventing an analysis.
 */
export const inspectWebsite = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => ({ url: String(data?.url ?? "") }))
  .handler(async ({ data }): Promise<{ ok: true; evidence: SiteEvidence } | { ok: false }> => {
    const validation = validateUrl(data.url);
    if (validation.status !== "valid") return { ok: false };

    const target = validation.url;
    const started = Date.now();

    try {
      const response = await fetchText(target, TIMEOUT_MS);
      if (!response.ok) return { ok: false };

      const raw = await response.text();
      const fetchMs = Date.now() - started;
      const html = raw.length > MAX_BYTES ? raw.slice(0, MAX_BYTES) : raw;
      const finalUrl = response.url || target;

      let robotsTxt: boolean | null = null;
      let sitemap: boolean | null = null;
      try {
        const robotsUrl = new URL("/robots.txt", finalUrl).toString();
        const robotsResponse = await fetchText(robotsUrl, ROBOTS_TIMEOUT_MS);
        robotsTxt = robotsResponse.ok;
        if (robotsResponse.ok) {
          const body = (await robotsResponse.text()).slice(0, 20000);
          sitemap = /sitemap\s*:/i.test(body);
        }
      } catch {
        robotsTxt = null;
      }

      const evidence = extractEvidence({
        html,
        finalUrl,
        status: response.status,
        redirected: response.redirected,
        fetchMs,
        htmlBytes: new TextEncoder().encode(raw).length,
        robotsTxt,
        sitemap,
      });

      return { ok: true, evidence };
    } catch {
      return { ok: false };
    }
  });
