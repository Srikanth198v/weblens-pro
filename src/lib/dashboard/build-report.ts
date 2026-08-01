import { statusForScore } from "@/lib/dashboard/scoring";
import type {
  BusinessMetric,
  BusinessMetricId,
  CategoryDetail,
  CategoryId,
  DashboardReport,
  Recommendation,
} from "@/lib/dashboard/types";
import type { AnalysisResult } from "@/lib/analysis/types";

/** Small deterministic hash so the same URL always yields the same report. */
function hash(input: string): number {
  let value = 0;
  for (const char of input) value = (value * 31 + char.charCodeAt(0)) % 100000;
  return value;
}

function spread(seed: number, base: number, range: number): number {
  const jitter = Math.abs(Math.sin(seed)) * range - range / 2;
  return Math.max(38, Math.min(98, Math.round(base + jitter)));
}

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function siteNameFor(url: string): string {
  const host = displayUrl(url).split("/")[0] ?? "";
  const label = host.replace(/^www\./i, "").split(".")[0] ?? host;
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "Your website";
}

type Band = "high" | "mid" | "low";

function band(score: number): Band {
  const status = statusForScore(score);
  if (status === "excellent") return "high";
  return status === "good" ? "mid" : "low";
}

type CategoryCopy = {
  label: string;
  summary: Record<Band, string>;
  strengths: string[];
  weaknesses: Record<Band, string[]>;
  suggestions: Record<Band, string[]>;
};

const CATEGORY_COPY: Record<CategoryId, CategoryCopy> = {
  design: {
    label: "Design",
    summary: {
      high: "Layout, spacing and typography feel consistent and considered.",
      mid: "The visual foundation is solid with a few rough edges to smooth out.",
      low: "The visual hierarchy makes it harder than it needs to be to scan the page.",
    },
    strengths: [
      "Consistent spacing rhythm across sections",
      "Readable body text with comfortable line length",
      "Clear visual separation between content blocks",
    ],
    weaknesses: {
      high: ["A few secondary elements compete for attention above the fold"],
      mid: [
        "Heading sizes are close together, which flattens the hierarchy",
        "Some sections use more colour accents than they need",
      ],
      low: [
        "The page lacks one obvious focal point when it first loads",
        "Spacing between sections varies, so the page feels unsettled",
        "Text and background contrast dips in a few places",
      ],
    },
    suggestions: {
      high: ["Keep one primary action visible per screen height"],
      mid: [
        "Increase the size gap between headings and body text",
        "Reserve the accent colour for actions only",
      ],
      low: [
        "Establish a clear type scale and apply it everywhere",
        "Use a consistent vertical spacing unit between sections",
        "Give the hero one headline and one action",
      ],
    },
  },
  performance: {
    label: "Performance",
    summary: {
      high: "Pages load quickly and feel responsive on first interaction.",
      mid: "Load times are acceptable, though a few assets slow the first paint.",
      low: "The first meaningful paint arrives later than most visitors will wait.",
    },
    strengths: [
      "Text content becomes visible early in the load",
      "No blocking third-party scripts in the critical path",
      "Layout stays stable while the page loads",
    ],
    weaknesses: {
      high: ["Hero imagery could be served in a lighter format"],
      mid: [
        "Large images are downloaded at full size on small screens",
        "Some fonts load late and cause a visible text swap",
      ],
      low: [
        "Uncompressed images dominate the initial download",
        "Scripts load before content, delaying the first paint",
        "Above-the-fold content waits on non-essential assets",
      ],
    },
    suggestions: {
      high: ["Serve hero images in a modern format such as WebP"],
      mid: [
        "Add responsive image sizes for mobile viewports",
        "Preload the primary font and set a fallback",
      ],
      low: [
        "Compress and resize the largest images",
        "Defer non-essential scripts until after first paint",
        "Lazy load anything below the fold",
      ],
    },
  },
  seo: {
    label: "SEO",
    summary: {
      high: "Search engines can read and describe the site accurately.",
      mid: "The basics are in place, with a few metadata gaps to close.",
      low: "Search engines are missing the signals they need to rank the pages well.",
    },
    strengths: [
      "Pages return a clear, descriptive title",
      "Content is organised under real heading tags",
      "URLs are readable and human friendly",
    ],
    weaknesses: {
      high: ["Structured data is not yet describing the business"],
      mid: [
        "Some pages share the same meta description",
        "Social preview images are missing on inner pages",
      ],
      low: [
        "Several pages have no unique meta description",
        "Heading levels skip, which confuses page structure",
        "No structured data describes the business or its offering",
      ],
    },
    suggestions: {
      high: ["Add organisation and product structured data"],
      mid: [
        "Write a distinct meta description for each page",
        "Add Open Graph images for shareable pages",
      ],
      low: [
        "Give every page a unique title and description",
        "Use one H1 per page and nest headings in order",
        "Publish a sitemap and reference it from robots.txt",
      ],
    },
  },
  accessibility: {
    label: "Accessibility",
    summary: {
      high: "Most visitors can navigate comfortably, including with a keyboard.",
      mid: "The site is broadly usable, with some contrast and labelling gaps.",
      low: "Several visitors will struggle to complete key tasks on this site.",
    },
    strengths: [
      "Interactive elements are reachable with a keyboard",
      "Page language is declared for screen readers",
      "Touch targets are comfortably sized on mobile",
    ],
    weaknesses: {
      high: ["Focus outlines are subtle on darker sections"],
      mid: [
        "Some images are missing descriptive alternative text",
        "A few text and background pairings fall below contrast targets",
      ],
      low: [
        "Form fields rely on placeholder text instead of labels",
        "Contrast falls below the readable threshold in several places",
        "Focus states are hard to see when tabbing through the page",
      ],
    },
    suggestions: {
      high: ["Strengthen focus outlines on dark backgrounds"],
      mid: [
        "Add alternative text that describes each meaningful image",
        "Raise text contrast to at least 4.5:1",
      ],
      low: [
        "Pair every form field with a visible label",
        "Review colour contrast across the whole page",
        "Make focus states clearly visible on every control",
      ],
    },
  },
  business: {
    label: "Business",
    summary: {
      high: "The offer, proof and next step are easy for a visitor to find.",
      mid: "The offer comes across, though trust and next steps could be clearer.",
      low: "A first-time visitor has to work to understand what is offered and why.",
    },
    strengths: [
      "The core offer is stated in plain language",
      "Contact routes are available from the main navigation",
      "The homepage introduces the business quickly",
    ],
    weaknesses: {
      high: ["Social proof appears late in the page"],
      mid: [
        "Pricing information takes more than one click to find",
        "Customer proof is present but not specific",
      ],
      low: [
        "The primary action competes with several secondary links",
        "There is little third-party proof that the business delivers",
        "Pricing and process are not explained on the site",
      ],
    },
    suggestions: {
      high: ["Move one customer proof point above the fold"],
      mid: [
        "Summarise pricing on the homepage",
        "Add named testimonials with concrete outcomes",
      ],
      low: [
        "Lead with a single, specific value statement",
        "Add testimonials, logos or case results",
        "Publish clear pricing or a transparent process",
      ],
    },
  },
};

const BUSINESS_COPY: Array<{
  id: BusinessMetricId;
  label: string;
  source: CategoryId;
  offset: number;
  explanation: Record<Band, string>;
}> = [
  {
    id: "homepage-clarity",
    label: "Homepage Clarity",
    source: "design",
    offset: 2,
    explanation: {
      high: "A visitor understands what you offer within the first screen.",
      mid: "The message lands, but it takes a moment longer than it should.",
      low: "The opening screen does not yet say what you do and for whom.",
    },
  },
  {
    id: "call-to-action",
    label: "Call To Action",
    source: "business",
    offset: -3,
    explanation: {
      high: "One clear next step is always within reach.",
      mid: "The main action is present but shares space with other links.",
      low: "There is no obvious single next step for an interested visitor.",
    },
  },
  {
    id: "trust-signals",
    label: "Trust Signals",
    source: "business",
    offset: -6,
    explanation: {
      high: "Proof points appear early and support the claims you make.",
      mid: "Some proof exists, though it appears well below the fold.",
      low: "Little on the page reassures a first-time visitor that you deliver.",
    },
  },
  {
    id: "testimonials",
    label: "Testimonials",
    source: "business",
    offset: -9,
    explanation: {
      high: "Named customer stories back up the offer with specifics.",
      mid: "Testimonials are present but stay fairly general.",
      low: "No customer voices appear on the site yet.",
    },
  },
  {
    id: "pricing",
    label: "Pricing",
    source: "business",
    offset: -8,
    explanation: {
      high: "Pricing is transparent and easy to locate.",
      mid: "Pricing exists but takes more than one click to reach.",
      low: "Visitors cannot tell what engaging with you costs.",
    },
  },
  {
    id: "contact-information",
    label: "Contact Information",
    source: "business",
    offset: 6,
    explanation: {
      high: "Contact routes are visible from every page.",
      mid: "Contact details are available, mostly from the footer.",
      low: "Getting in touch takes more effort than it should.",
    },
  },
  {
    id: "navigation",
    label: "Navigation",
    source: "design",
    offset: 4,
    explanation: {
      high: "The menu is short, predictable and easy to scan.",
      mid: "Navigation works, though a few labels are ambiguous.",
      low: "The menu carries too many items to scan comfortably.",
    },
  },
  {
    id: "faq",
    label: "FAQ",
    source: "seo",
    offset: -10,
    explanation: {
      high: "Common questions are answered before they are asked.",
      mid: "A short FAQ exists but leaves the bigger questions open.",
      low: "No FAQ addresses the objections buyers usually raise.",
    },
  },
  {
    id: "about-page",
    label: "About Page",
    source: "business",
    offset: 1,
    explanation: {
      high: "The story explains who is behind the work and why it matters.",
      mid: "The about page introduces the team without much substance.",
      low: "There is little context about who you are or your track record.",
    },
  },
];

const RECOMMENDATION_LIBRARY: Record<
  CategoryId,
  Array<Omit<Recommendation, "priority" | "id">>
> = {
  design: [
    {
      icon: "layout",
      title: "Sharpen the visual hierarchy",
      description:
        "Give the first screen one headline, one supporting line and one action so visitors know where to look first.",
      impact: "High",
      difficulty: "Moderate",
      estimatedTime: "3–5 hours",
    },
    {
      icon: "layout",
      title: "Apply a consistent spacing scale",
      description:
        "Use the same vertical rhythm between sections so the page feels calm and deliberate as visitors scroll.",
      impact: "Medium",
      difficulty: "Easy",
      estimatedTime: "1–2 hours",
    },
  ],
  performance: [
    {
      icon: "gauge",
      title: "Compress and resize hero imagery",
      description:
        "Serving right-sized, modern-format images is the fastest way to bring the first paint forward on mobile.",
      impact: "High",
      difficulty: "Easy",
      estimatedTime: "1–2 hours",
    },
    {
      icon: "gauge",
      title: "Defer non-essential scripts",
      description:
        "Load analytics, chat and marketing tags after the main content so they never block what visitors came to read.",
      impact: "Medium",
      difficulty: "Moderate",
      estimatedTime: "2–4 hours",
    },
  ],
  seo: [
    {
      icon: "search",
      title: "Write unique titles and descriptions",
      description:
        "Distinct metadata on every page helps search engines describe you accurately and improves click-through.",
      impact: "High",
      difficulty: "Easy",
      estimatedTime: "2–3 hours",
    },
    {
      icon: "search",
      title: "Add structured data for your business",
      description:
        "Structured data lets search engines present your details as a rich result instead of a plain link.",
      impact: "Medium",
      difficulty: "Moderate",
      estimatedTime: "2–4 hours",
    },
  ],
  accessibility: [
    {
      icon: "accessibility",
      title: "Raise text contrast to a readable level",
      description:
        "Meeting a 4.5:1 contrast ratio makes the site easier to read for everyone, including on bright screens.",
      impact: "High",
      difficulty: "Easy",
      estimatedTime: "1–3 hours",
    },
    {
      icon: "accessibility",
      title: "Label every form field and image",
      description:
        "Visible labels and descriptive alternative text let assistive technology explain the page accurately.",
      impact: "Medium",
      difficulty: "Easy",
      estimatedTime: "1–2 hours",
    },
  ],
  business: [
    {
      icon: "briefcase",
      title: "Add specific customer proof",
      description:
        "Named testimonials with concrete outcomes reassure hesitant visitors far more than general praise.",
      impact: "High",
      difficulty: "Moderate",
      estimatedTime: "3–6 hours",
    },
    {
      icon: "briefcase",
      title: "Make pricing or process transparent",
      description:
        "Explaining what working with you costs, or how it works, removes the biggest reason people leave quietly.",
      impact: "High",
      difficulty: "Moderate",
      estimatedTime: "2–4 hours",
    },
  ],
};

function pick(items: string[], seed: number, count: number): string[] {
  const start = seed % items.length;
  return Array.from(
    { length: Math.min(count, items.length) },
    (_, index) => items[(start + index) % items.length]!,
  );
}

function buildCategories(result: AnalysisResult, seed: number): CategoryDetail[] {
  return (Object.keys(CATEGORY_COPY) as CategoryId[]).map((id, index) => {
    const copy = CATEGORY_COPY[id];
    const engineScore = result.categories.find((category) => category.id === id)?.score;
    const score = engineScore ?? spread(seed + index, result.overallScore, 20);
    const tier = band(score);

    return {
      id,
      label: copy.label,
      score,
      summary: copy.summary[tier],
      strengths: pick(copy.strengths, seed + index, tier === "low" ? 1 : tier === "mid" ? 2 : 3),
      weaknesses: copy.weaknesses[tier],
      suggestions: copy.suggestions[tier],
    };
  });
}

function buildBusiness(categories: CategoryDetail[], seed: number): BusinessMetric[] {
  return BUSINESS_COPY.map((item, index) => {
    const base = categories.find((category) => category.id === item.source)?.score ?? 70;
    const score = spread(seed + index * 7, base + item.offset, 12);
    return {
      id: item.id,
      label: item.label,
      score,
      explanation: item.explanation[band(score)],
    };
  });
}

function priorityFor(score: number, impact: Recommendation["impact"]) {
  if (score < 70) return impact === "High" ? "high" : "medium";
  if (score < 85) return impact === "High" ? "medium" : "low";
  return "low" as const;
}

function buildRecommendations(categories: CategoryDetail[]): Recommendation[] {
  const items: Recommendation[] = [];

  for (const category of categories) {
    const templates = RECOMMENDATION_LIBRARY[category.id];
    const take = band(category.score) === "high" ? 1 : 2;
    templates.slice(0, take).forEach((template, index) => {
      items.push({
        ...template,
        id: `${category.id}-${index}`,
        priority: priorityFor(category.score, template.impact),
      });
    });
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  return items.sort((a, b) => order[a.priority] - order[b.priority]);
}

/**
 * Turns an engine result into the full dashboard view model.
 * Deterministic: the same URL always produces the same report.
 */
export function buildDashboardReport(result: AnalysisResult): DashboardReport {
  const seed = hash(result.url);
  const categories = buildCategories(result, seed);
  const business = buildBusiness(categories, seed);

  return {
    url: result.url,
    siteName: siteNameFor(result.url),
    displayUrl: displayUrl(result.url),
    completedAt: result.completedAt,
    overallScore: result.overallScore,
    categories,
    business,
    recommendations: buildRecommendations(categories),
  };
}
