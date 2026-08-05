import { Check, CircleSlash, Clock, Lock, MinusCircle, type LucideIcon } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import {
  EVIDENCE_STATUS_LABEL,
  type EvidenceReport,
  type EvidenceStatus,
} from "@/lib/dashboard/evidence-report";

const STATUS_ICON: Record<EvidenceStatus, LucideIcon> = {
  collected: Check,
  "not-available": CircleSlash,
  blocked: Lock,
  skipped: MinusCircle,
  "timed-out": Clock,
};

const STATUS_CLASS: Record<EvidenceStatus, string> = {
  collected: "bg-primary-soft text-accent-foreground",
  "not-available": "bg-surface text-muted-foreground",
  blocked: "bg-warning/15 text-warning-foreground dark:text-warning",
  skipped: "bg-surface text-muted-foreground",
  "timed-out": "bg-warning/15 text-warning-foreground dark:text-warning",
};

/**
 * Evidence Used — the full ledger. Anything we could not read is named as
 * such, so the report never implies coverage it does not have.
 */
export function EvidenceSummary({ evidenceReport }: { evidenceReport: EvidenceReport }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-7">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Everything below was checked during this analysis. Sources marked as unavailable were not
        used to reach any conclusion in this report.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {evidenceReport.items.map((item, index) => {
          const Icon = STATUS_ICON[item.status];
          return (
            <Reveal key={item.id} delay={index * 45}>
              <li className="h-full rounded-2xl bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0",
                        item.status === "collected" ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    {item.label}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      STATUS_CLASS[item.status],
                    )}
                  >
                    {EVIDENCE_STATUS_LABEL[item.status]}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground break-anywhere">
                  {item.detail}
                </p>
              </li>
            </Reveal>
          );
        })}
      </ul>
    </div>
  );
}
