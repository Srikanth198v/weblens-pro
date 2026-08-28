import { Braces, ClipboardList, Copy, Download, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ShareReportControl } from "@/components/report/share-report-control";
import { Button } from "@/components/ui/button";
import { downloadPdf, shareReport } from "@/lib/dashboard/export";
import type { DashboardReport } from "@/lib/dashboard/types";
import {
  copyText,
  downloadJson,
  recommendationsToText,
  summaryToText,
} from "@/lib/report/export-center";

/** Export centre — every way to take the report elsewhere. */
export function ExportCenter({ report }: { report: DashboardReport }) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, action: () => Promise<boolean> | boolean, success: string) => {
    setBusy(key);
    const ok = await action();
    setBusy(null);
    if (ok) toast.success(success);
    else toast.error("That didn't go through. Try again in a moment.");
  };

  const handleShare = async () => {
    setBusy("share");
    const outcome = await shareReport(report);
    setBusy(null);
    if (outcome === "shared") return;
    if (outcome === "copied") toast.success("Share link copied to your clipboard.");
    else toast.error("Sharing isn't available here. Copy the summary instead.");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
      <p className="font-display text-lg font-bold text-foreground">Share this report</p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Send it to a client, drop it into your notes, or hand the raw data to a developer.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={() => {
            downloadPdf();
            toast.success("Opening your print dialog — choose “Save as PDF”.");
          }}
          size="lg"
          className="min-h-12 rounded-full px-6 shadow-glow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0"
        >
          <Download aria-hidden="true" className="size-4" />
          Download PDF
        </Button>

        <ExportButton
          icon={<Copy aria-hidden="true" className="size-4" />}
          label="Copy Summary"
          disabled={busy === "summary"}
          onClick={() =>
            run("summary", () => copyText(summaryToText(report)), "Summary copied to your clipboard.")
          }
        />
        <ExportButton
          icon={<ClipboardList aria-hidden="true" className="size-4" />}
          label="Copy Recommendations"
          disabled={busy === "recommendations"}
          onClick={() =>
            run(
              "recommendations",
              () => copyText(recommendationsToText(report)),
              "Recommendations copied to your clipboard.",
            )
          }
        />
        <ExportButton
          icon={<Share2 aria-hidden="true" className="size-4" />}
          label="Share Report"
          disabled={busy === "share"}
          onClick={handleShare}
        />
        <ExportButton
          icon={<Braces aria-hidden="true" className="size-4" />}
          label="Export JSON"
          disabled={busy === "json"}
          onClick={() => run("json", () => downloadJson(report), "Report data downloaded.")}
        />
      </div>

      <ShareReportControl report={report} />
    </div>
  );
}

function ExportButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      className="min-h-12 rounded-full px-6 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
    >
      {icon}
      {label}
    </Button>
  );
}
