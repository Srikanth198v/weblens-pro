import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Floating browser window that hosts the site being analysed.
 * Purely presentational.
 */
export function BrowserPreview({
  url,
  children,
  className,
}: {
  url: string;
  children?: ReactNode;
  className?: string;
}) {
  const display = url.replace(/^https?:\/\//i, "").replace(/\/$/, "");

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lifted sm:rounded-3xl",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-surface px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-primary/70" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
          <Lock aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs text-muted-foreground sm:text-sm">{display}</span>
        </div>
      </div>

      <div className="relative aspect-[16/11] w-full bg-background sm:aspect-[16/9]">
        {children}
      </div>
    </div>
  );
}
