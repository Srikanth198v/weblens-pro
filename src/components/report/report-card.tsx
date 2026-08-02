import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, Star, Trash2 } from "lucide-react";

import { ScoreBadge } from "@/components/dashboard/score-badge";
import { ScoreBar } from "@/components/dashboard/score-bar";
import { Button } from "@/components/ui/button";
import { saveAnalysisResult } from "@/lib/analysis/store";
import { cn } from "@/lib/utils";
import type { LibraryEntry } from "@/hooks/use-report-library";

/** A single saved report in history and favourites. */
export function ReportCard({
  entry,
  onToggleFavorite,
  onDelete,
}: {
  entry: LibraryEntry;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { report } = entry;

  const openReport = () => {
    saveAnalysisResult(entry.result);
    void navigate({ to: "/report" });
  };

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow duration-200 hover:shadow-card">
      <MiniPreview siteName={report.siteName} />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{report.siteName}</h3>
          <p className="truncate text-xs text-muted-foreground">{report.displayUrl}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(report.completedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-xl font-bold tabular-nums text-foreground">
            {report.overallScore}
          </p>
          <ScoreBadge score={report.overallScore} className="mt-1" />
        </div>
      </div>

      <ScoreBar score={report.overallScore} active className="mt-4" />

      <div className="mt-5 flex items-center gap-2">
        <Button
          onClick={openReport}
          className="min-h-11 flex-1 rounded-full transition-transform duration-200 hover:-translate-y-0.5"
        >
          <Eye aria-hidden="true" className="size-4" />
          Quick View
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-11 rounded-full"
          aria-pressed={entry.favorite}
          aria-label={entry.favorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => onToggleFavorite(entry.id)}
        >
          <Star
            aria-hidden="true"
            className={cn("size-4", entry.favorite && "fill-primary text-primary")}
          />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-11 rounded-full"
          aria-label={`Delete report for ${report.siteName}`}
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <Link
        to="/reports/compare"
        className="mt-3 text-center text-xs font-medium text-muted-foreground underline-offset-4 transition-colors duration-200 hover:text-foreground hover:underline"
      >
        Compare with another report
      </Link>
    </article>
  );
}

function MiniPreview({ siteName }: { siteName: string }) {
  return (
    <div
      className="flex h-28 w-full flex-col gap-2 overflow-hidden rounded-xl border border-border bg-surface p-3"
      aria-hidden="true"
    >
      <div className="flex gap-1.5">
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
        <span className="size-2 rounded-full bg-border" />
      </div>
      <div className="h-3 w-3/5 rounded-full bg-foreground/10" />
      <div className="h-2 w-2/5 rounded-full bg-border" />
      <div className="mt-auto flex gap-2">
        <div className="h-6 flex-1 rounded-md bg-card shadow-soft" />
        <div className="h-6 flex-1 rounded-md bg-card shadow-soft" />
        <div className="h-6 w-10 rounded-md bg-primary/25" />
      </div>
      <span className="sr-only">Preview of {siteName}</span>
    </div>
  );
}
