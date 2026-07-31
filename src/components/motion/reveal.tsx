import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type RevealProps = {
  children: ReactNode;
  /** Stagger delay in milliseconds, from the shared motion scale. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
};

/**
 * Section reveal: fade in + move up 20px over 600ms, once, on enter.
 * Respects reduced motion by rendering the final state immediately.
 */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const Tag = as;
  const ref = useRef<HTMLElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn("motion-reveal", visible && "is-visible", className)}
      style={reducedMotion ? undefined : { transitionDelay: `${delay}ms` }}
      data-reduced-motion={reducedMotion ? "true" : undefined}
    >
      {children}
    </Tag>
  );
}
