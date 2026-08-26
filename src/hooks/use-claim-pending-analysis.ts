import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useSession } from "@/hooks/use-session";
import { setCurrentAnalysis } from "@/lib/analysis/store";
import { saveCloudReport } from "@/lib/reports/cloud";
import { clearPendingAnalysis, getPendingAnalysis } from "@/lib/reports/pending";

/**
 * Attaches an analysis a guest ran before signing in to their account, once —
 * as soon as a session exists. The pending copy is removed immediately after,
 * so the report can never be attached twice.
 */
export function useClaimPendingAnalysis() {
  const { userId } = useSession();
  const navigate = useNavigate();
  const claiming = useRef(false);

  useEffect(() => {
    if (!userId || claiming.current) return;
    const pending = getPendingAnalysis();
    if (!pending) return;

    claiming.current = true;
    void saveCloudReport(pending)
      .then((saved) => {
        if (!saved) return;
        clearPendingAnalysis();
        setCurrentAnalysis(pending);
        toast.success("Your report is unlocked and saved to your account.");
        void navigate({ to: "/dashboard" });
      })
      .catch(() => undefined)
      .finally(() => {
        claiming.current = false;
      });
  }, [navigate, userId]);
}
