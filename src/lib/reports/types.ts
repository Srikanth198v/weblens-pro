import type { AnalysisResult } from "@/lib/analysis/types";

/**
 * A stored analysis. We persist the raw engine result only — every richer
 * shape (dashboard report, report view, intelligence) is derived on read, so
 * a future engine or AI provider changes nothing about what is saved.
 */
export type SavedReport = {
  id: string;
  savedAt: string;
  favorite: boolean;
  result: AnalysisResult;
};

export type ReportSort = "newest" | "oldest" | "highest" | "lowest";

export const REPORT_SORTS: Array<{ value: ReportSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest Score" },
  { value: "lowest", label: "Lowest Score" },
];
