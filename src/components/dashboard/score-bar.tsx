import { scoreStroke } from "@/lib/dashboard/scoring";
import { cn } from "@/lib/utils";

/**
 * Thin horizontal score meter. Draws itself when `active` turns true.
 */
export function ScoreBar({
  score,
  active,
  className,
  delay = 0,
}: {
  score: number;
  active: boolean;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}
      role="presentation"
    >
      <div
        className="h-full rounded-full"
        style={{
          width: active ? `${score}%` : "0%",
          background: scoreStroke(score),
          transition: `width var(--motion-page) var(--motion-ease) ${delay}ms`,
        }}
      />
    </div>
  );
}
