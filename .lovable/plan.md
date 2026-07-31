## Goal

Store PRD Volume 9 (Error States, Empty States & Recovery) as project memory and cross-link it with Volumes 1–8. No code, no components, no UI.

## Step 1 — New memory file

Create `mem://features/error-recovery-system.md` (type: feature) capturing Volume 9:

- **Philosophy** — never blame the user, no jargon, explain clearly, always offer the next action, stay premium during failures
- **Invalid URL** — highlight input, friendly validation message, keep entered text, disable analysis until corrected
- **Website unreachable** — informative message (offline / server unavailable / connection failed) with Retry and Edit URL
- **Timeout** — pause progress animation, "This analysis is taking longer than expected.", options Continue Waiting / Retry / Cancel Analysis
- **Network offline** — detect loss, offline banner, pause requests safely, auto-retry on reconnect
- **Rate limit** — clear explanation, when analysis can continue, never expose API details
- **Analysis failure** — "Analysis could not be completed", possible causes, Retry / Edit Website / Return Home
- **Empty dashboard** — premium illustration, "No Website Analysis Yet", description, Analyze Website button
- **Empty history** — friendly message encouraging first report
- **Empty favorites** — "No Saved Reports" plus quick access to recent analyses
- **Partial loading failure** — other sections load normally, inline retry only for the failed section, never break the dashboard
- **Session recovery** — restore most recent unfinished analysis, preserve entered URLs
- **Confirmation dialogs** — before deleting reports, clearing history, removing saved reports; explain the action clearly
- **Autosave** — entered URLs, recent reports, preferences; restore after refresh when appropriate
- **Message tone** — short, calm, professional examples
- **Accessibility** — screen-reader announcements, focus moves to alerts, color never the only indicator
- **Mobile** — dialogs fit small screens, tappable buttons, readable messages
- **Performance** — immediate recovery actions, avoid reloads, preserve progress
- **Emotional goal** — never feel lost; errors reinforce trust

## Step 2 — Cross-link volumes

- Header note: Volume 1 design system, 2 landing, 3 analysis experience, 4 dashboard, 5 report, 6 intelligence, 7 motion, 8 responsive, 9 this error/empty/recovery layer, which overrides and unifies the per-journey error and empty states in Volumes 2–6.
- Add forward pointers in `mem://features/landing-experience.md`, `mem://features/analysis-experience.md`, `mem://features/analysis-dashboard.md`, and `mem://features/report-experience.md`.
- Add the new entry under Memories in `mem://index.md`, plus a Core one-liner on error tone.

## Out of scope

No error UI, components, routes, or backend work. Awaiting Volume 10.
