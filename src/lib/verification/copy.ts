import { Globe, PlugZap, SearchX, TimerOff, Unplug, type LucideIcon } from "lucide-react";

import type { VerificationFailureCode } from "@/lib/verification/types";

export type VerificationErrorCopy = {
  icon: LucideIcon;
  title: string;
  description: string;
  reasons: string[];
};

/**
 * Friendly, human copy for every failure code (PRD Volume 9).
 * Technical detail never reaches the user.
 */
export const VERIFICATION_ERROR_COPY: Record<VerificationFailureCode, VerificationErrorCopy> = {
  "invalid-url": {
    icon: Globe,
    title: "That address doesn't look complete",
    description:
      "We couldn't read this as a website address, so we stopped before starting the analysis.",
    reasons: [
      "A small typo in the address",
      "Missing the domain ending, like .com",
      "Extra spaces or characters",
    ],
  },
  "not-found": {
    icon: SearchX,
    title: "We couldn't find that website",
    description: "The address responded, but there's no page there to analyze.",
    reasons: [
      "The page may have been moved or renamed",
      "The link might point to a deleted page",
      "The site may only exist on a different address",
    ],
  },
  offline: {
    icon: PlugZap,
    title: "The website appears to be offline",
    description: "We reached the server, but it isn't serving the site right now.",
    reasons: [
      "The site may be under maintenance",
      "The hosting may be temporarily down",
      "The issue is usually short-lived",
    ],
  },
  unreachable: {
    icon: Unplug,
    title: "We couldn't connect to that website",
    description: "Nothing answered at this address, so we stopped before analyzing.",
    reasons: [
      "The domain may not exist yet",
      "The site may block outside requests",
      "Your connection may have dropped",
    ],
  },
  timeout: {
    icon: TimerOff,
    title: "The website took too long to respond",
    description: "We waited, but the site didn't answer in time to analyze it properly.",
    reasons: [
      "The server may be under heavy load",
      "The site may be unusually slow right now",
      "A second attempt often succeeds",
    ],
  },
};
