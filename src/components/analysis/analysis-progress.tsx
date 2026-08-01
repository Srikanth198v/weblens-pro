export function AnalysisProgress({
  percent,
  message,
}: {
  percent: number;
  message: string;
}) {
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-secondary-foreground">Analyzing</span>
        <span className="font-display text-2xl font-bold tabular-nums text-foreground">
          {percent}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Analysis progress"
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-(--motion-component) ease-(--motion-ease)"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p
        key={message}
        aria-live="polite"
        className="motion-fade-swap mt-3 text-sm text-muted-foreground"
      >
        {message}
      </p>
    </div>
  );
}
