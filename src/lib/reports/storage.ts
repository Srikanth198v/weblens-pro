import type { AnalysisResult } from "@/lib/analysis/types";
import type { SavedReport } from "@/lib/reports/types";

/**
 * Local report library.
 *
 * Deliberately a tiny observable store: components subscribe through
 * `useSyncExternalStore`, so favouriting or deleting updates every open view
 * instantly without a refresh.
 */
const KEY = "weblens:reports";

let cache: SavedReport[] | null = null;
const listeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function read(): SavedReport[] {
  if (cache) return cache;
  if (!isBrowser()) return (cache = []);
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedReport[]) : [];
    cache = Array.isArray(parsed) ? parsed.filter((item) => item?.result?.url) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: SavedReport[]) {
  cache = next;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable — the in-memory copy still serves this session.
    }
  }
  for (const listener of listeners) listener();
}

export function subscribeReports(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReports(): SavedReport[] {
  return read();
}

const EMPTY: SavedReport[] = [];

/** Stable server snapshot so SSR never touches storage. */
export function getReportsServerSnapshot(): SavedReport[] {
  return EMPTY;
}

export function reportIdFor(result: AnalysisResult): string {
  return `${result.url}::${result.completedAt}`;
}

/** Saves (or refreshes) an analysis in the library, keeping favourite state. */
export function saveReport(result: AnalysisResult): SavedReport {
  const id = reportIdFor(result);
  const existing = read().find((item) => item.id === id);
  const entry: SavedReport = {
    id,
    savedAt: existing?.savedAt ?? new Date().toISOString(),
    favorite: existing?.favorite ?? false,
    result,
  };
  write([entry, ...read().filter((item) => item.id !== id)]);
  return entry;
}

export function toggleFavorite(id: string) {
  write(read().map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)));
}

export function deleteReport(id: string) {
  write(read().filter((item) => item.id !== id));
}
