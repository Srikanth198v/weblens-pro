import { Link, useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { VERIFICATION_ERROR_COPY } from "@/lib/verification/copy";
import type { VerificationFailure } from "@/lib/verification/types";

/**
 * Elegant, non-technical verification failure card.
 * The user's URL is always preserved and shown back to them.
 */
export function VerificationErrorState({
  failure,
  onRetry,
}: {
  failure: VerificationFailure;
  onRetry: () => void;
}) {
  const copy = VERIFICATION_ERROR_COPY[failure.code];
  const Icon = copy.icon;
  const display = failure.url.replace(/^https?:\/\//i, "").replace(/\/$/, "");

  return (
    <div
      role="alert"
      className="mx-auto w-full max-w-[34rem] rounded-2xl border border-border bg-card p-6 text-center shadow-card sm:p-8"
    >
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <Icon aria-hidden="true" className="size-7 text-destructive" />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-destructive">
        Verification failed
      </p>
      <h2 className="mt-2 font-display text-xl font-bold text-foreground">{copy.title}</h2>
      {display ? (
        <p className="mt-1.5 truncate text-sm font-medium text-muted-foreground">{display}</p>
      ) : null}
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {copy.description}
      </p>

      <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Possible reasons
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {copy.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button onClick={onRetry} size="lg" className="min-h-11 rounded-full px-6">
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg" className="min-h-11 rounded-full px-6">
          <Link to="/">Back Home</Link>
        </Button>
      </div>
      <EditUrlButton />
    </div>
  );
}

function EditUrlButton() {
  const router = useRouter();
  return (
    <Button
      onClick={() => router.history.back()}
      variant="ghost"
      size="sm"
      className="mt-3 min-h-11 rounded-full px-4 text-muted-foreground"
    >
      Edit the address
    </Button>
  );
}
