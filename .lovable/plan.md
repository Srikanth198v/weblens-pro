## Goal

Store PRD Volume 2 (Landing Experience) as project memory and link it to Volume 1. No code, no components, no UI. Memory files can only be written once you approve, since planning mode blocks all file writes.

## Step 1 — New memory file

Create `mem://features/landing-experience.md` (type: feature) capturing Volume 2 verbatim in structure:

- **Objective** — premium-software first impression; within 5 seconds the user grasps what it does, what to do, why to trust it
- **Layout** — centered, max ~1280px, generous whitespace, invisible grid alignment
- **Navigation** — fixed; transparent initially, after 40px scroll gains soft background, blur, soft shadow. Left: WebLens AI logo. Center: intentionally empty. Right: Documentation, About, Pricing (Coming Soon), Sign In, and the emerald "Analyze Website" primary button with subtle lift + soft glow on hover
- **Hero** — near full first screen, vertically centered: badge → headline → supporting text → website input → primary CTA → trust indicators
- **Badge** — "✨ AI Powered Website Analysis", subtle scale + soft shadow on hover
- **Headline** — ~64px desktop, max two lines, strong weight (e.g. "Analyze Your Website Like a Professional Agency")
- **Supporting text** — max two lines: paste your site, get beautiful actionable insights, improve confidently
- **Input** — the most important element: centered, large rounded, ~700px desktop, 🌐 icon, placeholder `https://yourwebsite.com`, Analyze button on the right, soft border and shadow. Focus: emerald border, slightly stronger shadow, smooth cursor
- **Analyze button** — emerald, rounded, medium height, label + arrow icon; hover lifts ~2px, shadow up, background slightly brighter, 300ms transition
- **States** — empty input: elegant helper text, no alerts; invalid URL: ~500ms gentle horizontal shake, soft red border, small message below. Never aggressive
- **Trust indicators** — ⚡ Fast Analysis · 🔒 Secure · 🎯 Actionable Insights
- **Background & decoration** — pure white, barely visible emerald gradients, extremely subtle floating gradient blobs for depth only
- **Motion** — hero fades upward on scroll; each section fade + 20px rise, 0→100% opacity, 600ms ease-in-out; mouse parallax max 8px; 60fps, no particles, every animation purposeful
- **Journey & transition** — open → read → paste URL → Analyze. On Analyze: no instant page swap; button compresses, input locks, loading begins, background softly darkens, page begins transforming into Journey 02 (cinematic but minimal, premium OS not gaming UI). Journey 02 itself stays undefined
- **Mobile** — vertical stack, full-width input, collapsed nav, large tap targets, whitespace preserved
- **Accessibility** — keyboard nav, visible focus, readable contrast, ARIA, large touch targets

## Step 2 — Link to Volume 1

- Add a "PRD volumes" note in the memory file header: Volume 1 = design system (`mem://design/weblens-design-system.md`), Volume 2 = this landing experience; all landing visuals inherit Volume 1 tokens.
- Add a cross-reference line inside `mem://design/weblens-design-system.md` pointing forward to Volume 2.
- Add the new entry under Memories in `mem://index.md`, plus one Core line: "PRD volumes arrive sequentially — store and wait; build only when explicitly requested."

## Out of scope

No landing page, components, routes, styles, or backend work. Awaiting Volume 3.
