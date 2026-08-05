import {
  Briefcase,
  Compass,
  Download,
  Gauge,
  LayoutGrid,
  Lightbulb,
  ListChecks,
  Monitor,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { useActiveSection } from "@/hooks/use-active-section";
import { DASHBOARD_SECTIONS, DASHBOARD_SECTION_IDS } from "@/lib/dashboard/sections";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  monitor: Monitor,
  compass: Compass,
  gauge: Gauge,
  "sliders-horizontal": SlidersHorizontal,
  "layout-grid": LayoutGrid,
  "list-checks": ListChecks,
  briefcase: Briefcase,
  sparkles: Sparkles,
  lightbulb: Lightbulb,
  download: Download,
};

/**
 * Floating section navigation — a rail on the right for desktop,
 * a bottom bar on mobile. Highlights the section currently in view.
 */
export function SectionNav() {
  const active = useActiveSection(DASHBOARD_SECTION_IDS as unknown as string[]);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <nav
        aria-label="Dashboard sections"
        className="fixed top-1/2 right-6 z-30 hidden -translate-y-1/2 flex-col gap-1 rounded-full border border-border bg-card/85 p-2 shadow-card backdrop-blur-md xl:flex print:hidden"
      >
        {DASHBOARD_SECTIONS.map((section) => {
          const Icon = ICONS[section.icon] ?? Monitor;
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => go(section.id)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "group flex size-11 items-center justify-center rounded-full transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-4.5" />
              <span className="sr-only">{section.label}</span>
            </button>
          );
        })}
      </nav>

      <nav
        aria-label="Dashboard sections"
        className="safe-bottom fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-border bg-card/90 p-1.5 shadow-lifted backdrop-blur-md xl:hidden print:hidden"
      >

        <ul className="flex snap-x gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DASHBOARD_SECTIONS.map((section) => {
            const Icon = ICONS[section.icon] ?? Monitor;
            const isActive = active === section.id;
            return (
              <li key={section.id} className="snap-start">
                <button
                  type="button"
                  onClick={() => go(section.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground active:bg-secondary",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {section.short}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
