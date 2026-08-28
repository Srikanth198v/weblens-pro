import { Link } from "@tanstack/react-router";
import { Copy, Download, FileText, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ShareReportControl } from "@/components/report/share-report-control";
import { Button } from "@/components/ui/button";
import { copyReport, downloadPdf, shareReport } from "@/lib/dashboard/export";
import type { DashboardReport } from "@/lib/dashboard/types";

/** Section 8 — export and sharing actions. */
export function ExportArea({ report }: { report: DashboardReport }) {
  const [busy, setBusy] = useState<string | null>(null);

  const handleCopy = async () => {
    setBusy("copy");
    const ok = await copyReport(report);
    setBusy(null);
    if (ok) toast.success("Report copied to your clipboard.");
    else toast.error("We couldn't copy the report. Try selecting the text instead.");
  };

  const handleShare = async () => {
    setBusy("share");
    const outcome = await shareReport(report);
    setBusy(null);
    if (outcome === "shared") return;
    if (outcome === "copied") toast.success("Share link copied to your clipboard.");
    else toast.error("Sharing isn't available here. Copy the report instead.");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
      <p className="font-display text-lg font-bold text-foreground">Take this report with you</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Save a copy, paste it into your notes, or send it to whoever owns the site.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          asChild
          size="lg"
          className="min-h-12 rounded-full px-6 shadow-glow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0"
        >
          <Link to="/report">
            <FileText aria-hidden="true" className="size-4" />
            View Full Report
          </Link>
        </Button>
        <Button
          onClick={downloadPdf}
          variant="outline"
          size="lg"
          className="min-h-12 rounded-full px-6 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Download aria-hidden="true" className="size-4" />
          Download PDF
        </Button>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="lg"
          disabled={busy === "copy"}
          className="min-h-12 rounded-full px-6 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Copy aria-hidden="true" className="size-4" />
          Copy Report
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          size="lg"
          disabled={busy === "share"}
          className="min-h-12 rounded-full px-6 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Share2 aria-hidden="true" className="size-4" />
          Share Report
        </Button>
      </div>

      <ShareReportControl report={report} />
    </div>
  );
}
