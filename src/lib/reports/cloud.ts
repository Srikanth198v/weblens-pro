import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { classifySite } from "@/lib/analysis/site-category";
import { displayUrl, siteNameFor } from "@/lib/dashboard/build-report";
import type { SavedReport } from "@/lib/reports/types";

/**
 * Account-backed report library.
 *
 * Mirrors the local store's tiny observable shape so the UI can swap between
 * "signed out, this device" and "signed in, this account" without any change
 * to the components that render reports.
 */

let cache: SavedReport[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeCloudReports(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCloudReports(): SavedReport[] {
  return cache;
}

const EMPTY: SavedReport[] = [];

export function getCloudReportsServerSnapshot(): SavedReport[] {
  return EMPTY;
}

export function isCloudLoaded() {
  return loaded;
}

export function resetCloudReports() {
  cache = EMPTY;
  loaded = false;
  emit();
}

type Row = {
  id: string;
  created_at: string;
  favorite: boolean;
  report_data: AnalysisResult;
};

function toSaved(row: Row): SavedReport {
  return {
    id: row.id,
    savedAt: row.created_at,
    favorite: row.favorite,
    result: row.report_data,
  };
}

/** Loads the signed-in user's reports. Safe to call repeatedly. */
export async function refreshCloudReports(): Promise<void> {
  const { data, error } = await supabase
    .from("saved_reports")
    .select("id, created_at, favorite, report_data")
    .order("created_at", { ascending: false });

  if (error) throw error;

  cache = ((data ?? []) as unknown as Row[])
    .filter((row) => row.report_data?.url)
    .map(toSaved);
  loaded = true;
  emit();
}

/**
 * Persists a completed analysis to the signed-in user's account.
 * No-ops when nobody is signed in, so the local library keeps working.
 */
export async function saveCloudReport(result: AnalysisResult): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return;

  const classification = classifySite(result.evidence ?? null);
  const categoryScores = Object.fromEntries(
    result.categories.map((category) => [category.id, category.score]),
  );

  const { error } = await supabase.from("saved_reports").insert({
    user_id: user.id,
    url: result.url,
    site_name: siteNameFor(result.url),
    overall_score: Math.round(result.overallScore),
    category_scores: categoryScores,
    report_data: result as unknown as never,
    site_category: classification.primaryCategory,
    confidence: classification.confidence,
  });

  if (error) throw error;
  await refreshCloudReports();
}

export async function toggleCloudFavorite(id: string) {
  const current = cache.find((item) => item.id === id);
  if (!current) return;
  cache = cache.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item));
  emit();
  const { error } = await supabase
    .from("saved_reports")
    .update({ favorite: !current.favorite })
    .eq("id", id);
  if (error) await refreshCloudReports();
}

export async function deleteCloudReport(id: string) {
  cache = cache.filter((item) => item.id !== id);
  emit();
  const { error } = await supabase.from("saved_reports").delete().eq("id", id);
  if (error) await refreshCloudReports();
}

/** Exposed for display helpers that want the stored, human-readable address. */
export function cloudDisplayUrl(url: string) {
  return displayUrl(url);
}
