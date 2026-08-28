import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";

import { HeroSection } from "@/components/landing/hero-section";
import { SiteNav } from "@/components/layout/site-nav";
import type { UrlAnalyzeFormHandle } from "@/components/landing/url-analyze-form";

const SITE_URL = "https://weblensai.lovable.app";
const title = "AI Website Analyzer — SEO, Performance & Accessibility Audit";
const description =
  "Run a free AI website analysis: SEO audit, performance audit, accessibility audit and design review, with prioritised fixes you can act on in minutes.";
const ogImage =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c0581d53-ddf8-4d04-a5cb-3d5f2c75dbfa/id-preview-e484d72f--c3a93f62-9524-4c3d-8bc7-e71c4a203d49.lovable.app-1785656149969.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "keywords",
        content:
          "AI website analysis, website SEO audit, website performance audit, accessibility audit, website analyzer",
      },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "WebLens AI",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/`,
          description,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: [
            "AI website analysis",
            "Website SEO audit",
            "Website performance audit",
            "Accessibility audit",
            "Design and business review",
          ],
        }),
      },
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
      <main id="main-content">
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
