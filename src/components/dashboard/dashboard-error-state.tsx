import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Elegant, non-technical failure card for the dashboard.
 * Never surfaces the underlying error.
 */
export function DashboardErrorState({
  onRetry,
  title = "We couldn't put this report together",
  description = "The analysis details didn't come through completely. Trying again usually sorts it out.",
}: {
  onRetry: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-card">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning/15">
        <AlertCircle aria-hidden="true" className="size-6 text-warning" />
      </span>
      <h2 className="mt-5 font-display text-xl font-bold text-foreground">{title}</h2>
      <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button onClick={onRetry} size="lg" className="min-h-12 rounded-full px-6">
          Retry
        </Button>
        <Button asChild variant="outline" size="lg" className="min-h-12 rounded-full px-6">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
