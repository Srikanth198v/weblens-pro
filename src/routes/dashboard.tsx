import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo } from "react";

import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardErrorState } from "@/components/dashboard/dashboard-error-state";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { AiConfidenceCard } from "@/components/dashboard/ai-confidence-card";
import { AiWebsiteUnderstandingSection } from "@/components/dashboard/ai-website-understanding";
import { EvidenceSummary } from "@/components/dashboard/evidence-summary";
import { OverallScore } from "@/components/dashboard/overall-score";
import { ScoreBreakdown } from "@/components/dashboard/score-breakdown";
import { QuickSummary } from "@/components/dashboard/quick-summary";
import { SectionNav } from "@/components/dashboard/section-nav";
import { WebsitePreviewCard } from "@/components/dashboard/website-preview-card";
import { WebsiteUnderstandingSection } from "@/components/dashboard/website-understanding";
import { SiteNav } from "@/components/layout/site-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardReport } from "@/hooks/use-dashboard-report";
import { buildAiUnderstanding } from "@/lib/analysis/ai-understanding";
import { shareReport } from "@/lib/dashboard/export";
import { buildAgentPanel } from "@/lib/intelligence/agents";
import { buildPriorityRecommendations } from "@/lib/dashboard/priority-recommendations";

/** Lower sections load on demand so the first screen stays light. */
const DetailedAnalysis = lazy(() =>
  import("@/components/dashboard/detailed-analysis").then((module) => ({
    default: module.DetailedAnalysis,
  })),
);
const BusinessReview = lazy(() =>
  import("@/components/dashboard/business-review").then((module) => ({
    default: module.BusinessReview,
  })),
);
const IntelligenceSection = lazy(() =>
  import("@/components/dashboard/intelligence-section").then((module) => ({
    default: module.IntelligenceSection,
  })),
);
const AgentPanelSection = lazy(() =>
  import("@/components/dashboard/agent-panel").then((module) => ({
    default: module.AgentPanelSection,
  })),
);
const RecommendationsSection = lazy(() =>
  import("@/components/dashboard/recommendations-section").then((module) => ({
    default: module.RecommendationsSection,
  })),
);
const PriorityRecommendationsSection = lazy(() =>
  import("@/components/dashboard/priority-recommendations-section").then((module) => ({
    default: module.PriorityRecommendationsSection,
  })),
);
const MethodologySection = lazy(() =>
  import("@/components/dashboard/methodology-section").then((module) => ({
    default: module.MethodologySection,
  })),
);
const VisualIntelligenceSection = lazy(() =>
  import("@/components/dashboard/visual-intelligence").then((module) => ({
    default: module.VisualIntelligenceSection,
  })),
);
const ExportArea = lazy(() =>
  import("@/components/dashboard/export-area").then((module) => ({ default: module.ExportArea })),
);

const title = "Your website analysis dashboard — WebLens AI";
const description =
  "A clear read on your website's design, performance, SEO, accessibility and business signals, with prioritised actions.";

export const Route = createFileRoute("/dashboard")({
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
  component: DashboardPage,
});

function SectionFallback() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  );
}

function DashboardPage() {
  const state = useDashboardReport();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main id="main-content" className="motion-page-enter safe-x mx-auto w-full max-w-[76rem] px-5 pt-24 pb-28 sm:px-8 sm:pt-28 xl:pr-24">
        {state.status === "loading" ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        ) : null}

        {state.status === "empty" ? <DashboardEmptyState /> : null}

        {state.status === "error" ? <DashboardErrorState onRetry={state.reload} /> : null}

        {state.status === "ready" ? (
          <DashboardContent state={state} />
        ) : null}
      </main>
    </div>
  );
}

function DashboardContent({
  state,
}: {
  state: Extract<ReturnType<typeof useDashboardReport>, { status: "ready" }>;
}) {
  const { report, intelligence, reload } = state;
  const agentPanel = useMemo(() => buildAgentPanel(report), [report]);
  const priorities = useMemo(() => buildPriorityRecommendations(report), [report]);
  const aiUnderstanding = useMemo(
    () => buildAiUnderstanding(report.understanding, report.evidence, report.siteName),
    [report],
  );
  const gptSummary = useGptSummary(report);


  return (
    <>
      <SectionNav />

      <header className="pb-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          Analysis complete
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {report.siteName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reviewed {new Date(report.completedAt).toLocaleDateString()} · {report.displayUrl}
        </p>
      </header>

      <DashboardSection
        id="preview"
        eyebrow="Section 01"
        title="Website Preview"
        description="The page WebLens reviewed, exactly as it was captured."
      >
        <WebsitePreviewCard
          report={report}
          onRefresh={reload}
          onShare={() => void shareReport(report)}
        />
      </DashboardSection>

      <DashboardSection
        id="ai-understanding"
        eyebrow="Section 02"
        title="AI Website Understanding"
        description="What this site is, who it serves and what it wants visitors to do — before anything is scored."
      >
        <AiWebsiteUnderstandingSection understanding={aiUnderstanding} />
      </DashboardSection>

      <DashboardSection
        id="visual"
        eyebrow="Section 03"
        title="Visual Intelligence"
        description="How the page actually looks on screen, read from real desktop and mobile screenshots."
      >
        <Suspense fallback={<SectionFallback />}>
          <VisualIntelligenceSection url={report.url} />
        </Suspense>
      </DashboardSection>

      <DashboardSection
        id="confidence"
        eyebrow="Section 04"
        title="AI Confidence"
        description="How much of this page we were able to read, and how sure the findings are."
      >
        <AiConfidenceCard evidenceReport={report.evidenceReport} />
      </DashboardSection>

      <DashboardSection
        id="understanding"
        eyebrow="Section 05"
        title="Website Understanding"
        description="What WebLens read on the page, before scoring anything."
      >
        <WebsiteUnderstandingSection
          understanding={report.understanding}
          confidence={report.confidence}
        />
      </DashboardSection>

      <DashboardSection
        id="agents"
        eyebrow="Section 06"
        title="Multi-Agent Intelligence"
        description="Six specialists review the same evidence, then reconcile it into one plan."
      >
        <Suspense fallback={<SectionFallback />}>
          <AgentPanelSection panel={agentPanel} />
        </Suspense>
      </DashboardSection>

      <DashboardSection
        id="score"
        eyebrow="Section 07"
        title="Overall Score"
        description="A single measure combining design, performance, SEO, accessibility and business signals."
      >
        <OverallScore report={report} />
      </DashboardSection>

      <DashboardSection
        id="breakdown"
        eyebrow="Section 08"
        title="Score Breakdown"
        description="Exactly how the overall number is made up, area by area."
      >
        <ScoreBreakdown report={report} />
      </DashboardSection>

      <DashboardSection
        id="summary"
        eyebrow="Section 09"
        title="Quick Summary"
        description="Where the site stands in each core area."
      >
        <QuickSummary categories={report.categories} />
      </DashboardSection>

      <DashboardSection
        id="details"
        eyebrow="Section 10"
        title="Detailed Analysis"
        description="Open any area to see what is working, what isn't, and what to do next."
      >
        <Suspense fallback={<SectionFallback />}>
          <DetailedAnalysis categories={report.categories} />
        </Suspense>
      </DashboardSection>

      <DashboardSection
        id="business"
        eyebrow="Section 11"
        title="Business Review"
        description="How the site performs as a business asset, not just as a webpage."
      >
        <Suspense fallback={<SectionFallback />}>
          <BusinessReview metrics={report.business} />
        </Suspense>
      </DashboardSection>

      <DashboardSection
        id="intelligence"
        eyebrow="Section 12"
        title="WebLens Intelligence"
        description="Consultant-style guidance: what to change, why it matters, and what it takes."
      >
        <Suspense fallback={<SectionFallback />}>
          <IntelligenceSection intelligence={intelligence} />
        </Suspense>
      </DashboardSection>

      <DashboardSection
        id="priority"
        eyebrow="Section 13"
        title="Priority Recommendations"
        description="The three to five actions with the strongest business impact for the effort involved."
      >
        <Suspense fallback={<SectionFallback />}>
          <PriorityRecommendationsSection view={priorities} />
        </Suspense>
      </DashboardSection>

      <DashboardSection
        id="recommendations"
        eyebrow="Section 14"
        title="Recommendations"
        description="Every action from this analysis, grouped by priority."
      >
        <Suspense fallback={<SectionFallback />}>
          <RecommendationsSection items={report.recommendations} />
        </Suspense>
      </DashboardSection>

      <DashboardSection
        id="evidence"
        eyebrow="Section 15"
        title="Evidence Used"
        description="Every source checked for this analysis, including the ones we could not reach."
      >
        <EvidenceSummary evidenceReport={report.evidenceReport} />
      </DashboardSection>

      <DashboardSection
        id="methodology"
        eyebrow="Section 16"
        title="How This Report Was Generated"
        description="The steps behind these findings, and what sits outside their reach."
      >
        <Suspense fallback={<SectionFallback />}>
          <MethodologySection evidenceReport={report.evidenceReport} />
        </Suspense>
      </DashboardSection>

      <DashboardSection id="export" eyebrow="Section 17" title="Export">
        <Suspense fallback={<SectionFallback />}>
          <ExportArea report={report} />
        </Suspense>
      </DashboardSection>

    </>
  );
}
