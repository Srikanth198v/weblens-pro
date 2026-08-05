import type { SiteEvidence } from "@/lib/analysis/evidence";
import type {
  CategoryId,
  RecommendationDifficulty,
  RecommendationImpact,
} from "@/lib/dashboard/types";

/**
 * Evidence-based scoring.
 *
 * Every category score is the weighted average of measurable factors. Each
 * factor carries the exact page measurement behind it, so the report can
 * always answer "why this score?" without inventing anything.
 */

export type FactorVerdict = "pass" | "warn" | "fail";

export type Remedy = {
  title: string;
  description: string;
  impact: RecommendationImpact;
  difficulty: RecommendationDifficulty;
  estimatedTime: string;
  icon: "layout" | "gauge" | "search" | "accessibility" | "briefcase" | "sparkles";
};

export type EvidenceFactor = {
  id: string;
  category: CategoryId;
  /** What was measured, e.g. "Image alt coverage". */
  label: string;
  /** The measurement itself, e.g. "12 images found, 7 without alt text". */
  detail: string;
  score: number;
  weight: number;
  verdict: FactorVerdict;
  /** What would raise this factor. Present whenever the factor is not a pass. */
  improvement?: string;
  remedy?: Remedy;
};

export type CategoryEvaluation = {
  id: CategoryId;
  label: string;
  score: number;
  summary: string;
  measured: string[];
  factors: EvidenceFactor[];
  whyThisScore: string;
  biggestFactor: string;
  whatWouldImprove: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

const ICON: Record<CategoryId, Remedy["icon"]> = {
  design: "layout",
  performance: "gauge",
  seo: "search",
  accessibility: "accessibility",
  business: "briefcase",
};

function verdictFor(score: number): FactorVerdict {
  if (score >= 85) return "pass";
  return score >= 60 ? "warn" : "fail";
}

type FactorInput = Omit<EvidenceFactor, "verdict" | "category"> & { category?: CategoryId };

function make(category: CategoryId, input: FactorInput): EvidenceFactor {
  return { ...input, category, verdict: verdictFor(input.score) };
}

function scale(value: number, best: number, worst: number): number {
  if (best === worst) return 100;
  const ratio = (value - worst) / (best - worst);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

const kb = (bytes: number) => `${Math.round(bytes / 1024).toLocaleString()} KB`;

/* ------------------------------------------------------------------ design */

function designFactors(e: SiteEvidence): EvidenceFactor[] {
  const factors: EvidenceFactor[] = [];

  factors.push(
    make("design", {
      id: "design-focal-point",
      label: "Single page headline",
      detail:
        e.headings.h1.length === 1
          ? `Exactly one H1 on the page: “${e.headings.h1[0]}”`
          : e.headings.h1.length === 0
            ? "No H1 heading detected during this analysis, so the page has no declared focal point"
            : `${e.headings.h1.length} H1 headings compete as the page's focal point: ${e.headings.h1
                .slice(0, 3)
                .map((h) => `“${h}”`)
                .join(", ")}`,
      score: e.headings.h1.length === 1 ? 100 : e.headings.h1.length === 0 ? 40 : 60,
      weight: 3,
      ...(e.headings.h1.length === 1
        ? {}
        : {
            improvement:
              "Keep one H1 that states what the page is about, and demote the others to H2.",
            remedy: {
              title:
                e.headings.h1.length === 0 ? "Add a single page headline" : "Reduce to one H1 heading",
              description:
                "One H1 gives visitors and search engines a single, unambiguous focal point for the page.",
              impact: "High" as RecommendationImpact,
              difficulty: "Easy" as RecommendationDifficulty,
              estimatedTime: "15 minutes",
              icon: ICON.design,
            },
          }),
    }),
  );

  factors.push(
    make("design", {
      id: "design-heading-structure",
      label: "Heading structure",
      detail: `${e.headings.total} headings in total (${e.headings.h1.length} H1, ${e.headings.h2.length} H2, ${e.headings.h3} H3)${
        e.headings.skips ? " — levels skip, which breaks the outline" : ""
      }`,
      score: e.headings.skips ? 50 : e.headings.total >= 4 ? 95 : e.headings.total >= 2 ? 75 : 55,
      weight: 2,
      ...(e.headings.skips || e.headings.total < 4
        ? {
            improvement: "Nest headings in order (H1 → H2 → H3) so the page has a readable outline.",
          }
        : {}),
    }),
  );

  factors.push(
    make("design", {
      id: "design-mobile-ready",
      label: "Mobile viewport",
      detail: e.document.hasViewport
        ? "A responsive viewport meta tag is declared"
        : "No viewport meta tag — the page will render at desktop width on phones",
      score: e.document.hasViewport ? 100 : 25,
      weight: 3,
      ...(e.document.hasViewport
        ? {}
        : {
            improvement: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
            remedy: {
              title: "Make the page render correctly on phones",
              description:
                "Without a viewport meta tag mobile browsers zoom out to a desktop layout, making text unreadable.",
              impact: "High",
              difficulty: "Easy",
              estimatedTime: "10 minutes",
              icon: ICON.design,
            },
          }),
    }),
  );

  factors.push(
    make("design", {
      id: "design-layout-stability",
      label: "Layout stability",
      detail:
        e.images.total === 0
          ? "No images on the page, so nothing shifts as media loads"
          : `${e.images.withDimensions} of ${e.images.total} images declare width and height`,
      score:
        e.images.total === 0 ? 90 : scale(e.images.withDimensions / e.images.total, 1, 0),
      weight: 2,
      ...(e.images.total > 0 && e.images.withDimensions < e.images.total
        ? {
            improvement: `Set width and height on the ${
              e.images.total - e.images.withDimensions
            } images that omit them so the layout never jumps.`,
            remedy: {
              title: "Reserve space for images",
              description:
                "Declaring width and height stops content jumping around while images load.",
              impact: "Medium",
              difficulty: "Easy",
              estimatedTime: "30 minutes",
              icon: ICON.design,
            },
          }
        : {}),
    }),
  );

  factors.push(
    make("design", {
      id: "design-inline-styles",
      label: "Styling consistency",
      detail: `${e.styles.external} stylesheet${e.styles.external === 1 ? "" : "s"}, ${
        e.styles.inlineBlocks
      } inline <style> block${e.styles.inlineBlocks === 1 ? "" : "s"} and ${
        e.styles.inlineAttributes
      } inline style attribute${e.styles.inlineAttributes === 1 ? "" : "s"}`,
      score: scale(e.styles.inlineAttributes, 0, 120),
      weight: 1,
      ...(e.styles.inlineAttributes > 25
        ? {
            improvement:
              "Move repeated inline styles into shared classes so spacing and type stay consistent.",
          }
        : {}),
    }),
  );

  return factors;
}

/* ------------------------------------------------------------- performance */

function performanceFactors(e: SiteEvidence): EvidenceFactor[] {
  const factors: EvidenceFactor[] = [];

  factors.push(
    make("performance", {
      id: "perf-response-time",
      label: "Document response time",
      detail: `The HTML document took ${e.fetchMs.toLocaleString()} ms to download`,
      score: scale(e.fetchMs, 200, 4000),
      weight: 3,
      ...(e.fetchMs > 900
        ? {
            improvement: "Cache the HTML at the edge or reduce server work so the first byte lands sooner.",
            remedy: {
              title: "Speed up the initial document response",
              description:
                "Nothing renders until the HTML arrives, so this delay is added to every other timing on the page.",
              impact: "High",
              difficulty: "Moderate",
              estimatedTime: "2–4 hours",
              icon: ICON.performance,
            },
          }
        : {}),
    }),
  );

  factors.push(
    make("performance", {
      id: "perf-page-weight",
      label: "HTML document size",
      detail: `The HTML document weighs ${kb(e.htmlBytes)}`,
      score: scale(e.htmlBytes, 40_000, 600_000),
      weight: 2,
      ...(e.htmlBytes > 150_000
        ? {
            improvement: "Trim unused markup and move large inline data out of the document.",
          }
        : {}),
    }),
  );

  factors.push(
    make("performance", {
      id: "perf-render-blocking",
      label: "Render-blocking resources",
      detail: `${e.scripts.renderBlocking} blocking script${
        e.scripts.renderBlocking === 1 ? "" : "s"
      } and ${e.styles.renderBlocking} blocking stylesheet${
        e.styles.renderBlocking === 1 ? "" : "s"
      } load before the page can paint`,
      score: scale(e.scripts.renderBlocking * 2 + e.styles.renderBlocking, 0, 16),
      weight: 3,
      ...(e.scripts.renderBlocking > 0 || e.styles.renderBlocking > 3
        ? {
            improvement: `Add defer or async to the ${e.scripts.renderBlocking} blocking script${
              e.scripts.renderBlocking === 1 ? "" : "s"
            } and inline only the CSS the first screen needs.`,
            remedy: {
              title: "Remove render-blocking resources",
              description: `${e.scripts.renderBlocking} script${
                e.scripts.renderBlocking === 1 ? "" : "s"
              } and ${e.styles.renderBlocking} stylesheet${
                e.styles.renderBlocking === 1 ? "" : "s"
              } currently delay the first paint. Deferring them brings visible content forward.`,
              impact: "High",
              difficulty: "Moderate",
              estimatedTime: "2–3 hours",
              icon: ICON.performance,
            },
          }
        : {}),
    }),
  );

  factors.push(
    make("performance", {
      id: "perf-third-party",
      label: "Third-party scripts",
      detail: e.scripts.thirdParty.length
        ? `${e.scripts.external} external scripts, including ${e.scripts.thirdParty.join(", ")}`
        : `${e.scripts.external} external script${e.scripts.external === 1 ? "" : "s"}, none from third-party domains`,
      score: scale(e.scripts.thirdParty.length * 3 + e.scripts.external, 0, 40),
      weight: 2,
      ...(e.scripts.thirdParty.length > 2
        ? {
            improvement: `Load ${e.scripts.thirdParty.slice(0, 3).join(", ")} after first paint, or drop the ones no longer used.`,
            remedy: {
              title: "Defer third-party tags",
              description: `Scripts from ${e.scripts.thirdParty
                .slice(0, 3)
                .join(", ")} compete with your own content for the connection. Loading them later costs nothing visible.`,
              impact: "Medium",
              difficulty: "Easy",
              estimatedTime: "1 hour",
              icon: ICON.performance,
            },
          }
        : {}),
    }),
  );

  factors.push(
    make("performance", {
      id: "perf-image-delivery",
      label: "Image delivery",
      detail:
        e.images.total === 0
          ? "No <img> elements detected during this analysis on the page"
          : `${e.images.total} images: ${e.images.lazy} lazy-loaded, ${e.images.modernFormats} in a modern format (WebP/AVIF)`,
      score:
        e.images.total === 0
          ? 90
          : Math.round(
              scale(e.images.lazy / e.images.total, 1, 0) * 0.5 +
                scale(Math.min(1, e.images.modernFormats / e.images.total), 1, 0) * 0.5,
            ),
      weight: 2,
      ...(e.images.total > 0 && (e.images.lazy < e.images.total / 2 || e.images.modernFormats === 0)
        ? {
            improvement: `Serve the ${e.images.total} images as WebP or AVIF and lazy-load everything below the fold.`,
            remedy: {
              title: "Compress and lazy-load images",
              description: `${e.images.total} images were found and ${
                e.images.total - e.images.lazy
              } load eagerly. Modern formats plus lazy loading is the fastest available win here.`,
              impact: "High",
              difficulty: "Easy",
              estimatedTime: "1–2 hours",
              icon: ICON.performance,
            },
          }
        : {}),
    }),
  );

  return factors;
}

/* --------------------------------------------------------------------- seo */

function seoFactors(e: SiteEvidence): EvidenceFactor[] {
  const factors: EvidenceFactor[] = [];
  const titleLength = e.metadata.title?.length ?? 0;
  const descriptionLength = e.metadata.description?.length ?? 0;

  factors.push(
    make("seo", {
      id: "seo-title",
      label: "Page title",
      detail: e.metadata.title
        ? `Title is ${titleLength} characters: “${e.metadata.title}”`
        : "No <title> element detected during this analysis",
      score: !e.metadata.title ? 20 : titleLength >= 20 && titleLength <= 60 ? 100 : 65,
      weight: 3,
      ...(!e.metadata.title || titleLength < 20 || titleLength > 60
        ? {
            improvement: "Write a 20–60 character title that names the offer and the brand.",
            remedy: {
              title: e.metadata.title ? "Rewrite the page title" : "Add a page title",
              description: e.metadata.title
                ? `The current title is ${titleLength} characters, so search results are likely to truncate or under-describe it.`
                : "Search engines have no title to show for this page, so they will invent one from the content.",
              impact: "High",
              difficulty: "Easy",
              estimatedTime: "15 minutes",
              icon: ICON.seo,
            },
          }
        : {}),
    }),
  );

  factors.push(
    make("seo", {
      id: "seo-description",
      label: "Meta description",
      detail: e.metadata.description
        ? `Description is ${descriptionLength} characters: “${e.metadata.description}”`
        : "No meta description detected during this analysis",
      score: !e.metadata.description ? 25 : descriptionLength >= 70 && descriptionLength <= 160 ? 100 : 70,
      weight: 2,
      ...(!e.metadata.description || descriptionLength < 70 || descriptionLength > 160
        ? {
            improvement: "Write a 70–160 character description that states the benefit of the page.",
            remedy: {
              title: e.metadata.description ? "Tighten the meta description" : "Add a meta description",
              description: e.metadata.description
                ? `At ${descriptionLength} characters the description ${
                    descriptionLength > 160 ? "will be cut off" : "leaves persuasion on the table"
                  } in search results.`
                : "Without a description, search engines quote an arbitrary sentence from the page.",
              impact: "Medium",
              difficulty: "Easy",
              estimatedTime: "20 minutes",
              icon: ICON.seo,
            },
          }
        : {}),
    }),
  );

  factors.push(
    make("seo", {
      id: "seo-social-preview",
      label: "Social preview tags",
      detail: `Open Graph title ${e.metadata.ogTitle ? "present" : "missing"}, description ${
        e.metadata.ogDescription ? "present" : "missing"
      }, image ${e.metadata.ogImage ? "present" : "missing"}; Twitter card ${
        e.metadata.twitterCard ? "present" : "missing"
      }`,
      score:
        [e.metadata.ogTitle, e.metadata.ogDescription, e.metadata.ogImage, e.metadata.twitterCard].filter(
          Boolean,
        ).length * 25,
      weight: 1,
      ...(!e.metadata.ogImage || !e.metadata.ogTitle
        ? {
            improvement: "Add og:title, og:description and og:image so shared links render a rich card.",
            remedy: {
              title: "Add social preview tags",
              description:
                "Links shared to messaging apps and social networks currently render as a bare URL instead of a titled card with an image.",
              impact: "Medium",
              difficulty: "Easy",
              estimatedTime: "30 minutes",
              icon: ICON.seo,
            },
          }
        : {}),
    }),
  );

  factors.push(
    make("seo", {
      id: "seo-structured-data",
      label: "Structured data",
      detail: e.structuredData.present
        ? `JSON-LD found describing: ${e.structuredData.types.join(", ") || "unnamed types"}`
        : "No JSON-LD structured data detected during this analysis",
      score: e.structuredData.present ? 100 : 40,
      weight: 2,
      ...(e.structuredData.present
        ? {}
        : {
            improvement: "Publish Organization and WebSite JSON-LD so search engines can describe the business.",
            remedy: {
              title: "Add structured data for the business",
              description:
                "No JSON-LD was detected during this analysis on the page, so search engines cannot show rich details such as name, logo, contact or ratings.",
              impact: "Medium",
              difficulty: "Moderate",
              estimatedTime: "2 hours",
              icon: ICON.seo,
            },
          }),
    }),
  );

  factors.push(
    make("seo", {
      id: "seo-crawlability",
      label: "Crawl signals",
      detail: [
        e.metadata.canonical ? "canonical link present" : "no canonical link",
        e.network.robotsTxt === null
          ? "robots.txt could not be checked"
          : e.network.robotsTxt
            ? "robots.txt reachable"
            : "no robots.txt",
        e.network.sitemap ? "sitemap declared in robots.txt" : "no sitemap declared",
        e.metadata.robots ? `robots meta: ${e.metadata.robots}` : "no robots meta restrictions",
      ].join("; "),
      score:
        40 +
        (e.metadata.canonical ? 20 : 0) +
        (e.network.robotsTxt ? 20 : 0) +
        (e.network.sitemap ? 20 : 0),
      weight: 2,
      ...(!e.metadata.canonical || !e.network.sitemap
        ? {
            improvement: `${!e.metadata.canonical ? "Add a canonical link. " : ""}${
              !e.network.sitemap ? "Publish a sitemap and reference it from robots.txt." : ""
            }`.trim(),
            remedy: {
              title: "Complete the crawl signals",
              description: `${
                e.metadata.canonical ? "" : "There is no canonical link, which risks duplicate-content splits. "
              }${e.network.sitemap ? "" : "No sitemap is declared in robots.txt, so discovery relies on links alone."}`,
              impact: "Medium",
              difficulty: "Easy",
              estimatedTime: "1 hour",
              icon: ICON.seo,
            },
          }
        : {}),
    }),
  );

  factors.push(
    make("seo", {
      id: "seo-content-depth",
      label: "Indexable content",
      detail: `${e.content.wordCount.toLocaleString()} words of visible copy and ${e.links.internal} internal links`,
      score: Math.round(
        scale(e.content.wordCount, 500, 60) * 0.6 + scale(e.links.internal, 25, 0) * 0.4,
      ),
      weight: 2,
      ...(e.content.wordCount < 300 || e.links.internal < 6
        ? {
            improvement:
              "Add descriptive copy and link to the pages you want found — search engines need text to rank.",
          }
        : {}),
    }),
  );

  return factors;
}

/* ----------------------------------------------------------- accessibility */

function accessibilityFactors(e: SiteEvidence): EvidenceFactor[] {
  const factors: EvidenceFactor[] = [];
  const described = e.images.total - e.images.missingAlt;

  factors.push(
    make("accessibility", {
      id: "a11y-alt-text",
      label: "Image alternative text",
      detail:
        e.images.total === 0
          ? "No <img> elements detected during this analysis, so no alt text is required"
          : `${e.images.total} images detected, ${e.images.missingAlt} missing an alt attribute`,
      score: e.images.total === 0 ? 90 : scale(described / e.images.total, 1, 0),
      weight: 3,
      ...(e.images.missingAlt > 0
        ? {
            improvement: `Describe the ${e.images.missingAlt} images without alt text, or mark them decorative with alt="".`,
            remedy: {
              title: "Add alt text to images",
              description: `${e.images.total} images were detected and ${e.images.missingAlt} have no alt attribute. Screen readers announce those as unlabelled, and search engines cannot index them.`,
              impact: "High",
              difficulty: "Easy",
              estimatedTime: `${Math.max(15, e.images.missingAlt * 2)} minutes`,
              icon: ICON.accessibility,
            },
          }
        : {}),
    }),
  );

  factors.push(
    make("accessibility", {
      id: "a11y-language",
      label: "Declared page language",
      detail: e.document.lang
        ? `The document declares lang="${e.document.lang}"`
        : "The <html> element has no lang attribute",
      score: e.document.lang ? 100 : 45,
      weight: 2,
      ...(e.document.lang
        ? {}
        : {
            improvement: 'Add a lang attribute to <html> so screen readers use the right pronunciation.',
            remedy: {
              title: "Declare the page language",
              description:
                "Without a lang attribute, screen readers guess the language and often read the page with the wrong voice.",
              impact: "Medium",
              difficulty: "Easy",
              estimatedTime: "5 minutes",
              icon: ICON.accessibility,
            },
          }),
    }),
  );

  factors.push(
    make("accessibility", {
      id: "a11y-form-labels",
      label: "Form labelling",
      detail:
        e.forms.inputs === 0
          ? "No form fields detected during this analysis on the page"
          : `${e.forms.inputs} form field${e.forms.inputs === 1 ? "" : "s"} with ${e.forms.labels} <label> element${
              e.forms.labels === 1 ? "" : "s"
            } and ${e.forms.ariaLabels} aria-label${e.forms.ariaLabels === 1 ? "" : "s"}`,
      score:
        e.forms.inputs === 0
          ? 90
          : scale(Math.min(1, (e.forms.labels + e.forms.ariaLabels) / e.forms.inputs), 1, 0),
      weight: 2,
      ...(e.forms.inputs > e.forms.labels + e.forms.ariaLabels
        ? {
            improvement: `Pair the ${
              e.forms.inputs - e.forms.labels - e.forms.ariaLabels
            } unlabelled fields with a visible <label>.`,
            remedy: {
              title: "Label every form field",
              description: `${e.forms.inputs} fields were found but only ${
                e.forms.labels + e.forms.ariaLabels
              } carry a label. Unlabelled fields are announced as "edit text" with no context.`,
              impact: "High",
              difficulty: "Easy",
              estimatedTime: "45 minutes",
              icon: ICON.accessibility,
            },
          }
        : {}),
    }),
  );

  factors.push(
    make("accessibility", {
      id: "a11y-structure",
      label: "Semantic structure",
      detail: `${e.headings.total} headings${e.headings.skips ? " with skipped levels" : " in a consistent order"}, ${
        e.links.nav.length
      } navigation links inside a <nav> landmark`,
      score:
        (e.headings.skips ? 45 : 90) * 0.6 + (e.links.nav.length > 0 ? 100 : 55) * 0.4,
      weight: 2,
      ...(e.headings.skips || e.links.nav.length === 0
        ? {
            improvement:
              "Wrap the main menu in a <nav> landmark and keep heading levels in order so assistive tech can navigate by structure.",
          }
        : {}),
    }),
  );

  factors.push(
    make("accessibility", {
      id: "a11y-viewport-zoom",
      label: "Mobile readability",
      detail: e.document.hasViewport
        ? "Responsive viewport declared, so text scales on small screens"
        : "No responsive viewport, so text will be tiny on phones",
      score: e.document.hasViewport ? 100 : 35,
      weight: 1,
      ...(e.document.hasViewport ? {} : { improvement: "Add a responsive viewport meta tag." }),
    }),
  );

  return factors;
}

/* ---------------------------------------------------------------- business */

function businessFactors(e: SiteEvidence): EvidenceFactor[] {
  const factors: EvidenceFactor[] = [];

  factors.push(
    make("business", {
      id: "biz-cta",
      label: "Primary call to action",
      detail: e.content.ctas.length
        ? `${e.content.ctas.length} call-to-action label${
            e.content.ctas.length === 1 ? "" : "s"
          } found: ${e.content.ctas.join(", ")}`
        : e.forms.total > 0
          ? `No call-to-action button detected during this analysis, though ${e.forms.total} form${e.forms.total === 1 ? "" : "s"} appear on the page`
          : "No call-to-action button or form detected during this analysis on the page",
      score: e.content.ctas.length === 1 ? 100 : e.content.ctas.length > 1 ? 80 : e.forms.total ? 60 : 30,
      weight: 3,
      ...(e.content.ctas.length === 1
        ? {}
        : {
            improvement: e.content.ctas.length
              ? "Give one action visual priority so visitors know which step is intended."
              : "Add one clear action button that names the next step.",
            remedy: {
              title: e.content.ctas.length ? "Give one action clear priority" : "Add a primary call to action",
              description: e.content.ctas.length
                ? `The page offers ${e.content.ctas.length} competing actions (${e.content.ctas.join(
                    ", ",
                  )}). Promoting one and demoting the rest makes the intended path obvious.`
                : "No recognised action button was detected during this analysis, so an interested visitor has no obvious next step.",
              impact: "High",
              difficulty: "Easy",
              estimatedTime: "1 hour",
              icon: ICON.business,
            },
          }),
    }),
  );

  factors.push(
    make("business", {
      id: "biz-proof",
      label: "Customer proof",
      detail: e.content.hasTestimonials
        ? "Testimonial, review or case-study language appears in the page copy"
        : "No testimonial, review or case-study language detected during this analysis in the page copy",
      score: e.content.hasTestimonials ? 95 : 40,
      weight: 2,
      ...(e.content.hasTestimonials
        ? {}
        : {
            improvement: "Add two or three named customer quotes with specific outcomes.",
            remedy: {
              title: "Add customer proof to the page",
              description:
                "No testimonials, reviews or case studies were detected during this analysis in the homepage copy, so every claim currently rests on your own word.",
              impact: "High",
              difficulty: "Moderate",
              estimatedTime: "3–5 hours",
              icon: ICON.business,
            },
          }),
    }),
  );

  factors.push(
    make("business", {
      id: "biz-pricing",
      label: "Pricing transparency",
      detail:
        e.links.hasPricing || e.content.hasPricingSection
          ? `Pricing is addressed on the page${e.links.hasPricing ? " and linked from the navigation" : ""}`
          : "No pricing link or pricing language detected during this analysis",
      score: e.links.hasPricing ? 100 : e.content.hasPricingSection ? 75 : 45,
      weight: 2,
      ...(e.links.hasPricing
        ? {}
        : {
            improvement: "Publish pricing, a starting price, or an explanation of how pricing works.",
            remedy: {
              title: "Make pricing findable",
              description:
                "No pricing link was detected during this analysis in the navigation, so visitors comparing options have to ask before they can compare.",
              impact: "Medium",
              difficulty: "Moderate",
              estimatedTime: "2–3 hours",
              icon: ICON.business,
            },
          }),
    }),
  );

  factors.push(
    make("business", {
      id: "biz-contact",
      label: "Contact routes",
      detail: [
        e.links.mailto ? `${e.links.mailto} email link${e.links.mailto === 1 ? "" : "s"}` : null,
        e.links.tel ? `${e.links.tel} phone link${e.links.tel === 1 ? "" : "s"}` : null,
        e.links.hasContact ? "a contact link in the navigation or footer" : null,
        e.forms.total ? `${e.forms.total} form${e.forms.total === 1 ? "" : "s"}` : null,
      ]
        .filter(Boolean)
        .join(", ") || "No email link, phone link, contact link or form detected during this analysis",
      score:
        (e.links.mailto || e.links.tel ? 45 : 0) +
        (e.links.hasContact ? 35 : 0) +
        (e.forms.total ? 20 : 0),
      weight: 2,
      ...(e.links.hasContact && (e.links.mailto || e.links.tel || e.forms.total)
        ? {}
        : {
            improvement: "Publish a direct email or phone link so getting in touch takes one tap.",
            remedy: {
              title: "Make contact one tap away",
              description:
                "The page does not expose a direct email or phone link, which quietly filters out the visitors least willing to hunt.",
              impact: "Medium",
              difficulty: "Easy",
              estimatedTime: "30 minutes",
              icon: ICON.business,
            },
          }),
    }),
  );

  factors.push(
    make("business", {
      id: "biz-navigation",
      label: "Navigation clarity",
      detail: e.links.nav.length
        ? `${e.links.nav.length} primary navigation items: ${e.links.nav.join(", ")}`
        : `No <nav> landmark detected during this analysis; ${e.links.total} links appear on the page`,
      score:
        e.links.nav.length === 0
          ? 45
          : e.links.nav.length <= 7
            ? 100
            : e.links.nav.length <= 10
              ? 80
              : 60,
      weight: 2,
      ...(e.links.nav.length === 0 || e.links.nav.length > 7
        ? {
            improvement:
              e.links.nav.length > 7
                ? `Group the ${e.links.nav.length} menu items into no more than seven top-level entries.`
                : "Wrap the main menu in a <nav> landmark with clear labels.",
          }
        : {}),
    }),
  );

  factors.push(
    make("business", {
      id: "biz-credibility",
      label: "Credibility signals",
      detail: [
        e.secure ? "served over HTTPS" : "not served over HTTPS",
        e.links.hasAbout ? "an about page is linked" : "no about page linked",
        e.links.social.length ? `social profiles: ${e.links.social.join(", ")}` : "no social profiles linked",
        e.structuredData.present ? "structured data describes the business" : "no structured data",
      ].join("; "),
      score:
        (e.secure ? 40 : 0) +
        (e.links.hasAbout ? 20 : 0) +
        (e.links.social.length ? 20 : 0) +
        (e.structuredData.present ? 20 : 0),
      weight: 1,
      ...(!e.links.hasAbout || !e.secure
        ? {
            improvement: `${e.secure ? "" : "Serve the site over HTTPS. "}${
              e.links.hasAbout ? "" : "Link an about page that explains who is behind the work."
            }`.trim(),
          }
        : {}),
    }),
  );

  factors.push(
    make("business", {
      id: "biz-questions",
      label: "Answering common questions",
      detail: e.links.hasFaq
        ? "An FAQ, help or support destination is linked"
        : "No FAQ, help or support destination is linked",
      score: e.links.hasFaq ? 95 : 55,
      weight: 1,
      ...(e.links.hasFaq
        ? {}
        : {
            improvement: "Publish short answers to the questions buyers ask before committing.",
          }),
    }),
  );

  return factors;
}

/* ------------------------------------------------------------------ public */

const CATEGORY_LABEL: Record<CategoryId, string> = {
  design: "Design",
  performance: "Performance",
  seo: "SEO",
  accessibility: "Accessibility",
  business: "Business",
};

const CATEGORY_INTENT: Record<CategoryId, string> = {
  design: "how clearly the page is structured and how well it holds together on any screen",
  performance: "how quickly the page becomes usable, measured from the document response and its assets",
  seo: "what search engines can read, describe and index",
  accessibility: "whether the markup lets everyone read and operate the page",
  business: "whether the page works as a commercial asset, not only as a webpage",
};

function evaluateCategory(id: CategoryId, factors: EvidenceFactor[]): CategoryEvaluation {
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0) || 1;
  const score = Math.round(
    factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) / totalWeight,
  );

  const sorted = [...factors].sort((a, b) => a.score * a.weight - b.score * b.weight);
  const worst = sorted[0]!;
  const best = [...factors].sort((a, b) => b.score - a.score)[0]!;

  const strengths = factors.filter((f) => f.verdict === "pass").map((f) => f.detail);
  const weaknesses = factors.filter((f) => f.verdict !== "pass").map((f) => f.detail);
  const suggestions = factors
    .filter((f) => f.improvement)
    .map((f) => f.improvement as string);

  return {
    id,
    label: CATEGORY_LABEL[id],
    score,
    summary: `${score}/100 from ${factors.length} measured signals — ${CATEGORY_INTENT[id]}.`,
    measured: factors.map((factor) => factor.label),
    factors,
    whyThisScore: `${strengths.length} of ${factors.length} measured signals passed. ${
      weaknesses.length
        ? `The score is held back by ${worst.label.toLowerCase()}: ${worst.detail}.`
        : `Every signal we could measure passed, led by ${best.label.toLowerCase()}: ${best.detail}.`
    }`,
    biggestFactor: `${worst.label} — ${worst.detail}`,
    whatWouldImprove:
      worst.improvement ??
      suggestions[0] ??
      "Nothing measurable is holding this category back right now.",
    strengths,
    weaknesses,
    suggestions,
  };
}

export type EvidenceEvaluation = {
  categories: CategoryEvaluation[];
  factors: EvidenceFactor[];
  overallScore: number;
};

export function evaluateEvidence(evidence: SiteEvidence): EvidenceEvaluation {
  const grouped: Record<CategoryId, EvidenceFactor[]> = {
    design: designFactors(evidence),
    performance: performanceFactors(evidence),
    seo: seoFactors(evidence),
    accessibility: accessibilityFactors(evidence),
    business: businessFactors(evidence),
  };

  const categories = (Object.keys(grouped) as CategoryId[]).map((id) =>
    evaluateCategory(id, grouped[id]),
  );
  const overallScore = Math.round(
    categories.reduce((sum, category) => sum + category.score, 0) / categories.length,
  );

  return {
    categories,
    factors: categories.flatMap((category) => category.factors),
    overallScore,
  };
}
