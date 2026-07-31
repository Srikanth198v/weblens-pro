import { usePointerParallax } from "@/hooks/use-pointer-parallax";

/**
 * Barely-visible emerald gradient blobs. Depth only — never decoration
 * that competes with content.
 */
export function AmbientBackground() {
  const { x, y } = usePointerParallax(8);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="motion-drift absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl"
        style={{ marginLeft: x, marginTop: y }}
      />
      <div
        className="motion-drift absolute -right-32 top-1/3 size-[26rem] rounded-full bg-primary/6 blur-3xl"
        style={{ marginRight: -x, marginTop: -y, animationDelay: "-6s" }}
      />
      <div
        className="motion-drift absolute -left-32 bottom-0 size-[22rem] rounded-full bg-chart-2/6 blur-3xl"
        style={{ marginLeft: -x, animationDelay: "-11s" }}
      />
    </div>
  );
}
