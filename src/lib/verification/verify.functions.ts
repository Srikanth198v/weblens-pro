import { createServerFn } from "@tanstack/react-start";

import { validateUrl } from "@/lib/url";
import { buildChecks, classifyStatus, describeFailure } from "@/lib/verification/verify.shared";
import type { VerificationResult } from "@/lib/verification/types";

const TIMEOUT_MS = 8000;

/**
 * Server-side reachability check. Runs before any analysis work so we never
 * produce a report for a site that doesn't exist or doesn't respond.
 */
export const verifyWebsite = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => ({ url: String(data?.url ?? "") }))
  .handler(async ({ data }): Promise<VerificationResult> => {
    const validation = validateUrl(data.url);
    if (validation.status !== "valid") {
      return { ok: false, code: "invalid-url", url: data.url.trim() };
    }

    const target = validation.url;

    async function attempt(method: "HEAD" | "GET"): Promise<Response> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        return await fetch(target, {
          method,
          redirect: "follow",
          signal: controller.signal,
          headers: { "user-agent": "WebLensAI/1.0 (+website verification)" },
        });
      } finally {
        clearTimeout(timer);
      }
    }

    try {
      let response = await attempt("HEAD");
      if (response.status === 405 || response.status === 501) {
        response = await attempt("GET");
      }

      const verdict = classifyStatus(response.status);
      if (verdict !== "ok") {
        return { ok: false, code: verdict, url: target };
      }

      const finalUrl = response.url || target;
      const secure = finalUrl.startsWith("https://");
      return {
        ok: true,
        url: finalUrl,
        host: new URL(finalUrl).hostname,
        status: response.status,
        redirected: response.redirected,
        secure,
        checks: buildChecks({ secure, status: response.status }),
      };
    } catch (error) {
      return { ok: false, code: describeFailure(error), url: target };
    }
  });
