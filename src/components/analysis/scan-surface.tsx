/**
 * Skeleton page content inside the browser preview, plus a slow emerald
 * scan line. Subtle by design — no laser effects.
 */
export function ScanSurface({ scanning }: { scanning: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="flex h-full flex-col gap-3 p-4 sm:gap-4 sm:p-6" aria-hidden="true">
        <div className="h-6 w-1/3 rounded-md bg-muted sm:h-7" />
        <div className="h-3 w-2/3 rounded bg-muted/70" />
        <div className="h-3 w-1/2 rounded bg-muted/70" />
        <div className="mt-1 grid flex-1 grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl bg-muted/60" />
          <div className="rounded-xl bg-muted/60" />
          <div className="rounded-xl bg-muted/60" />
        </div>
        <div className="h-3 w-3/5 rounded bg-muted/70" />
      </div>

      {scanning ? (
        <>
          <div className="motion-scan pointer-events-none absolute inset-x-0 top-0 h-24">
            <div className="h-full w-full bg-gradient-to-b from-transparent to-primary/12" />
            <div className="h-px w-full bg-primary/70 shadow-glow-soft" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-primary/[0.03]" />
        </>
      ) : null}
    </div>
  );
}
