## Goal

Store PRD Volume 4 (User Journey 03 — Analysis Dashboard) as project memory and cross-link it with Volumes 1–3. No code, no components, no UI. Memory writes need your approval first, since plan mode blocks all file writes.

## Step 1 — New memory file

Create `mem://features/analysis-dashboard.md` (type: feature) capturing Volume 4:

- **Objective** — the heart of WebLens AI; feels like a premium AI consultant, not a spreadsheet; every section tells a story; logical sequence over information dump; encourages exploration
- **Layout order** — Website Preview → Overall Score → Summary Cards → Detailed Analysis → Recommendations → Export Report
- **Website preview** — large browser mockup, URL above, small refresh + share icons, soft rounded corners, premium shadow
- **Overall score** — large animated circular score (e.g. 91 / Excellent), fills 0→final over 1s, emerald gradient, small glow, never flashy
- **Quick summary** — four equal cards: Design, Performance, SEO, Accessibility; each with icon, score, status, short description; animate one after another
- **Design review** — Visual Hierarchy, Typography, Spacing, Color Consistency, Navigation, CTA Visibility; each card: score, status, strengths, areas to improve; smooth expand
- **Performance review** — Loading, Images, JavaScript, CSS, Caching, Animations; each row: status, score, recommendation
- **SEO review** — Meta Title, Meta Description, Headings, Image Alt Text, Internal Links, Open Graph, Structured Data, Sitemap; each: Pass / Warning / Needs Attention
- **Accessibility** — Keyboard Navigation, Contrast, Focus States, Alt Text, Readable Fonts, Screen Reader Support; each explains why it matters
- **Business review** (unique feature) — Homepage Clarity, CTA, Trust Signals, Testimonials, Pricing, Contact Visibility, FAQ, About Page, Navigation Simplicity; each scored
- **Recommendations** — last section, grouped High / Medium / Low priority; each has title, description, expected impact, estimated difficulty; cards actionable (e.g. "Improve CTA Button — Impact High, Difficulty Easy, 15 Minutes"); expand smoothly at 300ms, never jump
- **Export** — Download PDF, Copy Report, Share Report; identical styling; hover soft lift + soft glow
- **Floating navigation** — scroll progress indicator with Overview, Design, Performance, SEO, Accessibility, Business, Recommendations; active section auto-highlights
- **Scroll animations** — sections fade upward, cards sequential, charts draw themselves, numbers count up, nothing appears instantly
- **Empty state** — elegant illustration, how-to explanation, Analyze Website button
- **Error state** — friendly explanation, Retry, Edit URL, Support link
- **Mobile** — vertical stack, charts resize, swipeable cards, floating nav becomes bottom nav, large buttons
- **Accessibility & performance** — keyboard nav, visible focus, screen-reader labels, reduced motion, large touch targets; 60 FPS, lazy load lower sections, avoid unnecessary rendering
- **Emotional goal** — feels like a professional consultation; encourages curiosity and continued exploration

## Step 2 — Cross-link volumes

- Header note in the new file: Volume 1 = design system, Volume 2 = landing, Volume 3 = analysis experience, Volume 4 = this dashboard; all visuals inherit Volume 1 tokens, and this journey continues where Volume 3's dashboard build-in sequence ends.
- Add a forward pointer in `mem://features/analysis-experience.md` to Volume 4.
- Add the new entry under Memories in `mem://index.md`.

## Out of scope

No dashboard page, components, routes, styles, charts, or backend work. Awaiting Volume 5.