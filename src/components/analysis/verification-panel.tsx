import { Check, Loader2, ShieldCheck } from "lucide-react";

import { VERIFICATION_STEPS } from "@/hooks/use-website-verification";
import type { VerificationCheck } from "@/lib/verification/types";
import { cn } from "@/lib/utils";

/**
 * Premium staged feedback while the verification service runs, and the
 * trust indicators once it succeeds.
 */
export function VerificationPanel({
  step,
  verified,
  checks,
}: {
  step: number;
  verified: boolean;
  checks?: VerificationCheck[];
}) {
  return (
    <div
      className="mx-auto w-full max-w-[34rem] rounded-2xl border border-border bg-card p-6 shadow-card sm:p-7"
      aria-live="polite"
      aria-busy={!verified}
    >
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck aria-hidden="true" className="size-5 text-primary" />
      </span>
      <h2 className="mt-4 text-center font-display text-lg font-bold text-foreground">
        {verified ? "Website verified" : "Verifying website"}
      </h2>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">
        {verified
          ? "Everything checks out — starting the analysis."
          : "We confirm a site is real and reachable before analyzing it."}
      </p>

      <ul className="mt-6 space-y-3">
        {VERIFICATION_STEPS.map((label, index) => {
          const done = verified || index < step;
          const active = !verified && index === step;
          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 text-sm transition-colors duration-(--motion-component)",
                done || active ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-(--motion-component)",
                  done
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : active
                      ? "border-primary/40 text-primary"
                      : "border-border text-muted-foreground/50",
                )}
              >
                {done ? (
                  <Check aria-hidden="true" className="size-3.5" />
                ) : active ? (
                  <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                ) : (
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              {label}
            </li>
          );
        })}
      </ul>

      {verified && checks?.length ? (
        <ul className="mt-6 flex flex-wrap justify-center gap-2 border-t border-border pt-5">
          {checks.map((check) => (
            <li
              key={check.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                check.passed
                  ? "border-primary/25 bg-primary/8 text-primary"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              <Check aria-hidden="true" className="size-3.5" />
              {check.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
