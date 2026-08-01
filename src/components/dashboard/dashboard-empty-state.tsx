import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

/**
 * Premium empty state — shown when the dashboard is opened without an
 * analysis in the current session.
 */
export function DashboardEmptyState() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-card sm:px-10">
      <EmptyIllustration />
      <h2 className="mt-8 font-display text-2xl font-bold tracking-tight text-foreground">
        No analysis to show yet
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        Enter a website address and WebLens will review its design, performance, SEO, accessibility
        and business signals in under a minute.
      </p>
      <Button
        asChild
        size="lg"
        className="mt-8 min-h-12 rounded-full px-7 shadow-glow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
      >
        <Link to="/">Analyze Website</Link>
      </Button>
    </div>
  );
}

function EmptyIllustration() {
  return (
    <svg
      width="168"
      height="120"
      viewBox="0 0 168 120"
      fill="none"
      aria-hidden="true"
      className="text-primary"
    >
      <rect
        x="10"
        y="12"
        width="148"
        height="96"
        rx="14"
        fill="var(--color-surface)"
        stroke="var(--color-border)"
      />
      <rect x="10" y="12" width="148" height="22" rx="14" fill="var(--color-secondary)" />
      <circle cx="26" cy="23" r="3" fill="currentColor" opacity="0.35" />
      <circle cx="38" cy="23" r="3" fill="currentColor" opacity="0.22" />
      <circle cx="50" cy="23" r="3" fill="currentColor" opacity="0.16" />
      <rect x="28" y="50" width="66" height="8" rx="4" fill="currentColor" opacity="0.18" />
      <rect x="28" y="66" width="44" height="6" rx="3" fill="var(--color-border)" />
      <rect x="28" y="80" width="54" height="14" rx="7" fill="currentColor" opacity="0.28" />
      <circle
        cx="122"
        cy="72"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="80 46"
        opacity="0.5"
      />
    </svg>
  );
}
