import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";

import { HeroSection } from "@/components/landing/hero-section";
import { SiteNav } from "@/components/layout/site-nav";
import type { UrlAnalyzeFormHandle } from "@/components/landing/url-analyze-form";

const title = "WebLens AI — Professional Website Analysis Made Simple";
const description =
  "Paste any website address and WebLens AI turns the analysis into clear, actionable insights you can act on with confidence.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const formRef = useRef<UrlAnalyzeFormHandle | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav onAnalyzeClick={() => formRef.current?.focus()} />
      <main>
        <HeroSection
          formRef={formRef}
          onAnalyze={(url) => {
            // Brief pause so the press + lock animation reads before leaving.
            window.setTimeout(() => navigate({ to: "/analysis", search: { url } }), 260);
          }}
        />
      </main>
    </div>
  );
}
