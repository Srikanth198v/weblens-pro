import { ExpandableCard } from "@/components/dashboard/expandable-card";
import { Reveal } from "@/components/motion/reveal";
import type { ImprovementItem, ReportView } from "@/lib/report/build-report-view";

const PRIORITY_LABEL: Record<ImprovementItem["priority"], string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

/** Improvement opportunities, grouped by effort: quick wins first. */
export function ImprovementOpportunities({ groups }: { groups: ReportView["improvements"] }) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.tier}>
          <Reveal>
            <div>
              <h3 className="text-base font-bold text-foreground">{group.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
            </div>
          </Reveal>

          <div className="mt-4 space-y-3">
            {group.items.map((item, index) => (
              <Reveal key={item.id} delay={index * 80}>
                <ImprovementCard item={item} />
              </Reveal>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ImprovementCard({ item }: { item: ImprovementItem }) {
  return (
    <ExpandableCard
      toggleLabel={`Toggle details for ${item.title}`}
      header={
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground sm:text-base">
            {item.title}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {PRIORITY_LABEL[item.priority]} · Impact {item.impact} · {item.difficulty} ·{" "}
            {item.estimatedTime}
          </span>
        </span>
      }
    >
      <div className="border-t border-border pt-5">
        <p className="text-sm leading-relaxed text-foreground/85">{item.description}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Priority" value={PRIORITY_LABEL[item.priority]} />
          <Fact label="Business impact" value={item.impact} />
          <Fact label="Difficulty" value={item.difficulty} />
          <Fact label="Estimated time" value={item.estimatedTime} />
        </dl>
        <div className="mt-4 rounded-xl bg-surface p-3.5">
          <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            What we found on your page
          </p>
          <ul className="mt-2 space-y-1.5">
            {item.evidence.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-foreground/85">
                · {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 rounded-xl bg-surface p-3.5 text-sm leading-relaxed text-foreground/85">
          <span className="font-semibold text-foreground">Expected result: </span>
          {item.expectedResult}
        </p>
      </div>
    </ExpandableCard>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-3.5">
      <dt className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
