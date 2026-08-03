import { verifyWebsite } from "@/lib/verification/verify.functions";
import type { VerificationResult, VerificationService } from "@/lib/verification/types";

/**
 * Default verification service. The UI depends on the interface, not on this
 * implementation, so a richer verifier can replace it without UI changes.
 */
export const websiteVerification: VerificationService = {
  async verify(url: string, options): Promise<VerificationResult> {
    const result = await verifyWebsite({ data: { url }, signal: options?.signal });
    return result as VerificationResult;
  },
};
