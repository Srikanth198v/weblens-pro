/**
 * Website verification contract.
 * Independent of the analysis engine: the UI depends on these types only,
 * so a richer verifier (robots.txt, sitemap, SSL, security headers, domain age)
 * can be added later without touching presentation code.
 */

export type VerificationFailureCode =
  | "invalid-url"
  | "not-found"
  | "offline"
  | "unreachable"
  | "timeout";

export type VerificationCheckId = "reachable" | "https" | "responded";

export type VerificationCheck = {
  id: VerificationCheckId;
  label: string;
  passed: boolean;
};

/** Optional future signals — the UI renders whatever is present, nothing more. */
export type VerificationSignals = {
  robotsTxt?: boolean;
  sitemap?: boolean;
  secureHeaders?: boolean;
  sslValid?: boolean;
  domainAgeDays?: number;
};

export type VerificationSuccess = {
  ok: true;
  /** Final URL after normalization and any redirects. */
  url: string;
  host: string;
  status: number;
  redirected: boolean;
  secure: boolean;
  checks: VerificationCheck[];
  signals?: VerificationSignals;
};

export type VerificationFailure = {
  ok: false;
  code: VerificationFailureCode;
  /** Normalized URL we attempted, kept so the user never loses their input. */
  url: string;
};

export type VerificationResult = VerificationSuccess | VerificationFailure;

export interface VerificationService {
  verify(url: string, options?: { signal?: AbortSignal }): Promise<VerificationResult>;
}
