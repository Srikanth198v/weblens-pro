import { STATUS_LABEL, statusForScore } from "@/lib/dashboard/scoring";
import type { DashboardReport } from "@/lib/dashboard/types";
import { buildReportView } from "@/lib/report/build-report-view";

/** Export helpers specific to the report document. Dashboard exports are reused as-is. */

export function summaryToText(report: DashboardReport): string {
  const view = buildReportView(report);
  return [
    `WebLens AI — ${report.siteName} (${report.displayUrl})`,
    `Overall score: ${report.overallScore}/100 — ${STATUS_LABEL[statusForScore(report.overallScore)]}`,
    "",
    ...view.summary,
  ].join("\n\n");
}

export function recommendationsToText(report: DashboardReport): string {
  const view = buildReportView(report);
  const lines: string[] = [`WebLens AI — Recommendations for ${report.displayUrl}`, ""];

  for (const group of view.improvements) {
    lines.push(group.label.toUpperCase());
    for (const item of group.items) {
      lines.push(
        `- ${item.title}`,
        `  ${item.description}`,
        `  Impact: ${item.impact} · Difficulty: ${item.difficulty} · Time: ${item.estimatedTime}`,
        `  Expected result: ${item.expectedResult}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function reportToJson(report: DashboardReport): string {
  return JSON.stringify({ report, view: buildReportView(report) }, null, 2);
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function downloadJson(report: DashboardReport): boolean {
  try {
    const blob = new Blob([reportToJson(report)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `weblens-${report.displayUrl.replace(/[^a-z0-9]+/gi, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
