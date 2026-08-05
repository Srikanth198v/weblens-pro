import type { CategoryId } from "@/lib/dashboard/types";

/**
 * Scoring weights.
 *
 * The overall score is a published, weighted average — never a black box.
 * These weights are the single source of truth for the score breakdown
 * section, the estimated-gain maths and the exported report.
 */

export const CATEGORY_WEIGHT: Record<CategoryId, number> = {
  performance: 25,
  seo: 20,
  accessibility: 20,
  design: 20,
  business: 15,
};

/** Plain-language reason each area carries the weight it does. */
export const CATEGORY_WEIGHT_REASON: Record<CategoryId, string> = {
  performance:
    "Loading behaviour affects every visitor before they read a word, so it carries the largest share.",
  seo: "Search visibility decides how many people ever reach the page, so it is weighted heavily.",
  accessibility:
    "Barriers on the page exclude real visitors and carry legal risk, so this is weighted equally with search.",
  design:
    "Structure and clarity decide whether visitors understand the offer, which shapes everything after the first scroll.",
  business:
    "Conversion signals matter, but they build on the four areas above, so they carry the smallest share.",
};

/** Why a fix in this area matters, in a consultant's words. */
export const CATEGORY_WHY_IT_MATTERS: Record<CategoryId, string> = {
  performance:
    "Every extra second before the page becomes usable loses visitors who never see your offer.",
  seo: "Search engines can only rank what they can read and understand on the page.",
  accessibility:
    "Anyone using a keyboard, a screen reader or a smaller screen should be able to finish the same tasks.",
  design:
    "A clear structure lets visitors work out what the page is for within a few seconds of arriving.",
  business:
    "Visitors need an obvious next step, and a reason to trust you before they take it.",
};

/** The commercial consequence of leaving the issue in place. */
export const CATEGORY_BUSINESS_IMPACT: Record<CategoryId, string> = {
  performance: "Fewer people leave before the page becomes usable, so more sessions turn into visits that count.",
  seo: "More of the right people find the site through search, without paying for the click.",
  accessibility: "More visitors can complete key tasks, and the site is better protected against complaints.",
  design: "Visitors understand the offer faster and stay longer on the page.",
  business: "More visits turn into enquiries, bookings and sales.",
};

/** What a visitor or owner should notice once the fix lands. */
export const CATEGORY_EXPECTED_RESULTS: Record<CategoryId, string[]> = {
  performance: ["Faster time to a usable page", "Better Core Web Vitals", "Lower drop-off on slow connections"],
  seo: ["Clearer signals for search engines", "Better result snippets", "More qualified organic visits"],
  accessibility: ["Usable with a keyboard and screen reader", "Fewer blocked visitors", "Reduced compliance risk"],
  design: ["A clearer page structure", "Faster comprehension of the offer", "Longer time on page"],
  business: ["A more obvious next step", "Stronger trust signals", "Higher enquiry rate"],
};

export const OVERALL_SCORE_METHOD =
  "The overall score is a weighted average of five measured areas. Each area is scored only from signals we could read on your page during this analysis — nothing is estimated or assumed.";
