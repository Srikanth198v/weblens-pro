import { Check } from "lucide-react";

/** Brief confirmation shown at 100% before the dashboard fade. */
export function AnalysisComplete() {
  return (
    <div className="motion-pop flex items-center justify-center gap-3 rounded-full border border-primary/25 bg-primary-soft px-5 py-3">
      <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check aria-hidden="true" className="size-3.5" />
      </span>
      <span className="text-sm font-semibold text-accent-foreground">Analysis Complete</span>
    </div>
  );
}
