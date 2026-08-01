import type {
  ConsultantRecommendation,
  IntelligenceHighlight,
  IntelligenceProvider,
  IntelligenceReport,
  IntelligenceSnapshot,
} from "@/lib/intelligence/types";

type Guidance = {
  title: string;
  businessImpact: string;
  difficulty: ConsultantRecommendation["difficulty"];
  estimatedTime: string;
  whyThisMatters: string;
  recommendedAction: string[];
};

const GUIDANCE: Record<string, Guidance> = {
  design: {
    title: "Make the first screen say one thing clearly",
    businessImpact: "More visitors understand the offer before deciding to scroll or leave.",
    difficulty: "Moderate",
    estimatedTime: "3–5 hours",
    whyThisMatters:
      "People decide whether a site is relevant to them in a few seconds. When the opening screen carries one headline, one supporting sentence and one action, that decision becomes easy — and the rest of the page gets a chance to do its job.",
    recommendedAction: [
      "Write a single sentence describing what you do and who it is for",
      "Remove competing links from the first screen",
      "Keep one primary button, styled distinctly from everything else",
      "Test the result on a phone before publishing",
    ],
  },
  performance: {
    title: "Bring the first paint forward on mobile",
    businessImpact: "Fewer visitors abandon the page before it becomes usable.",
    difficulty: "Easy",
    estimatedTime: "1–3 hours",
    whyThisMatters:
      "Most visitors arrive on a phone, often on an average connection. Every second before the page becomes readable costs you a share of those people — and they rarely come back to try again.",
    recommendedAction: [
      "Compress the largest images and serve modern formats",
      "Set explicit width and height so the layout never jumps",
      "Lazy load anything below the fold",
      "Defer analytics and chat widgets until after first paint",
    ],
  },
  seo: {
    title: "Give every page its own search identity",
    businessImpact: "More qualified visitors arrive without paying for the click.",
    difficulty: "Easy",
    estimatedTime: "2–3 hours",
    whyThisMatters:
      "Search engines summarise your pages using the title and description you provide. When those are missing or duplicated, the summary is guessed for you — and a guessed summary rarely persuades anyone to click.",
    recommendedAction: [
      "Write a unique title under 60 characters for each page",
      "Write a description under 160 characters that states the benefit",
      "Use one H1 per page and nest headings in order",
      "Publish a sitemap and reference it from robots.txt",
    ],
  },
  accessibility: {
    title: "Make the site comfortable for every visitor",
    businessImpact: "A wider audience can complete key tasks without friction.",
    difficulty: "Easy",
    estimatedTime: "1–3 hours",
    whyThisMatters:
      "Accessibility work rarely shows up as a redesign, but it quietly widens your audience: better contrast helps anyone reading outdoors, clear labels help anyone in a hurry, and visible focus helps anyone using a keyboard.",
    recommendedAction: [
      "Raise text contrast to at least 4.5:1",
      "Pair every form field with a visible label",
      "Describe meaningful images with alternative text",
      "Make focus outlines clearly visible on every control",
    ],
  },
  business: {
    title: "Add proof next to every claim",
    businessImpact: "Hesitant visitors gain a reason to take the next step today.",
    difficulty: "Moderate",
    estimatedTime: "3–6 hours",
    whyThisMatters:
      "Visitors discount claims a business makes about itself. A named customer describing a specific outcome does the persuading for you, and placing it beside the claim is what turns interest into an enquiry.",
    recommendedAction: [
      "Collect two or three short customer quotes with real outcomes",
      "Place one proof point beside your primary action",
      "Add client logos or results where you have permission",
      "Explain pricing or process so nothing feels hidden",
    ],
  },
};

const STRENGTH_COPY: Record<string, string> = {
  design: "Your layout and typography give the page a considered, trustworthy feel.",
  performance: "The site loads quickly, which quietly improves everything else.",
  seo: "Search engines can already read and describe your pages accurately.",
  accessibility: "The experience works well across devices and input methods.",
  business: "Your offer and next step come across clearly to a first-time visitor.",
};

function priorityFor(score: number): ConsultantRecommendation["priority"] {
  if (score < 65) return "critical";
  if (score < 82) return "important";
  return "helpful";
}

function confidenceFor(score: number): number {
  return Math.max(72, Math.min(96, Math.round(96 - Math.abs(80 - score) * 0.35)));
}

function toRecommendation(
  category: { id: string; label: string; score: number },
): ConsultantRecommendation {
  const guidance = GUIDANCE[category.id] ?? GUIDANCE["design"]!;
  return {
    id: `intel-${category.id}`,
    title: guidance.title,
    priority: priorityFor(category.score),
    businessImpact: guidance.businessImpact,
    difficulty: guidance.difficulty,
    estimatedTime: guidance.estimatedTime,
    whyThisMatters: guidance.whyThisMatters,
    recommendedAction: guidance.recommendedAction,
    confidence: confidenceFor(category.score),
  };
}

/**
 * Default provider: rule-based, no network. Interprets scores the way a
 * consultant would — impact first, always naming a strength.
 */
export const heuristicIntelligence: IntelligenceProvider = {
  id: "heuristic-v1",

  generate(snapshot: IntelligenceSnapshot): IntelligenceReport {
    const ranked = [...snapshot.categories].sort((a, b) => a.score - b.score);
    const weakest = ranked[0]!;
    const strongest = ranked[ranked.length - 1]!;
    const quickWin =
      ranked.find((category) => GUIDANCE[category.id]?.difficulty === "Easy" && category.score < 90) ??
      ranked[1] ??
      weakest;

    const highlights: IntelligenceHighlight[] = [
      {
        kind: "top-opportunity",
        title: "Top Opportunity",
        subject: weakest.label,
        detail: GUIDANCE[weakest.id]?.businessImpact ?? "The largest gain available right now.",
        score: weakest.score,
      },
      {
        kind: "quick-win",
        title: "Quick Win",
        subject: quickWin.label,
        detail:
          GUIDANCE[quickWin.id]?.recommendedAction[0] ?? "A small change with an outsized effect.",
        score: quickWin.score,
      },
      {
        kind: "greatest-strength",
        title: "Greatest Strength",
        subject: strongest.label,
        detail: STRENGTH_COPY[strongest.id] ?? "This area is already working in your favour.",
        score: strongest.score,
      },
    ];

    const order = { critical: 0, important: 1, helpful: 2 } as const;
    const recommendations = ranked
      .map(toRecommendation)
      .sort((a, b) => order[a.priority] - order[b.priority]);

    return {
      highlights,
      recommendations,
      celebration: `${snapshot.siteName} is already ahead on ${strongest.label.toLowerCase()} — keep that as the standard while you lift the rest.`,
    };
  },
};
