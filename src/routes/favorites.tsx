import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { SiteNav } from "@/components/layout/site-nav";
import { Skeleton } from "@/components/ui/skeleton";

const ReportsList = lazy(() =>
  import("@/components/report/reports-list").then((m) => ({ default: m.ReportsList })),
);

const title = "Favorite reports — WebLens AI";
const description =
  "The website analyses you starred, kept together for quick access and comparison.";

export const Route = createFileRoute("/favorites")({
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
  component: FavoritesPage,
});

function FavoritesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main id="main-content" className="motion-page-enter page-container pt-24 pb-28 sm:pt-28">
        <header className="pb-8">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Library</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Favorites
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The reports you starred, updated the moment you change them.
          </p>
        </header>

        <Suspense fallback={<Skeleton className="h-72 w-full rounded-3xl" />}>
          <ReportsList
            favoritesOnly
            emptyTitle="No favorites yet"
            emptyDescription="Star a report in your history and it will appear here for one-tap access."
          />
        </Suspense>
      </main>
    </div>
  );
}
