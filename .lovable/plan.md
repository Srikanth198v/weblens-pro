## Goal

Store PRD Volume 6 (WebLens Intelligence) as project memory and cross-link it with Volumes 1–5. No code, no components, no UI. Memory writes need approval first, since plan mode blocks file writes.

## Step 1 — New memory file

Create `mem://features/weblens-intelligence.md` (type: feature) capturing Volume 6:

- **Objective** — signature feature; turns raw analysis into business advice; feels like an experienced UX consultant, not a warning list; user instantly sees what matters, why, what to fix first, and the likely impact
- **Position** — appears after all technical analysis sections in the dashboard (understand first, then guidance)
- **Section header** — title "WebLens Intelligence", subtitle "Prioritized insights based on your website analysis."; premium and distinct
- **Intelligence overview** — three summary cards: Top Opportunity, Quick Win, Greatest Strength; each with icon, short title, one-sentence explanation
- **Priority levels** — Critical / High / Medium / Low, colored from the design system; no alarming colors, stays professional
- **Recommendation structure** — Title, Short Summary, Why This Matters, Business Impact, Estimated Difficulty, Estimated Time, Priority Badge, Recommended Next Step
- **Business impact wording** — outcomes not tech: improve user trust, increase conversion potential, reduce visitor confusion, strengthen brand credibility, improve mobile usability, increase search visibility; concise
- **Difficulty** — Very Easy / Easy / Moderate / Advanced; never numeric complexity scores
- **Time estimates** — 5 Minutes, 15 Minutes, 30 Minutes, 1 Hour, Half Day, Several Days; estimates only
- **Why This Matters** — plain-language consultant explanation, no jargon (example: CTA blends into surroundings, contrast helps visitors find where to click)
- **Action checklist** — short items per recommendation (increase button contrast, add spacing, improve heading hierarchy, simplify nav labels, check mobile layout)
- **Confidence indicator** — Very High / High / Medium / Low per recommendation
- **Positive reinforcement** — celebrate strengths alongside issues (typography consistency, branding, responsive behavior, navigation clarity, color palette); balance builds trust
- **Learning cards** — small educational tips between sections (why accessibility matters, why hierarchy improves usability, why speed affects conversions)
- **Future AI compatibility** — UI stays independent of the intelligence engine; rule-based today, AI models later, no redesign required
- **Empty state** — "Insights will appear after a successful website analysis." plus Analyze Website button
- **Mobile** — vertical stacking, badges stay visible, checklist readable, comfortable spacing
- **Accessibility & performance** — keyboard nav, readable type, screen-reader labels, reduced motion, contrast; progressive loading, smooth animation, avoid unnecessary rendering
- **Emotional goal** — "this tool understands my website"; the defining feature of WebLens AI

## Step 2 — Cross-link volumes

- Header note in the new file: Volume 1 = design system, Volume 2 = landing, Volume 3 = analysis experience, Volume 4 = dashboard, Volume 5 = report, Volume 6 = this Intelligence section; visuals inherit Volume 1 tokens; it renders inside the Volume 4 dashboard after the technical sections and feeds the Volume 5 report's insights.
- Add forward pointers in `mem://features/analysis-dashboard.md` and `mem://features/report-experience.md`.
- Add the new entry under Memories in `mem://index.md`.

## Out of scope

No intelligence UI, components, routes, styles, or backend/AI work. Awaiting Volume 7.