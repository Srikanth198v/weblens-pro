## Goal

Record WebLens AI's brand and design standards so every future screen follows them automatically. No product pages are built in this step.

## Step 1 — Save as project memory

Create `mem://design/weblens-design-system.md` capturing PRD Volume 1 in full:

- Product, tagline, brand promise, audience, personality
- Inspiration set (Apple, Linear, Stripe, Framer, Notion — inspired, never copied)
- Color rules: emerald primary (buttons, highlights, progress, active, success), slate secondary (text, borders, cards), white / light-gray backgrounds, soft gradients; no neon, no colorful backgrounds, no gaming aesthetics
- Typography: Plus Jakarta Sans headings, Inter body, fallback `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Radius, shadows, icons, spacing, responsive, performance, accessibility, UX, consistency rules
- Future-scalability list (accounts, saved reports, AI recommendations, extension, teams, PDF export, comparison, analytics, dark mode)

Add a Core section to `mem://index.md` with the one-line rules that apply to every action, plus a reference to the detail file.

## Step 2 — Design-system foundation in code

Only tokens and typography — no pages, no components with product content.

- `src/routes/__root.tsx`: add preconnect + Google Fonts `<link>` for Plus Jakarta Sans and Inter; update title/description to WebLens AI.
- `src/styles.css`: replace the default token values with the WebLens palette in oklch — emerald primary and ring, slate foreground/muted/border, white background, light-gray secondary/muted surfaces; add `--font-display` (Plus Jakarta Sans) and `--font-sans` (Inter) plus soft elevation tokens (`--shadow-soft`, `--shadow-card`) and a subtle emerald gradient token; register them in `@theme inline`. Dark-mode values are defined now so dark mode later needs no redesign.
- Radius stays modest and consistent (~0.75rem base).

## Technical notes

- Remote fonts must be loaded through a `<link>` in the root route head; a URL `@import` in `src/styles.css` breaks the Tailwind v4 build.
- All colors stay semantic tokens; components never use raw color utilities like `text-white` or `bg-[#...]`.
- The placeholder `src/routes/index.tsx` is left untouched in this step and gets replaced when Volume 2 defines the pages.

## Out of scope

Landing page, analysis flow, dashboard, backend, auth — awaiting the next PRD volume.
