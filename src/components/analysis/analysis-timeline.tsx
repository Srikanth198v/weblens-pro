import { Check, Loader2 } from "lucide-react";

import { ANALYSIS_STAGES, stageIndex } from "@/lib/analysis/stages";
import type { StageId } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

export function AnalysisTimeline({
  activeStage,
  complete,
}: {
  activeStage: StageId;
  complete: boolean;
}) {
  const active = stageIndex(activeStage);

  return (
    <ol className="flex w-full flex-col gap-1">
      {ANALYSIS_STAGES.map((stage, index) => {
        const isDone = complete || index < active;
        const isActive = !complete && index === active;

        return (
          <li
            key={stage.id}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 transition-colors duration-(--motion-component) ease-(--motion-ease)",
              isActive && "bg-primary-soft/60",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-(--motion-component) ease-(--motion-ease)",
                isDone
                  ? "border-primary bg-primary text-primary-foreground"
                  : isActive
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground",
              )}
            >
              {isDone ? (
                <Check aria-hidden="true" className="size-3.5" />
              ) : isActive ? (
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </span>
            <span
              className={cn(
                "text-sm transition-colors duration-(--motion-component)",
                isActive
                  ? "font-semibold text-foreground"
                  : isDone
                    ? "text-secondary-foreground"
                    : "text-muted-foreground",
              )}
            >
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
