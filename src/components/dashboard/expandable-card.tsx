import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Reusable smooth-expanding card.
 * Uses a grid-rows transition so the height animates without measuring.
 */
export function ExpandableCard({
  header,
  children,
  defaultOpen = false,
  className,
  contentClassName,
  toggleLabel = "Toggle details",
}: {
  header: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
  toggleLabel?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-soft transition-shadow duration-200 hover:shadow-card",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex min-h-14 w-full items-center gap-4 rounded-2xl px-4 py-4 text-left sm:px-6"
      >
        <span className="min-w-0 flex-1">{header}</span>
        <span className="sr-only">{toggleLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={contentId}
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className={cn("px-4 pb-5 sm:px-6", contentClassName)}>{children}</div>
        </div>
      </div>
    </div>
  );
}
