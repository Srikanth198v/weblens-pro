import { STATUS_LABEL, statusForScore } from "@/lib/dashboard/scoring";
import type { DashboardReport } from "@/lib/dashboard/types";

/** Plain-text version of the report, used by copy and share actions. */
export function reportToText(report: DashboardReport): string {
  const lines: string[] = [
    `WebLens AI — Analysis for ${report.displayUrl}`,
    `Overall score: ${report.overallScore}/100 (${STATUS_LABEL[statusForScore(report.overallScore)]})`,
    "",
    "Category scores",
  ];

  for (const category of report.categories) {
    lines.push(`- ${category.label}: ${category.score}/100 — ${category.summary}`);
  }

  lines.push("", "Business review");
  for (const metric of report.business) {
    lines.push(`- ${metric.label}: ${metric.score}/100 — ${metric.explanation}`);
  }

  lines.push("", "Recommendations");
  for (const item of report.recommendations) {
    lines.push(
      `- [${item.priority.toUpperCase()}] ${item.title} — impact ${item.impact}, ${item.difficulty}, ${item.estimatedTime}`,
    );
  }

  return lines.join("\n");
}

export async function copyReport(report: DashboardReport): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(reportToText(report));
    return true;
  } catch {
    return false;
  }
}

export async function copyShareLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}

/** Share sheet where supported, clipboard link everywhere else. */
export async function shareReport(report: DashboardReport): Promise<"shared" | "copied" | "failed"> {
  const shareData = {
    title: `WebLens AI — ${report.displayUrl}`,
    text: `Website analysis for ${report.displayUrl}: ${report.overallScore}/100.`,
    url: window.location.href,
  };

  if (typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch {
      // Dismissed or unsupported — fall through to the clipboard.
    }
  }

  return (await copyShareLink()) ? "copied" : "failed";
}

/** PDF export uses the browser print dialog — no extra dependency needed. */
export function downloadPdf(): void {
  window.print();
}
