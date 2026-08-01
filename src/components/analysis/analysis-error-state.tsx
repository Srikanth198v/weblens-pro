import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Friendly, non-technical failure state (PRD Volume 9).
 */
export function AnalysisErrorState({
  url,
  onRetry,
}: {
  url: string;
  onRetry: () => void;
}) {
  const display = url.replace(/^https?:\/\//i, "").replace(/\/$/, "");

  return (
    <div className="mx-auto w-full max-w-[34rem] rounded-2xl border border-border bg-card p-6 text-center shadow-card sm:p-8">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle aria-hidden="true" className="size-6 text-destructive" />
      </span>
      <h2 className="mt-4 text-xl font-bold text-foreground">We couldn't finish this analysis</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {display ? `We reached a stopping point while reviewing ${display}.` : "We reached a stopping point."}{" "}
        This usually clears up on a second try.
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button onClick={onRetry} size="lg" className="min-h-11 rounded-full px-6">
          Retry
        </Button>
        <Button asChild variant="outline" size="lg" className="min-h-11 rounded-full px-6">
          <Link to="/" search={{ url: undefined }} hash="analyze">
            Edit URL
          </Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="min-h-11 rounded-full px-6">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
