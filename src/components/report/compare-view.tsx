import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { LibraryEmptyState } from "@/components/report/library-empty-state";
import { Reveal } from "@/components/motion/reveal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReportLibrary } from "@/hooks/use-report-library";
import { compareReports, DIRECTION_CLASS, DIRECTION_LABEL } from "@/lib/report/compare";
import { cn } from "@/lib/utils";

const ICONS = {
  improved: TrendingUp,
  declined: TrendingDown,
  unchanged: Minus,
} as const;

/** Side-by-side comparison of two saved reports. */
export function CompareView() {
  const { all } = useReportLibrary();
  const [leftId, setLeftId] = useState<string | undefined>(undefined);
  const [rightId, setRightId] = useState<string | undefined>(undefined);

  const left = all.find((entry) => entry.id === (leftId ?? all[1]?.id));
  const right = all.find((entry) => entry.id === (rightId ?? all[0]?.id));

  const rows = useMemo(
    () => (left && right ? compareReports(left.report, right.report) : []),
    [left, right],
  );

  if (all.length < 2) {
    return (
      <LibraryEmptyState
        title="Two reports needed to compare"
        description="Run another analysis and WebLens will line the two reports up side by side, showing exactly what improved and what slipped."
      />
    );
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Picker
          label="Earlier report"
          value={left?.id}
          entries={all}
          onChange={setLeftId}
        />
        <Picker
          label="Later report"
          value={right?.id}
          entries={all}
          onChange={setRightId}
        />
      </div>

      {left && right ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <div className="grid grid-cols-[1.2fr_repeat(3,minmax(0,1fr))] gap-2 border-b border-border bg-surface px-4 py-3 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase sm:px-6">
            <span>Area</span>
            <span className="truncate text-right">{left.report.siteName}</span>
            <span className="truncate text-right">{right.report.siteName}</span>
            <span className="text-right">Change</span>
          </div>

          <ul>
            {rows.map((row, index) => {
              const Icon = ICONS[row.direction];
              return (
                <Reveal as="li" key={row.id} delay={index * 60}>
                  <div className="grid grid-cols-[1.2fr_repeat(3,minmax(0,1fr))] items-center gap-2 border-b border-border px-4 py-4 last:border-b-0 sm:px-6">
                    <span className="text-sm font-medium text-foreground">{row.label}</span>
                    <span className="text-right text-sm tabular-nums text-muted-foreground">
                      {row.left}
                    </span>
                    <span className="text-right text-sm font-semibold tabular-nums text-foreground">
                      {row.right}
                    </span>
                    <span className="flex justify-end">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                          DIRECTION_CLASS[row.direction],
                        )}
                      >
                        <Icon aria-hidden="true" className="size-3.5" />
                        <span className="hidden sm:inline">{DIRECTION_LABEL[row.direction]}</span>
                        <span>
                          {row.delta > 0 ? "+" : ""}
                          {row.delta}
                        </span>
                      </span>
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Picker({
  label,
  value,
  entries,
  onChange,
}: {
  label: string;
  value?: string;
  entries: Array<{ id: string; report: { siteName: string; overallScore: number } }>;
  onChange: (id: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className="min-h-12 w-full rounded-full">
          <SelectValue placeholder="Choose a report" />
        </SelectTrigger>
        <SelectContent>
          {entries.map((entry) => (
            <SelectItem key={entry.id} value={entry.id}>
              {entry.report.siteName} — {entry.report.overallScore}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
