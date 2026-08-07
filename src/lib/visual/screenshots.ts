import type { VisualScreenshots } from "@/lib/visual/types";

/**
 * Screenshot capture URLs.
 *
 * We use a public rendering service so no key or setup is required. The images
 * are requested lazily by the browser; nothing is stored by WebLens.
 */

const ENDPOINT = "https://image.thum.io/get";

export const DESKTOP_WIDTH = 1440;
export const MOBILE_WIDTH = 390;

export function screenshotUrls(url: string): VisualScreenshots {
  return {
    desktop: `${ENDPOINT}/width/${DESKTOP_WIDTH}/crop/900/${url}`,
    mobile: `${ENDPOINT}/viewportWidth/${MOBILE_WIDTH}/width/${MOBILE_WIDTH}/crop/844/${url}`,
    // No crop means the renderer captures the page in full.
    fullPage: `${ENDPOINT}/width/${DESKTOP_WIDTH}/${url}`,
  };
}
