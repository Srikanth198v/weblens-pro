import type { VerificationCheck, VerificationFailureCode } from "@/lib/verification/types";

/** Accept 2xx and redirects that resolved; classify everything else precisely. */
export function classifyStatus(status: number): "ok" | VerificationFailureCode {
  if (status >= 200 && status < 400) return "ok";
  if (status === 404 || status === 410) return "not-found";
  if (status === 401 || status === 403 || status === 451) return "blocked";
  if (status === 408 || status === 429) return "timeout";
  if (status === 502 || status === 503 || status === 504) return "offline";
  if (status >= 500) return "server-error";
  return "unreachable";
}

export function describeFailure(error: unknown): VerificationFailureCode {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (name === "AbortError" || message.includes("timeout") || message.includes("timed out")) {
    return "timeout";
  }
  if (
    message.includes("certificate") ||
    message.includes("ssl") ||
    message.includes("tls") ||
    message.includes("handshake")
  ) {
    return "ssl";
  }
  return "unreachable";
}


export function buildChecks({
  secure,
  status,
}: {
  secure: boolean;
  status: number;
}): VerificationCheck[] {
  return [
    { id: "reachable", label: "Website reachable", passed: true },
    { id: "https", label: secure ? "Secure HTTPS" : "Served over HTTP", passed: secure },
    { id: "responded", label: `Responded successfully (${status})`, passed: true },
  ];
}
