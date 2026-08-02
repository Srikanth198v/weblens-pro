import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { SiteNav } from "@/components/layout/site-nav";
import { Skeleton } from "@/components/ui/skeleton";

const CompareView = lazy(() =>
  import("@/components/report/compare-view").then((m) => ({ default: m.CompareView })),
);

const title = "Compare website reports — WebLens AI";
const description =
  "Put two website analyses side by side and see exactly which scores improved, which declined and which stayed the same.";

export const Route = createFileRoute("/reports/compare")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-[76rem] px-5 pt-24 pb-28 sm:px-8 sm:pt-28">
        <header className="pb-8">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Library</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Compare reports
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Choose two analyses to see what changed between them.
          </p>
        </header>

        <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
          <CompareView />
        </Suspense>
      </main>
    </div>
  );
}
