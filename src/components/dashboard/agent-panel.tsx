import {
  Accessibility,
  Briefcase,
  Gauge,
  Layout,
  PenLine,
  Search,
  Sparkles,
  ChevronDown,
  Check,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { AgentPanel, SpecialistAgent } from "@/lib/intelligence/agents";

const AGENT_ICON = {
  search: Search,
  layout: Layout,
  accessibility: Accessibility,
  gauge: Gauge,
  "pen-line": PenLine,
  briefcase: Briefcase,
} as const;

/**
 * Section — Multi-Agent Intelligence.
 * Six specialists read the same evidence, then a master synthesis reconciles them.
 */
export function AgentPanelSection({ panel }: { panel: AgentPanel }) {
  const { agents, synthesis } = panel;

  return (
    <div className="space-y-6">
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft/60 px-3 py-1.5 text-xs font-semibold text-accent-foreground">
          <Users aria-hidden="true" className="size-3.5" />
          Reviewed by 6 specialist AI agents
        </span>
      </Reveal>

      <div className="space-y-3">
        {agents.map((agent, index) => (
          <Reveal key={agent.id} delay={index * 70}>
            <AgentCard agent={agent} />
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <Sparkles aria-hidden="true" className="size-4 text-primary" />
              Master Synthesis
            </h3>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-accent-foreground">
              Agreement Score
              <span className="tabular-nums">{synthesis.agreementScore}%</span>
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {synthesis.agreementNote}
          </p>

          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
            role="img"
            aria-label={`Agent agreement ${synthesis.agreementScore} out of 100`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
              style={{ width: `${synthesis.agreementScore}%` }}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SynthesisList title="What is already working" items={synthesis.working} tone="positive" />
            <SynthesisList title="What is limiting growth" items={synthesis.limiting} tone="neutral" />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SynthesisBlock title="What should be fixed first" body={synthesis.fixFirst} highlight />
            <SynthesisBlock title="Estimated business impact" body={synthesis.businessImpact} />
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function SynthesisList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "neutral";
}) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {title}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
            {tone === "positive" ? (
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <TrendingUp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SynthesisBlock({
  title,
  body,
  highlight,
}: {
  title: string;
  body: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        highlight ? "border border-primary/25 bg-primary-soft/50" : "bg-surface",
      )}
    >
      <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground/85">{body}</p>
    </div>
  );
}

function AgentCard({ agent }: { agent: SpecialistAgent }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const contentId = useId();

  // Desktop reads best fully expanded; mobile stays compact until tapped.
  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const Icon = AGENT_ICON[agent.icon];

  return (
    <div className="card-hover rounded-2xl border border-border bg-card shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex min-h-14 w-full items-start gap-4 rounded-2xl px-4 py-4 text-left sm:px-6"
      >
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-display text-base font-bold text-foreground">{agent.name}</span>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
              {agent.confidence}% confidence
            </span>
            {agent.score !== null ? (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground tabular-nums">
                {agent.score}/100
              </span>
            ) : null}
          </span>
          <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
            {agent.verdict}
          </span>
        </span>

        <span className="sr-only">Toggle {agent.name} review</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={contentId}
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="space-y-5 px-4 pb-5 sm:px-6">
            <div className="border-t border-border pt-5">
              <p className="text-xs font-medium text-muted-foreground">{agent.role}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AgentList title="Strengths" items={agent.strengths} positive />
              <AgentList title="Opportunities" items={agent.opportunities} />
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
              <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                Highest-impact action
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                {agent.highestImpactAction}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentList({
  title,
  items,
  positive,
}: {
  title: string;
  items: string[];
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface p-4">
      <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
        {title}
      </p>
      <ul className="mt-2.5 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
            <span
              aria-hidden="true"
              className={cn(
                "mt-1.5 size-1.5 shrink-0 rounded-full",
                positive ? "bg-primary" : "bg-muted-foreground/60",
              )}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
