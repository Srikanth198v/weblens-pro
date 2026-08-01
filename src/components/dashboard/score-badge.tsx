import { STATUS_BADGE_CLASS, STATUS_LABEL, statusForScore } from "@/lib/dashboard/scoring";
import { cn } from "@/lib/utils";

/** Calm status pill shared by every scored element. */
export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const status = statusForScore(score);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_BADGE_CLASS[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
