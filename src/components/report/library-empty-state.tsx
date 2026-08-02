import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

/** Shared premium empty state for history, favourites and compare. */
export function LibraryEmptyState({
  title,
  description,
  cta = "Analyze Website",
}: {
  title: string;
  description: string;
  cta?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-card sm:px-10">
      <LibraryIllustration />
      <h2 className="mt-8 font-display text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      <Button
        asChild
        size="lg"
        className="mt-8 min-h-12 rounded-full px-7 shadow-glow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow"
      >
        <Link to="/">{cta}</Link>
      </Button>
    </div>
  );
}

function LibraryIllustration() {
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
        x="18"
        y="18"
        width="86"
        height="84"
        rx="12"
        fill="var(--color-surface)"
        stroke="var(--color-border)"
      />
      <rect
        x="62"
        y="30"
        width="86"
        height="84"
        rx="12"
        fill="var(--color-card)"
        stroke="var(--color-border)"
      />
      <rect x="76" y="46" width="52" height="8" rx="4" fill="currentColor" opacity="0.2" />
      <rect x="76" y="62" width="36" height="6" rx="3" fill="var(--color-border)" />
      <rect x="76" y="78" width="44" height="12" rx="6" fill="currentColor" opacity="0.28" />
      <circle
        cx="40"
        cy="70"
        r="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="62 38"
        opacity="0.45"
      />
    </svg>
  );
}
