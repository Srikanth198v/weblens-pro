import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteNav } from "@/components/layout/site-nav";
import { Button } from "@/components/ui/button";
import { readAnalysisResult } from "@/lib/analysis/store";
import type { AnalysisResult } from "@/lib/analysis/types";

const title = "Your analysis dashboard — WebLens AI";
const description =
  "Review your website's WebLens AI analysis: overall score and category-level results.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: DashboardPage,
});

/**
 * Phase 2 placeholder: receives the analysis result so the success transition
 * has a destination. The full dashboard is built in Phase 3.
 */
function DashboardPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    setResult(readAnalysisResult());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto w-full max-w-[72rem] px-5 pt-28 pb-16 sm:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Analysis dashboard
        </h1>
        {result ? (
          <p className="mt-3 text-muted-foreground">
            Analysis ready for{" "}
            <span className="font-medium text-foreground">
              {result.url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
            </span>{" "}
            — overall score {result.overallScore}. The full dashboard arrives in the next phase.
          </p>
        ) : (
          <div className="mt-4">
            <p className="text-muted-foreground">
              There's no analysis to show yet. Start with a website address.
            </p>
            <Button asChild className="mt-6 min-h-11 rounded-full px-6">
              <Link to="/">Analyze a website</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
