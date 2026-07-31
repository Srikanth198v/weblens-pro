import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/** WebLens AI wordmark. Used in navigation and any future report headers. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="WebLens AI home"
      className={cn(
        "inline-flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"
      >
        <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="6.5" strokeLinecap="round" />
          <path d="M11 7.8v6.4M7.8 11h6.4" strokeLinecap="round" opacity="0.55" />
          <path d="m16.2 16.2 3.6 3.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-display text-[1.0625rem] font-bold tracking-tight text-foreground">
        WebLens <span className="text-primary">AI</span>
      </span>
    </Link>
  );
}
