import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * Consistent section shell: anchor target, heading block and reveal-on-scroll.
 * Every dashboard section uses it so spacing and rhythm never drift.
 */
export function DashboardSection({
  id,
  title,
  description,
  eyebrow,
  actions,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn("scroll-mt-28 pt-12 sm:pt-16", className)}
    >
      <Reveal>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={`${id}-heading`}
              className="mt-1.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </Reveal>

      <div className="mt-6">{children}</div>
    </section>
  );
}
