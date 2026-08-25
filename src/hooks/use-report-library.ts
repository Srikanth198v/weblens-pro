import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import { useSession } from "@/hooks/use-session";
import { buildDashboardReport } from "@/lib/dashboard/build-report";
import type { DashboardReport } from "@/lib/dashboard/types";
import {
  deleteCloudReport,
  getCloudReports,
  getCloudReportsServerSnapshot,
  refreshCloudReports,
  resetCloudReports,
  subscribeCloudReports,
  toggleCloudFavorite,
} from "@/lib/reports/cloud";
import {
  deleteReport,
  getReports,
  getReportsServerSnapshot,
  subscribeReports,
  toggleFavorite,
} from "@/lib/reports/storage";
import type { ReportSort, SavedReport } from "@/lib/reports/types";

export type LibraryEntry = SavedReport & { report: DashboardReport };

function sortEntries(entries: LibraryEntry[], sort: ReportSort): LibraryEntry[] {
  const copy = [...entries];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => a.savedAt.localeCompare(b.savedAt));
    case "highest":
      return copy.sort((a, b) => b.report.overallScore - a.report.overallScore);
    case "lowest":
      return copy.sort((a, b) => a.report.overallScore - b.report.overallScore);
    default:
      return copy.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }
}

/**
 * Subscribes to the report library and derives the dashboard model for each
 * entry once. Signed-in visitors read their account; everyone else reads the
 * reports saved on this device.
 */
export function useReportLibrary(options?: {
  search?: string;
  sort?: ReportSort;
  favoritesOnly?: boolean;
}) {
  const { userId, loading: sessionLoading } = useSession();
  const signedIn = Boolean(userId);

  const local = useSyncExternalStore(subscribeReports, getReports, getReportsServerSnapshot);
  const cloud = useSyncExternalStore(
    subscribeCloudReports,
    getCloudReports,
    getCloudReportsServerSnapshot,
  );

  useEffect(() => {
    if (!userId) {
      resetCloudReports();
      return;
    }
    void refreshCloudReports().catch(() => undefined);
  }, [userId]);

  const saved = signedIn ? cloud : local;

  const entries = useMemo<LibraryEntry[]>(
    () => saved.map((item) => ({ ...item, report: buildDashboardReport(item.result) })),
    [saved],
  );

  const search = options?.search?.trim().toLowerCase() ?? "";
  const sort = options?.sort ?? "newest";
  const favoritesOnly = options?.favoritesOnly ?? false;

  const visible = useMemo(() => {
    const filtered = entries.filter((entry) => {
      if (favoritesOnly && !entry.favorite) return false;
      if (!search) return true;
      return (
        entry.report.siteName.toLowerCase().includes(search) ||
        entry.report.displayUrl.toLowerCase().includes(search)
      );
    });
    return sortEntries(filtered, sort);
  }, [entries, favoritesOnly, search, sort]);

  return {
    all: entries,
    entries: visible,
    isEmpty: entries.length === 0,
    signedIn,
    loading: sessionLoading,
    onToggleFavorite: useCallback(
      (id: string) => {
        if (signedIn) void toggleCloudFavorite(id).catch(() => undefined);
        else toggleFavorite(id);
      },
      [signedIn],
    ),
    onDelete: useCallback(
      (id: string) => {
        if (signedIn) void deleteCloudReport(id).catch(() => undefined);
        else deleteReport(id);
      },
      [signedIn],
    ),
  };
}
