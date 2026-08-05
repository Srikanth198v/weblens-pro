import { RefreshCw, Share2 } from "lucide-react";

import { BrowserPreview } from "@/components/analysis/browser-preview";
import { Button } from "@/components/ui/button";
import type { DashboardReport } from "@/lib/dashboard/types";

/**
 * Section 1 — the analysed site inside a premium browser frame.
 * Reuses the Phase 2 browser chrome so both journeys stay visually identical.
 */
export function WebsitePreviewCard({
  report,
  onRefresh,
  onShare,
}: {
  report: DashboardReport;
  onRefresh: () => void;
  onShare: () => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground sm:text-lg">
            {report.siteName}
          </p>
          <p className="break-anywhere text-sm text-muted-foreground">{report.displayUrl}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            className="min-h-11 rounded-full px-4 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={onShare}
            className="min-h-11 rounded-full px-4 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <Share2 aria-hidden="true" className="size-4" />
            Share
          </Button>
        </div>
      </div>

      <BrowserPreview url={report.url} className="mt-4 shadow-soft">
        <SitePlaceholder siteName={report.siteName} />
      </BrowserPreview>
    </div>
  );
}

/** Neutral wireframe stand-in — we never embed the analysed site directly. */
function SitePlaceholder({ siteName }: { siteName: string }) {
  return (
    <div className="flex h-full w-full flex-col gap-4 bg-surface p-5 sm:p-8" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded-full bg-primary/25" />
        <div className="hidden gap-2 sm:flex">
          <div className="h-2.5 w-14 rounded-full bg-border" />
          <div className="h-2.5 w-14 rounded-full bg-border" />
          <div className="h-2.5 w-14 rounded-full bg-border" />
        </div>
      </div>
      <div className="mt-3 space-y-2.5">
        <div className="h-5 w-4/5 rounded-full bg-foreground/10 sm:h-6" />
        <div className="h-5 w-3/5 rounded-full bg-foreground/10 sm:h-6" />
        <div className="h-2.5 w-2/3 rounded-full bg-border" />
      </div>
      <div className="mt-1 h-9 w-32 rounded-full bg-primary/25" />
      <div className="mt-auto grid grid-cols-3 gap-3">
        <div className="h-12 rounded-xl bg-card shadow-soft sm:h-16" />
        <div className="h-12 rounded-xl bg-card shadow-soft sm:h-16" />
        <div className="h-12 rounded-xl bg-card shadow-soft sm:h-16" />
      </div>
      <span className="sr-only">Preview placeholder for {siteName}</span>
    </div>
  );
}
