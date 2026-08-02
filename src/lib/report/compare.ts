import type { DashboardReport } from "@/lib/dashboard/types";

export type CompareDirection = "improved" | "declined" | "unchanged";

export type CompareRow = {
  id: string;
  label: string;
  left: number;
  right: number;
  delta: number;
  direction: CompareDirection;
};

function directionFor(delta: number): CompareDirection {
  if (delta > 0) return "improved";
  return delta < 0 ? "declined" : "unchanged";
}

/** Compares two reports across the overall score and every category. */
export function compareReports(left: DashboardReport, right: DashboardReport): CompareRow[] {
  const rows: CompareRow[] = [
    {
      id: "overall",
      label: "Overall Score",
      left: left.overallScore,
      right: right.overallScore,
      delta: right.overallScore - left.overallScore,
      direction: directionFor(right.overallScore - left.overallScore),
    },
  ];

  for (const category of left.categories) {
    const other = right.categories.find((item) => item.id === category.id);
    if (!other) continue;
    const delta = other.score - category.score;
    rows.push({
      id: category.id,
      label: category.label,
      left: category.score,
      right: other.score,
      delta,
      direction: directionFor(delta),
    });
  }

  return rows;
}

export const DIRECTION_LABEL: Record<CompareDirection, string> = {
  improved: "Improved",
  declined: "Declined",
  unchanged: "Unchanged",
};

export const DIRECTION_CLASS: Record<CompareDirection, string> = {
  improved: "bg-primary-soft text-accent-foreground",
  declined: "bg-warning/15 text-warning-foreground dark:text-warning",
  unchanged: "bg-secondary text-secondary-foreground",
};
