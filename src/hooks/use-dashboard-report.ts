import { useEffect, useMemo, useState } from "react";

import { readAnalysisResult } from "@/lib/analysis/store";
import { buildDashboardReport } from "@/lib/dashboard/build-report";
import type { DashboardReport } from "@/lib/dashboard/types";
import { heuristicIntelligence } from "@/lib/intelligence/heuristic-provider";
import type { IntelligenceProvider, IntelligenceReport } from "@/lib/intelligence/types";

type DashboardState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error" }
  | { status: "ready"; report: DashboardReport; intelligence: IntelligenceReport };

/**
 * Reads the stored analysis and derives the dashboard view model.
 * All data shaping happens here so section components stay presentational.
 */
export function useDashboardReport(
  provider: IntelligenceProvider = heuristicIntelligence,
): DashboardState & { reload: () => void } {
  const [raw, setRaw] = useState<{ status: "loading" | "empty" | "error"; data?: unknown }>({
    status: "loading",
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    try {
      const result = readAnalysisResult();
      setRaw(result ? { status: "loading", data: result } : { status: "empty" });
    } catch {
      setRaw({ status: "error" });
    }
  }, [nonce]);

  const derived = useMemo<DashboardState>(() => {
    if (raw.status === "empty") return { status: "empty" };
    if (raw.status === "error" || !raw.data) {
      return raw.status === "error" ? { status: "error" } : { status: "loading" };
    }

    try {
      const report = buildDashboardReport(raw.data as never);
      const intelligence = provider.generate(report);

      return { status: "ready", report, intelligence };
    } catch {
      return { status: "error" };
    }
  }, [provider, raw]);

  return { ...derived, reload: () => setNonce((value) => value + 1) };
}
