import type { EvidenceSourceId, SiteEvidence } from "@/lib/analysis/evidence";

/**
 * HTML evidence extraction.
 *
 * Pure string parsing so it runs identically on the server runtime and in
 * tests. Everything returned here is measured from the document — nothing is
 * estimated or assumed.
 */

const TAG = (name: string) => new RegExp(`<${name}\\b[^>]*>`, "gi");

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  if (!match) return null;
  return (match[2] ?? match[3] ?? match[4] ?? "").trim();
}

function has(tag: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`, "i").test(tag);
}

function decode(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, matcher: RegExp): string | null {
  for (const tag of html.match(TAG("meta")) ?? []) {
    const key = attr(tag, "name") ?? attr(tag, "property") ?? "";
    if (matcher.test(key)) {
      const content = attr(tag, "content");
      if (content) return decode(content);
    }
  }
  return null;
}

function headings(html: string, level: number): string[] {
  const found: string[] = [];
  const pattern = new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)</h${level}>`, "gi");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const text = decode(stripTags(match[1] ?? ""));
    if (text) found.push(text);
  }
  return found;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function visibleText(html: string): string {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  return decode(stripTags(withoutNoise));
}

const CTA_WORDS =
  /^(get started|start free|sign up|try (it )?free|book( a)? (demo|call)|contact( us)?|buy( now)?|subscribe|request( a)? (quote|demo)|join|download|start now|learn more|see pricing|get a quote|shop now|order now)$/i;

const KEYWORD_STOPWORDS = new Set(
  "the and for with your you our that this from are was were will can has have not but they their what when where which who how all any about more into out over under just like get make use using page site website home".split(
    " ",
  ),
);

function keywordsFrom(text: string): string[] {
  const counts = new Map<string, number>();
  for (const word of text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? []) {
    if (KEYWORD_STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

const SOCIAL_HOSTS = [
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "youtube.com",
  "tiktok.com",
  "github.com",
];

export type ExtractInput = {
  html: string;
  finalUrl: string;
  status: number;
  redirected: boolean;
  fetchMs: number;
  htmlBytes: number;
  robotsTxt: boolean | null;
  sitemap: boolean | null;
};

export function extractEvidence(input: ExtractInput): SiteEvidence {
  const { html } = input;
  const url = new URL(input.finalUrl);
  const head = html.split(/<\/head>/i)[0] ?? html;

  // Document
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? "";
  const lang = attr(htmlTag, "lang");

  // Metadata
  const title = decode(stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")) || null;
  const description = metaContent(html, /^description$/i);

  // Headings
  const h1 = headings(html, 1);
  const h2 = headings(html, 2);
  const h3 = headings(html, 3).length;
  const h4plus = (html.match(/<h[4-6]\b/gi) ?? []).length;
  const skips = h1.length === 0 ? h2.length > 0 || h3 > 0 : h2.length === 0 && h3 > 0;

  // Images
  const imgTags = html.match(TAG("img")) ?? [];
  const missingAlt = imgTags.filter((tag) => attr(tag, "alt") === null).length;
  const lazy = imgTags.filter((tag) => (attr(tag, "loading") ?? "").toLowerCase() === "lazy").length;
  const withDimensions = imgTags.filter(
    (tag) => attr(tag, "width") !== null && attr(tag, "height") !== null,
  ).length;
  const modernFormats =
    imgTags.filter((tag) => /\.(webp|avif)(\?|"|'|$)/i.test(attr(tag, "src") ?? "")).length +
    (html.match(/type=["']image\/(webp|avif)["']/gi) ?? []).length;

  // Links
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  const anchors: Array<{ href: string; text: string }> = [];
  let anchorMatch: RegExpExecArray | null;
  while ((anchorMatch = anchorPattern.exec(html))) {
    const href = attr(`<a ${anchorMatch[1] ?? ""}>`, "href") ?? "";
    anchors.push({ href, text: decode(stripTags(anchorMatch[2] ?? "")) });
  }

  const mailto = anchors.filter((a) => a.href.startsWith("mailto:")).length;
  const tel = anchors.filter((a) => a.href.startsWith("tel:")).length;
  const pageLinks = anchors.filter((a) => /^(https?:|\/|\.|#|[a-z0-9])/i.test(a.href) && !a.href.startsWith("mailto:") && !a.href.startsWith("tel:"));

  const isExternal = (href: string) => {
    if (!/^https?:\/\//i.test(href)) return false;
    try {
      return new URL(href).hostname.replace(/^www\./, "") !== url.hostname.replace(/^www\./, "");
    } catch {
      return false;
    }
  };

  const external = pageLinks.filter((a) => isExternal(a.href));
  const internal = pageLinks.filter((a) => !isExternal(a.href));

  const navBlock = html.match(/<nav\b[\s\S]*?<\/nav>/i)?.[0] ?? "";
  const navLabels = [...(navBlock.matchAll(anchorPattern) ?? [])]
    .map((m) => decode(stripTags(m[2] ?? "")))
    .filter((label) => label.length > 0 && label.length < 40);

  const linkHaystack = anchors.map((a) => `${a.href} ${a.text}`).join(" ").toLowerCase();
  const social = SOCIAL_HOSTS.filter((host) => linkHaystack.includes(host));

  // Scripts and styles
  const scriptTags = html.match(/<script\b[^>]*>/gi) ?? [];
  const externalScripts = scriptTags.filter((tag) => attr(tag, "src") !== null);
  const headScripts = (head.match(/<script\b[^>]*>/gi) ?? []).filter(
    (tag) => attr(tag, "src") !== null && !has(tag, "defer") && !has(tag, "async"),
  );
  const thirdParty = [
    ...new Set(
      externalScripts
        .map((tag) => attr(tag, "src") ?? "")
        .filter((src) => isExternal(src))
        .map((src) => {
          try {
            return new URL(src).hostname.replace(/^www\./, "");
          } catch {
            return "";
          }
        })
        .filter(Boolean),
    ),
  ].slice(0, 6);

  const linkTags = html.match(TAG("link")) ?? [];
  const stylesheets = linkTags.filter((tag) =>
    (attr(tag, "rel") ?? "").toLowerCase().includes("stylesheet"),
  );
  const blockingStyles = stylesheets.filter((tag) => {
    const media = (attr(tag, "media") ?? "all").toLowerCase();
    return media === "all" || media === "screen";
  }).length;

  // Structured data
  const ldBlocks = [...html.matchAll(/<script\b[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  const types = [
    ...new Set(
      ldBlocks
        .flatMap((block) => [...(block[1] ?? "").matchAll(/"@type"\s*:\s*"([^"]+)"/g)])
        .map((m) => m[1] ?? "")
        .filter(Boolean),
    ),
  ].slice(0, 6);

  // Forms
  const formCount = (html.match(/<form\b/gi) ?? []).length;
  const inputTags = [
    ...(html.match(TAG("input")) ?? []),
    ...(html.match(/<textarea\b[^>]*>/gi) ?? []),
    ...(html.match(/<select\b[^>]*>/gi) ?? []),
  ].filter((tag) => !/type\s*=\s*["']?(hidden|submit|button)/i.test(tag));
  const labelCount = (html.match(/<label\b/gi) ?? []).length;
  const ariaLabels = inputTags.filter(
    (tag) => attr(tag, "aria-label") !== null || attr(tag, "aria-labelledby") !== null,
  ).length;

  // Content
  const text = visibleText(html);
  const words = text ? text.split(/\s+/).length : 0;
  const buttonLabels = [
    ...[...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)].map((m) =>
      decode(stripTags(m[1] ?? "")),
    ),
    ...anchors.map((a) => a.text),
  ].filter((label) => label && label.length <= 32);
  const ctas = [...new Set(buttonLabels.filter((label) => CTA_WORDS.test(label.trim())))].slice(0, 6);

  const lower = text.toLowerCase();
  const intro = (() => {
    const paragraph = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => decode(stripTags(m[1] ?? "")))
      .find((value) => value.split(/\s+/).length >= 8);
    return paragraph ?? null;
  })();

  const sources: EvidenceSourceId[] = ["html", "performance"];
  if (title || description) sources.push("metadata");
  if (h1.length + h2.length + h3 + h4plus > 0) sources.push("headings");
  if (imgTags.length > 0) sources.push("images");
  if (pageLinks.length > 0) sources.push("links");
  if (types.length > 0) sources.push("structured-data");
  if (labelCount + ariaLabels + imgTags.length > 0) sources.push("accessibility");

  return {
    finalUrl: input.finalUrl,
    host: url.hostname,
    status: input.status,
    redirected: input.redirected,
    secure: url.protocol === "https:",
    fetchMs: input.fetchMs,
    htmlBytes: input.htmlBytes,

    document: {
      lang: lang || null,
      hasViewport: /name\s*=\s*["']?viewport/i.test(head),
      hasCharset: /charset/i.test(head),
    },

    metadata: {
      title,
      description,
      canonical: linkTags.some((tag) => (attr(tag, "rel") ?? "").toLowerCase() === "canonical"),
      robots: metaContent(html, /^robots$/i),
      ogTitle: metaContent(html, /^og:title$/i) !== null,
      ogDescription: metaContent(html, /^og:description$/i) !== null,
      ogImage: metaContent(html, /^og:image$/i) !== null,
      twitterCard: metaContent(html, /^twitter:card$/i) !== null,
      favicon: linkTags.some((tag) => /icon/i.test(attr(tag, "rel") ?? "")),
    },

    headings: { h1, h2: h2.slice(0, 12), h3, total: h1.length + h2.length + h3 + h4plus, skips },

    images: { total: imgTags.length, missingAlt, lazy, withDimensions, modernFormats },

    links: {
      total: pageLinks.length,
      internal: internal.length,
      external: external.length,
      nav: [...new Set(navLabels)].slice(0, 12),
      mailto,
      tel,
      hasPricing: /\b(pricing|plans|prices)\b/i.test(linkHaystack),
      hasContact: /\bcontact\b/i.test(linkHaystack) || mailto > 0 || tel > 0,
      hasAbout: /\babout\b/i.test(linkHaystack),
      hasFaq: /\b(faq|frequently asked|help centre|help center|support)\b/i.test(linkHaystack),
      hasBlog: /\b(blog|news|insights|articles)\b/i.test(linkHaystack),
      social,
    },

    scripts: {
      total: scriptTags.length,
      external: externalScripts.length,
      inline: scriptTags.length - externalScripts.length,
      renderBlocking: headScripts.length,
      thirdParty,
    },

    styles: {
      external: stylesheets.length,
      inlineBlocks: (html.match(/<style\b/gi) ?? []).length,
      inlineAttributes: (html.match(/\sstyle\s*=\s*["']/gi) ?? []).length,
      renderBlocking: blockingStyles,
    },

    structuredData: { present: ldBlocks.length > 0, types },

    forms: { total: formCount, inputs: inputTags.length, labels: labelCount, ariaLabels },

    content: {
      wordCount: words,
      headline: h1[0] ?? title,
      intro,
      ctas,
      keywords: keywordsFrom(text),
      hasTestimonials: /\b(testimonial|what our (clients|customers) say|reviews?|trusted by|case stud)/i.test(
        lower,
      ),
      hasPricingSection: /\b(pricing|per month|\/mo\b|free plan|starting at)\b/i.test(lower),
      hasContactDetails:
        mailto > 0 || tel > 0 || /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i.test(text),
    },

    network: { robotsTxt: input.robotsTxt, sitemap: input.sitemap },

    sources: [...new Set(sources)],
  };
}
