import { Check, Copy, Globe, Link2, Loader2, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-session";
import type { DashboardReport } from "@/lib/dashboard/types";
import {
  findShareState,
  shareUrlFor,
  turnSharingOff,
  turnSharingOn,
  type ShareState,
} from "@/lib/reports/share";

/**
 * Owner-facing sharing control for a completed report.
 * Creates (or revokes) a view-only public link. Nothing is public until the
 * owner switches it on.
 */
export function ShareReportControl({ report }: { report: DashboardReport }) {
  const { userId, loading } = useSession();
  const [state, setState] = useState<ShareState | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    if (loading) return;
    if (!userId) {
      setStatus("missing");
      return;
    }
    setStatus("loading");
    void findShareState(report.url, report.completedAt).then((found) => {
      if (!active) return;
      setState(found);
      setStatus(found ? "ready" : "missing");
    });
    return () => {
      active = false;
    };
  }, [loading, report.completedAt, report.url, userId]);

  if (loading || status === "loading") {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Checking your share settings…
      </div>
    );
  }

  if (status === "missing" || !state) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">
        <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          Sign in and save this report to your account to create a view-only link you can send to
          anyone.
        </p>
      </div>
    );
  }

  const url = state.shareId ? shareUrlFor(state.shareId) : null;

  const toggle = async (next: boolean) => {
    setBusy(true);
    if (next) {
      const shareId = await turnSharingOn(state.savedId);
      setBusy(false);
      if (!shareId) {
        toast.error("We couldn't create that link just now. Try again in a moment.");
        return;
      }
      setState({ ...state, shareId, enabled: true });
      track("report_shared");
      try {
        await navigator.clipboard.writeText(shareUrlFor(shareId));
        toast.success("Public link created and copied to your clipboard.");
      } catch {
        toast.success("Public link created.");
      }
      return;
    }

    const ok = await turnSharingOff(state.savedId);
    setBusy(false);
    if (!ok) {
      toast.error("We couldn't turn sharing off just now. Try again in a moment.");
      return;
    }
    setState({ ...state, enabled: false });
    toast.success("Sharing turned off. The link no longer opens.");
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success("Link copied to your clipboard.");
    } catch {
      toast.error("Copying didn't work here. Select the link and copy it manually.");
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {state.enabled ? (
            <Globe aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          ) : (
            <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">Public share link</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {state.enabled
                ? "Anyone with the link can view this report. They can't edit it or see your account."
                : "This report is private. Turn sharing on to create a view-only link."}
            </p>
          </div>
        </div>

        <Switch
          checked={state.enabled}
          disabled={busy}
          onCheckedChange={(next) => void toggle(next)}
          aria-label="Share this report with a public link"
        />
      </div>

      {state.enabled && url ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
            <Link2 aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm text-muted-foreground">{url}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => void copy()}
            className="min-h-11 rounded-full px-5 transition-transform duration-200 hover:-translate-y-0.5"
          >
            {copied ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
