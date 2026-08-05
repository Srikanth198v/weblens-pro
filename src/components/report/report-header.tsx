import { ScoreBadge } from "@/components/dashboard/score-badge";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { BrowserPreview } from "@/components/analysis/browser-preview";
import type { DashboardReport } from "@/lib/dashboard/types";

/** Report header — website identity, health at a glance, and the opening line. */
export function ReportHeader({ report, lead }: { report: DashboardReport; lead: string }) {
  return (
    <div className="grid gap-6 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          Website Report
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {report.siteName}
        </h1>
        <p className="break-anywhere mt-2 text-sm text-muted-foreground">
          {report.displayUrl} · Analysed {new Date(report.completedAt).toLocaleDateString()}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <span className="font-display text-2xl font-bold tabular-nums text-foreground">
            {report.overallScore}
            <span className="text-base font-medium text-muted-foreground">/100</span>
          </span>
          <ScoreBadge score={report.overallScore} />
        </div>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/85">{lead}</p>

        <div className="mt-6 hidden justify-start lg:flex">
          <ScoreRing score={report.overallScore} label="Overall score" size={168} />
        </div>
      </div>

      <div>
        <BrowserPreview url={report.url} className="shadow-soft">
          <ReportPreviewPlaceholder siteName={report.siteName} />
        </BrowserPreview>
        <div className="mt-6 flex justify-center lg:hidden">
          <ScoreRing score={report.overallScore} label="Overall score" size={168} />
        </div>
      </div>
    </div>
  );
}

function ReportPreviewPlaceholder({ siteName }: { siteName: string }) {
  return (
    <div className="flex h-full w-full flex-col gap-4 bg-surface p-5 sm:p-7" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded-full bg-primary/25" />
        <div className="hidden gap-2 sm:flex">
          <div className="h-2.5 w-12 rounded-full bg-border" />
          <div className="h-2.5 w-12 rounded-full bg-border" />
        </div>
      </div>
      <div className="space-y-2.5">
        <div className="h-5 w-4/5 rounded-full bg-foreground/10" />
        <div className="h-5 w-3/5 rounded-full bg-foreground/10" />
      </div>
      <div className="h-9 w-28 rounded-full bg-primary/25" />
      <div className="mt-auto grid grid-cols-3 gap-3">
        <div className="h-12 rounded-xl bg-card shadow-soft" />
        <div className="h-12 rounded-xl bg-card shadow-soft" />
        <div className="h-12 rounded-xl bg-card shadow-soft" />
      </div>
      <span className="sr-only">Preview placeholder for {siteName}</span>
    </div>
  );
}
