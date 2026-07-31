import { Crosshair, Lock, Zap, type LucideIcon } from "lucide-react";

const INDICATORS: { icon: LucideIcon; label: string }[] = [
  { icon: Zap, label: "Fast Analysis" },
  { icon: Lock, label: "Secure" },
  { icon: Crosshair, label: "Actionable Insights" },
];

export function TrustIndicators() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
      {INDICATORS.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon aria-hidden="true" className="size-4 text-primary" />
          {label}
        </li>
      ))}
    </ul>
  );
}
