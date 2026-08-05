/**
 * Evidence contract.
 *
 * Everything the report says must trace back to one of these fields. The
 * collector (server) fills them from the real page; the report builders read
 * them. No presentation code invents facts.
 */

export type EvidenceSourceId =
  | "html"
  | "metadata"
  | "headings"
  | "images"
  | "links"
  | "structured-data"
  | "performance"
  | "accessibility";

export const EVIDENCE_SOURCE_LABEL: Record<EvidenceSourceId, string> = {
  html: "HTML",
  metadata: "Metadata",
  headings: "Heading structure",
  images: "Images",
  links: "Internal links",
  "structured-data": "Structured data",
  performance: "Load measurements",
  accessibility: "Accessibility markup",
};

export type SiteEvidence = {
  finalUrl: string;
  host: string;
  status: number;
  redirected: boolean;
  secure: boolean;
  /** Time to download the HTML document, measured server-side. */
  fetchMs: number;
  htmlBytes: number;

  document: {
    lang: string | null;
    hasViewport: boolean;
    hasCharset: boolean;
  };

  metadata: {
    title: string | null;
    description: string | null;
    canonical: boolean;
    robots: string | null;
    ogTitle: boolean;
    ogDescription: boolean;
    ogImage: boolean;
    twitterCard: boolean;
    favicon: boolean;
  };

  headings: {
    h1: string[];
    h2: string[];
    h3: number;
    total: number;
    /** True when heading levels skip (for example h1 straight to h3). */
    skips: boolean;
  };

  images: {
    total: number;
    missingAlt: number;
    lazy: number;
    withDimensions: number;
    modernFormats: number;
  };

  links: {
    total: number;
    internal: number;
    external: number;
    nav: string[];
    mailto: number;
    tel: number;
    hasPricing: boolean;
    hasContact: boolean;
    hasAbout: boolean;
    hasFaq: boolean;
    hasBlog: boolean;
    social: string[];
  };

  scripts: {
    total: number;
    external: number;
    inline: number;
    /** External scripts in <head> without defer/async. */
    renderBlocking: number;
    thirdParty: string[];
  };

  styles: {
    external: number;
    inlineBlocks: number;
    inlineAttributes: number;
    /** Stylesheets in <head> without a media/print hint. */
    renderBlocking: number;
  };

  structuredData: {
    present: boolean;
    types: string[];
  };

  forms: {
    total: number;
    inputs: number;
    labels: number;
    ariaLabels: number;
  };

  content: {
    wordCount: number;
    headline: string | null;
    intro: string | null;
    ctas: string[];
    keywords: string[];
    hasTestimonials: boolean;
    hasPricingSection: boolean;
    hasContactDetails: boolean;
  };

  network: {
    robotsTxt: boolean | null;
    sitemap: boolean | null;
  };

  /** Which evidence sources were actually available for this run. */
  sources: EvidenceSourceId[];
};

export type WebsiteUnderstanding = {
  /** Two to three sentences describing the site in plain language. */
  summary: string;
  industry: string;
  /** Business model read from the page, or an explicit "not stated". */
  businessType: string;
  purpose: string;
  audience: string;
  primaryGoal: string;
  /** The exact label of the most prominent call to action, if one exists. */
  primaryCta: string | null;
  /** The next step the page appears to want a visitor to take. */
  mainUserAction: string;
  keyFeatures: string[];
  positioning: string;
  /** The exact page facts this understanding was drawn from. */
  evidence: string[];
  /** 0–100, based on how much of the page we could read. */
  confidence: number;
};
