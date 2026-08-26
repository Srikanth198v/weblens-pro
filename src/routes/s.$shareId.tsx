import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { EvidenceSummary } from "@/components/dashboard/evidence-summary";
import { QuickSummary } from "@/components/dashboard/quick-summary";
import { ScoreBreakdown } from "@/components/dashboard/score-breakdown";
import { BrandMark } from "@/components/layout/brand-mark";
import { ExecutiveSummary } from "@/components/report/executive-summary";
import { ImprovementOpportunities } from "@/components/report/improvement-opportunities";
import { ReportHeader } from "@/components/report/report-header";
import { StrengthsSection } from "@/components/report/strengths-section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalysisResult } from "@/lib/analysis/types";
import { buildDashboardReport } from "@/lib/dashboard/build-report";
import { buildReportView } from "@/lib/report/build-report-view";
import { readSharedReport } from "@/lib/reports/cloud";

const title = "Shared website report — WebLens AI";
const description =
  "A view-only WebLens AI website report: overall score, strengths and prioritised improvement opportunities.";

export const Route = createFileRoute("/s/$shareId")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharedReportPage,
});

function SharedReportPage() {
  const { shareId } = Route.useParams();
  const [state, setState] = useState<
    { status: "loading" } | { status: "missing" } | { status: "ready"; result: AnalysisResult }
  >({ status: "loading" });

  useEffect(() => {
    let active = true;
    void readSharedReport(shareId).then((result) => {
      if (!active) return;
      setState(result ? { status: "ready", result } : { status: "missing" });
    });
    return () => {
      active = false;
    };
  }, [shareId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="safe-x mx-auto flex h-16 w-full max-w-[76rem] items-center justify-between px-5 sm:px-8">
        <BrandMark />
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground">
          View only
        </span>
      </header>

      <main
        id="main-content"
        className="motion-page-enter safe-x mx-auto w-full max-w-[76rem] px-5 pb-28 sm:px-8"
      >
        {state.status === "loading" ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        ) : null}

        {state.status === "missing" ? <SharedMissing /> : null}
        {state.status === "ready" ? <SharedBody result={state.result} /> : null}
      </main>
    </div>
  );
}

function SharedMissing() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-card">
      <h1 className="font-display text-2xl font-bold text-foreground">This link isn't available</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        The share link has been turned off or never existed. Ask whoever sent it for a fresh link,
        or run your own analysis in under a minute.
      </p>
      <Button asChild size="lg" className="mt-8 min-h-12 rounded-full px-7">
        <Link to="/">Analyze a website</Link>
      </Button>
    </div>
  );
}

function SharedBody({ result }: { result: AnalysisResult }) {
  const report = useMemo(() => buildDashboardReport(result), [result]);
  const view = useMemo(() => buildReportView(report), [report]);

  return (
    <>
      <ReportHeader
        report={report}
        lead={`${report.siteName} sits at ${report.overallScore} out of 100. This is a shared, view-only copy of the WebLens AI report.`}
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
        id="breakdown"
        eyebrow="Section 02"
        title="Score Breakdown"
        description="Exactly how the overall number is made up, area by area."
      >
        <ScoreBreakdown report={report} />
      </DashboardSection>

      <DashboardSection
        id="summary"
        eyebrow="Section 03"
        title="Quick Summary"
        description="Where the site stands in each core area."
      >
        <QuickSummary categories={report.categories} />
      </DashboardSection>

      <DashboardSection
        id="strengths"
        eyebrow="Section 04"
        title="Strengths"
        description="What this site already does well, and why it matters commercially."
      >
        <StrengthsSection strengths={view.strengths} />
      </DashboardSection>

      <DashboardSection
        id="opportunities"
        eyebrow="Section 05"
        title="Improvement Opportunities"
        description="Grouped by effort so you can start with the changes that land quickest."
      >
        <ImprovementOpportunities groups={view.improvements} />
      </DashboardSection>

      <DashboardSection
        id="evidence"
        eyebrow="Section 06"
        title="Evidence Used"
        description="Every source checked for this analysis, including the ones we could not reach."
      >
        <EvidenceSummary evidenceReport={report.evidenceReport} />
      </DashboardSection>

      <div className="mt-10 rounded-3xl border border-border bg-surface p-6 text-center sm:p-8">
        <p className="font-display text-lg font-bold text-foreground">
          Want a report like this for your own site?
        </p>
        <Button asChild size="lg" className="mt-5 min-h-12 rounded-full px-7">
          <Link to="/">Analyze your website</Link>
        </Button>
      </div>
    </>
  );
}
