/** Section registry — drives both the page order and the floating navigation. */
export const DASHBOARD_SECTIONS = [
  { id: "preview", label: "Website Preview", short: "Preview", icon: "monitor" },
  { id: "understanding", label: "Website Understanding", short: "Understanding", icon: "compass" },
  { id: "score", label: "Overall Score", short: "Score", icon: "gauge" },
  { id: "breakdown", label: "Score Breakdown", short: "Breakdown", icon: "sliders-horizontal" },
  { id: "summary", label: "Quick Summary", short: "Summary", icon: "layout-grid" },
  { id: "details", label: "Detailed Analysis", short: "Details", icon: "list-checks" },
  { id: "business", label: "Business Review", short: "Business", icon: "briefcase" },
  { id: "intelligence", label: "WebLens Intelligence", short: "Intelligence", icon: "sparkles" },
  { id: "recommendations", label: "Recommendations", short: "Actions", icon: "lightbulb" },
  { id: "export", label: "Export", short: "Export", icon: "download" },
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTIONS)[number]["id"];

export const DASHBOARD_SECTION_IDS = DASHBOARD_SECTIONS.map((section) => section.id);
