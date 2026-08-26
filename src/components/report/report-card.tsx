import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, Share2, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ScoreBadge } from "@/components/dashboard/score-badge";
import { ScoreBar } from "@/components/dashboard/score-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { setCurrentAnalysis } from "@/lib/analysis/store";
import { enableCloudShare } from "@/lib/reports/cloud";
import { cn } from "@/lib/utils";
import type { LibraryEntry } from "@/hooks/use-report-library";

/** A single saved report in history and favourites. */
export function ReportCard({
  entry,
  canShare = false,
  onToggleFavorite,
  onDelete,
}: {
  entry: LibraryEntry;
  canShare?: boolean;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { report } = entry;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const openReport = () => {
    setCurrentAnalysis(entry.result);
    void navigate({ to: "/report" });
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    const shareId = await enableCloudShare(entry.id);
    setSharing(false);

    if (!shareId) {
      toast.error("We couldn't create that link just now. Try again in a moment.");
      return;
    }

    const url = `${window.location.origin}/s/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("View-only link copied to your clipboard.");
    } catch {
      toast.success(`View-only link ready: ${url}`);
    }
  };

  return (
    <article className="card-hover flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
      <MiniPreview siteName={report.siteName} />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{report.siteName}</h3>
          <p className="break-anywhere line-clamp-2 text-xs text-muted-foreground">{report.displayUrl}</p>
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
        {canShare ? (
          <Button
            variant="outline"
            size="icon"
            className="size-11 rounded-full"
            disabled={sharing}
            aria-label={`Copy a view-only link for ${report.siteName}`}
            onClick={() => void handleShare()}
          >
            <Share2 aria-hidden="true" className="size-4" />
          </Button>
        ) : null}
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
          onClick={() => setConfirmOpen(true)}
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              The report for {report.siteName} will be removed permanently, along with any view-only
              link you shared. You can always run a fresh analysis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11 rounded-full">Keep report</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(entry.id);
                toast.success("Report deleted.");
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
