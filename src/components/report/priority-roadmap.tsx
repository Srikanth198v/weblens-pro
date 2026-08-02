import { ArrowDown } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import type { DashboardReport } from "@/lib/dashboard/types";
import { roadmapFor } from "@/lib/report/build-report-view";

/** Priority roadmap — a simple top-to-bottom sequence of what to do when. */
export function PriorityRoadmap({ report }: { report: DashboardReport }) {
  const lanes = roadmapFor(report);

  return (
    <ol className="space-y-4">
      {lanes.map((lane, laneIndex) => (
        <li key={lane.id}>
          <Reveal delay={laneIndex * 120}>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-base font-bold text-foreground">{lane.label}</h3>
                <span className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
                  {lane.caption}
                </span>
              </div>

              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {lane.items.map((item) => (
                  <li
                    key={item.id}
                    className="card-hover rounded-xl bg-surface p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Impact {item.impact} · {item.difficulty} · {item.estimatedTime}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {laneIndex < lanes.length - 1 ? (
            <div className="flex justify-center py-2" aria-hidden="true">
              <ArrowDown className="size-5 text-muted-foreground/60" />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
