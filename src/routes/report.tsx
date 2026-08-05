import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo } from "react";

import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { DashboardErrorState } from "@/components/dashboard/dashboard-error-state";
import { AiConfidenceCard } from "@/components/dashboard/ai-confidence-card";
import { EvidenceSummary } from "@/components/dashboard/evidence-summary";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { SiteNav } from "@/components/layout/site-nav";
import { ExecutiveSummary } from "@/components/report/executive-summary";
import { ReportHeader } from "@/components/report/report-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardReport } from "@/hooks/use-dashboard-report";
import { buildReportView } from "@/lib/report/build-report-view";

const MethodologySection = lazy(() =>
  import("@/components/dashboard/methodology-section").then((m) => ({
    default: m.MethodologySection,
  })),
);
const StrengthsSection = lazy(() =>
  import("@/components/report/strengths-section").then((m) => ({ default: m.StrengthsSection })),
);
const ImprovementOpportunities = lazy(() =>
  import("@/components/report/improvement-opportunities").then((m) => ({
    default: m.ImprovementOpportunities,
  })),
);
const PriorityRoadmap = lazy(() =>
  import("@/components/report/priority-roadmap").then((m) => ({ default: m.PriorityRoadmap })),
);
const ExportCenter = lazy(() =>
  import("@/components/report/export-center").then((m) => ({ default: m.ExportCenter })),
);

const title = "Your website report — WebLens AI";
const description =
  "A client-ready website report: executive summary, strengths, prioritised opportunities and a clear roadmap.";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
});

function SectionFallback() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  );
}

function ReportPage() {
  const state = useDashboardReport();

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main id="main-content" className="motion-page-enter safe-x mx-auto w-full max-w-[76rem] px-5 pt-24 pb-28 sm:px-8 sm:pt-28">
        {state.status === "loading" ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        ) : null}

        {state.status === "empty" ? <DashboardEmptyState /> : null}
        {state.status === "error" ? <DashboardErrorState onRetry={state.reload} /> : null}
        {state.status === "ready" ? <ReportBody report={state.report} /> : null}
      </main>
    </div>
  );
}

function ReportBody({
  report,
}: {
  report: Extract<ReturnType<typeof useDashboardReport>, { status: "ready" }>["report"];
}) {
  const view = useMemo(() => buildReportView(report), [report]);

  return (
    <>
      <ReportHeader
        report={report}
        lead={`${report.siteName} sits at ${report.overallScore} out of 100. Below you'll find what's working, what to fix first, and the result each change should bring.`}
      />

      <DashboardSection
        id="executive-summary"
        eyebrow="Section 01"
        title="Executive Summary"
        description="The whole analysis in three short paragraphs, written for anyone."
      >
        <ExecutiveSummary paragraphs={view.summary} />
      </DashboardSection>

      <DashboardSection
        id="confidence"
        eyebrow="Section 02"
        title="AI Confidence"
        description="How much of this page could be read, and how sure these findings are."
      >
        <AiConfidenceCard evidenceReport={report.evidenceReport} />
      </DashboardSection>

      <DashboardSection
        id="strengths"
        eyebrow="Section 03"
        title="Strengths"
        description="What this site already does well, and why it matters commercially."
      >
        <Suspense fallback={<SectionFallback />}>
          <StrengthsSection strengths={view.strengths} />
        </Suspense>
      </DashboardSection>

      <DashboardSection
        id="opportunities"
        eyebrow="Section 04"
        title="Improvement Opportunities"
        description="Grouped by effort so you can start with the changes that land quickest."
      >
        <Suspense fallback={<SectionFallback />}>
          <ImprovementOpportunities groups={view.improvements} />
        </Suspense>
      </DashboardSection>

      <DashboardSection
        id="roadmap"
        eyebrow="Section 05"
        title="Priority Roadmap"
        description="The same actions in the order we would tackle them."
      >
        <Suspense fallback={<SectionFallback />}>
          <PriorityRoadmap report={report} />
        </Suspense>
      </DashboardSection>

      <DashboardSection
        id="evidence"
        eyebrow="Section 06"
        title="Evidence Used"
        description="Every source checked for this analysis, including the ones we could not reach."
      >
        <EvidenceSummary evidenceReport={report.evidenceReport} />
      </DashboardSection>

      <DashboardSection
        id="methodology"
        eyebrow="Section 07"
        title="How This Report Was Generated"
        description="The steps behind these findings, and what sits outside their reach."
      >
        <Suspense fallback={<SectionFallback />}>
          <MethodologySection evidenceReport={report.evidenceReport} />
        </Suspense>
      </DashboardSection>

      <DashboardSection id="export" eyebrow="Section 08" title="Export Center">
        <Suspense fallback={<SectionFallback />}>
          <ExportCenter report={report} />
        </Suspense>
      </DashboardSection>
    </>
  );
}
