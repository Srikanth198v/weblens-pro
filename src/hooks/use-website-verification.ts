import { useCallback, useEffect, useRef, useState } from "react";

import { websiteVerification } from "@/lib/verification/service";
import type { VerificationResult, VerificationService } from "@/lib/verification/types";

export const VERIFICATION_STEPS = [
  "Checking website...",
  "Verifying connection...",
  "Preparing analysis...",
] as const;

export type VerificationState =
  | { status: "idle" }
  | { status: "verifying"; step: number }
  | { status: "verified"; result: Extract<VerificationResult, { ok: true }> }
  | { status: "failed"; result: Extract<VerificationResult, { ok: false }> };

const STEP_MS = 650;

/**
 * Runs the verification service once per URL/attempt, with a smooth staged
 * status sequence. Duplicate calls for the same run are prevented.
 */
export function useWebsiteVerification(
  url: string,
  service: VerificationService = websiteVerification,
) {
  const [state, setState] = useState<VerificationState>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);
  const serviceRef = useRef(service);
  serviceRef.current = service;

  useEffect(() => {
    if (!url) {
      setState({ status: "failed", result: { ok: false, code: "invalid-url", url } });
      return;
    }

    let active = true;
    const controller = new AbortController();
    setState({ status: "verifying", step: 0 });

    const ticker = window.setInterval(() => {
      setState((current) =>
        current.status === "verifying"
          ? { status: "verifying", step: Math.min(current.step + 1, VERIFICATION_STEPS.length - 1) }
          : current,
      );
    }, STEP_MS);

    void (async () => {
      try {
        const result = await serviceRef.current.verify(url, { signal: controller.signal });
        if (!active) return;
        setState(
          result.ok
            ? { status: "verified", result }
            : { status: "failed", result },
        );
      } catch {
        if (!active) return;
        setState({ status: "failed", result: { ok: false, code: "unreachable", url } });
      } finally {
        window.clearInterval(ticker);
      }
    })();

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(ticker);
    };
  }, [url, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { state, retry };
}
