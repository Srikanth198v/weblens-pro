import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";

import { ScoreRing } from "@/components/dashboard/score-ring";
import { Button } from "@/components/ui/button";
import type { DashboardReport } from "@/lib/dashboard/types";

const LOCKED = [
  "Full score breakdown, area by area",
  "AI website understanding and confidence",
  "Priority recommendations with business impact",
  "Evidence used and full methodology",
  "Ask WebLens AI about this report",
];

/**
 * Shown when an analysis finishes for a visitor who isn't signed in.
 * The result is real and already safe on this device — only the detailed
 * report stays locked until they create an account or sign in.
 */
export function GuestGate({ report }: { report: DashboardReport }) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          Analysis complete
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Your analysis is ready
        </h1>
        <p className="break-anywhere mt-2 text-sm text-muted-foreground">
          {report.siteName} · {report.displayUrl}
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <ScoreRing score={report.overallScore} label="Overall score" size={168} />
          <p className="max-w-md text-sm leading-relaxed text-foreground/85">
            Create an account or sign in to unlock your full report and save it to your Reports.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="min-h-12 rounded-full px-7 shadow-glow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
          >
            <Link to="/auth" search={{ mode: "signup" }}>
              <Sparkles aria-hidden="true" className="size-4" />
              Create account
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-h-12 rounded-full px-7 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Link to="/auth" search={{ mode: "signin" }}>
              Sign in
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          We'll keep this analysis safe and attach it to your account automatically.
        </p>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {LOCKED.map((item) => (
          <li
            key={item}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 text-sm text-muted-foreground"
          >
            <Lock aria-hidden="true" className="size-4 shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
