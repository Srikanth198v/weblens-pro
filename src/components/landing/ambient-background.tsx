import { usePointerParallax } from "@/hooks/use-pointer-parallax";

/**
 * Barely-visible emerald gradient blobs. Depth only — never decoration
 * that competes with content.
 */
export function AmbientBackground() {
  const { x, y } = usePointerParallax(8);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft top-down brand wash */}
      <div className="motion-breathe absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_-5%,var(--color-primary-soft),transparent_70%)] opacity-70" />

      <div
        className="motion-drift absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        style={{ marginLeft: x, marginTop: y }}
      />
      <div
        className="motion-drift absolute -right-32 top-1/3 size-[26rem] rounded-full bg-primary/8 blur-3xl"
        style={{ marginRight: -x, marginTop: -y, animationDelay: "-6s" }}
      />
      <div
        className="motion-drift absolute -left-32 bottom-0 size-[22rem] rounded-full bg-chart-2/8 blur-3xl"
        style={{ marginLeft: -x, animationDelay: "-11s" }}
      />
      <div
        className="motion-drift-slow absolute left-1/4 top-1/2 size-[18rem] rounded-full bg-chart-3/5 blur-3xl"
        style={{ marginTop: y, animationDelay: "-3s" }}
      />

      {/* Drifting light sweep */}
      <div className="motion-sweep absolute inset-y-0 -left-1/3 w-1/2 bg-[linear-gradient(100deg,transparent,color-mix(in_oklab,var(--color-primary)_9%,transparent),transparent)] blur-2xl" />
    </div>
  );
}
