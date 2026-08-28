import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { disableCloudShare, enableCloudShare } from "@/lib/reports/cloud";

/**
 * Share state for a single saved report.
 *
 * Sharing is owner-controlled: a report is private until the owner creates a
 * link, and turning it off immediately makes the public page unavailable.
 */
export type ShareState = {
  savedId: string;
  shareId: string | null;
  enabled: boolean;
};

type Row = {
  id: string;
  share_id: string | null;
  share_enabled: boolean | null;
  report_data: AnalysisResult;
};

/** Finds the saved row for an analysis (same address, same completion time). */
export async function findShareState(
  url: string,
  completedAt: string,
): Promise<ShareState | null> {
  const { data, error } = await supabase
    .from("saved_reports")
    .select("id, share_id, share_enabled, report_data")
    .eq("url", url);

  if (error) return null;

  const row = ((data ?? []) as unknown as Row[]).find(
    (item) => item.report_data?.completedAt === completedAt,
  );
  if (!row) return null;

  return {
    savedId: row.id,
    shareId: row.share_id,
    enabled: Boolean(row.share_enabled && row.share_id),
  };
}

export function shareUrlFor(shareId: string): string {
  return `${window.location.origin}/s/${shareId}`;
}

export async function turnSharingOn(savedId: string): Promise<string | null> {
  return enableCloudShare(savedId);
}

export async function turnSharingOff(savedId: string): Promise<boolean> {
  return disableCloudShare(savedId);
}
