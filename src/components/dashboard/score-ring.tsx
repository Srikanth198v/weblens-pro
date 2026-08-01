import { useCountUp } from "@/hooks/use-count-up";
import { useInView } from "@/hooks/use-in-view";
import { scoreStroke } from "@/lib/dashboard/scoring";
import { cn } from "@/lib/utils";

/**
 * Animated circular score. The ring fills and the number counts up together,
 * once, when the ring first scrolls into view.
 */
export function ScoreRing({
  score,
  size = 220,
  strokeWidth = 14,
  label,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const value = useCountUp(score, { active: inView, duration: 1000 });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (inView ? score : 0) / 100);

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Score"}: ${score} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreStroke(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1000ms var(--motion-ease)" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-extrabold tracking-tight text-foreground tabular-nums"
          style={{ fontSize: size * 0.26 }}
        >
          {value}
        </span>
        <span className="text-xs font-medium text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}
