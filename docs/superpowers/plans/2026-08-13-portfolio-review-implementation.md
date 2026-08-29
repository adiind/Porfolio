# Portfolio Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development task-by-task, adapted to the user's fixed Lead A/Lead B ownership and no-commit constraint. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn every confirmed direction in `PORTFOLIO_REVIEW_NOTES.md` into a cohesive, usable portfolio experience and document the before/after outcome with evidence.

**Architecture:** Lead A owns shell and shared visual primitives, including the only edits to `App.tsx`. Lead B owns content, nested work navigation, Selected Work, and the TinkerVerse journal. Work is serialized; Lead A freezes shared glass/mat interfaces before Lead B consumes them.

**Tech Stack:** React 19, TypeScript, Vite 6, Tailwind utility classes, Framer Motion, Node scripts, Python Playwright.

## Global Constraints

- `PORTFOLIO_REVIEW_NOTES.md` is the source of truth.
- Do not deploy, push, commit, destructively modify Git state, or touch production.
- Preserve unrelated staged, unstaged, and untracked work; never use broad staging or cleanup commands.
- Writings remain intact and directly reachable; remove only public navigation and discovery paths.
- Project-wheel selection may dim or visually recede other projects, but every project remains clickable.
- Instagram is an image-led live workshop journal sourced from public data when feasible, with stable local thumbnails/stills and last-known-good fallback.
- Video-derived journal media never autoplays.
- Footer contains only a short, humble statement that the portfolio is an ongoing AI-plus-human-skills experiment, not a definitive measure of either.
- Commit evidence uses an exact build-time count for the revision being viewed, with no `+` suffix and no runtime count inferred from a capped API response.
- All new behavior supports keyboard, touch, reduced motion, and 320px-wide layouts.
- The orchestrator independently browser-tests every task before accepting it and sends failures back to the owning lead.
- The orchestrator alone adds the final newest-first `## Codex` line to `AGENTS.md` after final verification.

---

### Task 1: Baseline and shared workshop surfaces — Lead A

**Files:**
- Create: `components/ui/GlassSurface.tsx`
- Create: `components/ui/CuttingMatSurface.tsx`
- Create: `review/portfolio-redesign/browser_verify.py`
- Modify: `components/Hero.tsx`

**Interfaces:**
- Produces: `GlassSurface` with `as`, `className`, `children`, and optical-strength props; `CuttingMatSurface` with `className`, `children`, `density`, and `aria-hidden` decorative geometry.
- Consumed later by: `GitHubActivity`, `ProfileModal`, `VerticalNavbar`, `ProjectsSection`, and `TinkerVerseModal`.

- [ ] Capture baseline DOM measurements and local-only screenshots at 1440×900 and 390×844; record rejected copy, Writings navigation, truncation, modal state, and overflow in the task report.
- [ ] Add a failing source contract check proving the reusable glass/mat files do not yet exist and `Hero.tsx` still contains the private mat renderer.
- [ ] Run the contract check and record the expected failure.
- [ ] Extract the existing measured-square cutting-mat renderer without changing hero geometry, and create one shared optical-glass primitive with restrained highlight, border, blur, shadow, and fallback background.
- [ ] Run `npm run build` and the task-specific Playwright baseline/regression script.
- [ ] Self-review visual consistency, focus visibility, reduced motion, resize behavior, and idle rendering cost; write the report.

### Task 2: GitHub evidence, tool marks, and discipline/project wheel — Lead A

**Files:**
- Modify: `components/GitHubActivity.tsx`
- Modify: `components/Hero.tsx`
- Modify: `vite.config.ts`
- Create or modify: `public/images/tool-marks/*`
- Test: `review/portfolio-redesign/browser_verify.py`

**Interfaces:**
- Consumes: `GlassSurface` from Task 1.
- Produces: exact `__PORTFOLIO_COMMIT_COUNT__` build constant and one accessible wheel interaction model shared by pointer, keyboard, and touch.

- [ ] Add failing checks for the `100+`/`Build Activity` language, capped runtime total, visible tool labels/pills, and duplicated focusable marquee controls.
- [ ] Run checks and record their expected failures.
- [ ] Inject `git rev-list --count HEAD` through Vite as an exact revision-specific build constant with a truthful source-link fallback.
- [ ] Replace the tracker with a higher-contrast glass evidence card and inviting GitHub-history CTA.
- [ ] Use polished standalone Antigravity, Codex, and Claude marks with accessible attribution and no visible pills or names.
- [ ] Replace the vertical discipline marquee with a dimensional wheel/orbit composition; preserve project clickability, make the active relationship legible, and provide a static reduced-motion/mobile composition.
- [ ] Run the build and browser tests at 1440×900, 1280×800, 390×844, and reduced motion.
- [ ] Self-review hierarchy, contrast, pointer/keyboard parity, focus order, and frame stability; write the report.

### Task 3: Northwestern context and BTech completeness — Lead B

**Files:**
- Modify: `types.ts`
- Modify: `data/timeline.ts`
- Modify: `components/ExperienceDetail.tsx`
- Modify: `components/TimelineEvent.tsx`
- Modify: `components/MobileTimeline.tsx`
- Create: optimized derivatives under `public/images/bits/`
- Test: `review/portfolio-redesign/browser_verify.py`

**Interfaces:**
- Produces: feature-card links to existing portfolio project IDs and feature-card media galleries with truthful media labels.
- Does not modify: `App.tsx` or Lead A files.

- [ ] Add failing checks that Northwestern lacks JPMorgan/McDonald's linked boxes, full labels are clamped, and the Modular Water Closet card lacks both requested renders.
- [ ] Run checks and record expected failures.
- [ ] Add linked Northwestern project boxes that open existing rich case studies inside the experience context.
- [ ] Ensure close button, backdrop, Escape, and browser Back dismiss only the topmost detail and restore Northwestern scroll/focus.
- [ ] Optimize and copy `Bidet Design.jpg` and `Bidet Handle Design.jpg`; label both as concept renders and present them without destructive fixed-ratio crops.
- [ ] Remove avoidable one-line truncation for the complete B.Tech degree and project names.
- [ ] Run build and browser tests on desktop/mobile, including nested modal and focus-return paths.
- [ ] Self-review factual copy, provenance, crop, readability, and responsive behavior; write the report.

### Task 4: Durable Instagram journal data — Lead B

**Files:**
- Modify: `types.ts`
- Modify: `constants.ts`
- Modify: `scripts/update-instagram-data.js`
- Modify: `data/instagram_posts.json`
- Create: `data/tinkerverse_journal.json`
- Create: stable media under `public/images/tinkerverse/`
- Create: `scripts/verify-instagram-data.mjs`

**Interfaces:**
- Produces: `JournalEntry` records with `id`, `instagramUrl`, `publishedAt`, `caption`, `mediaType`, `localMediaUrl`, `alt`, `statusLabel`, and optional `projectId`.
- Failure contract: invalid, empty, partial, or unavailable public synchronization never overwrites the last verified manifest/assets.

- [ ] Write failing fixture-driven verification for required media fields, valid local files, newest-first order, unique IDs, public Instagram URLs, and no partial overwrite.
- [ ] Run it and record expected failure against the caption-only schema.
- [ ] Extend the public Apify ingestion path to retain image/video thumbnail candidates, download stable local derivatives, validate the complete next manifest, and atomically replace only after success.
- [ ] Attempt a public refresh when credentials/access exist; otherwise construct the verified local fallback from real existing project/process media and preserve each Instagram source URL.
- [ ] Run failure simulations for missing token, empty response, invalid media, and interrupted output.
- [ ] Run `node scripts/verify-instagram-data.mjs` and write the report with sourcing limitations explicitly stated.

### Task 5: TinkerVerse live workshop journal — Lead B

**Files:**
- Modify: `components/TinkerVerseModal.tsx`
- Modify: `components/TimelineEvent.tsx`
- Modify: `components/MobileTimeline.tsx`
- Test: `review/portfolio-redesign/browser_verify.py`

**Interfaces:**
- Consumes: Task 4 `JournalEntry` data and Task 1 `GlassSurface`/`CuttingMatSurface`.
- Produces: image-led lead artifact, recent field-note grid, truthful status tags, project routes, and restrained Instagram CTA.

- [ ] Add failing browser assertions proving the current journal is text-first and lacks media/status/project evidence.
- [ ] Run them and record expected failures.
- [ ] Replace the like-meter grid with one large recent active-build visual and a compact curated image grid.
- [ ] Show short human captions, truthful evidence labels, and project tags only where a real mapping exists.
- [ ] Use video thumbnails/stills without autoplay and retain a restrained “Follow the ongoing work” Instagram link.
- [ ] Run desktop, 390px, 320px, reduced-motion, offline-media, nested-detail, keyboard, and touch tests.
- [ ] Self-review editorial hierarchy, image authenticity, legibility, and load behavior; write the report.

### Task 6: Selected Work on the cutting mat — Lead B

**Files:**
- Modify: `components/ProjectsSection.tsx`
- Modify only if necessary: `components/ProjectCard.tsx`
- Test: `review/portfolio-redesign/browser_verify.py`

**Interfaces:**
- Consumes: Task 1 `CuttingMatSurface` and existing project/deep-link interfaces.
- Preserves: intent meanings, overlapping membership, ordering, deep links, modal behavior, and filter semantics.

- [ ] Add failing checks for the rejected heading/subheading and absence of the mat wrapper.
- [ ] Run them and record expected failures.
- [ ] Begin directly with “I want to see how Adi…” and integrate filters, cue/count, and the complete grid into one legible variable-height mat surface.
- [ ] Bound decorative density so cells stay square and rulers remain readable without creating an oversized SVG.
- [ ] Preserve the verified project counts and order for every intent.
- [ ] Run build and desktop/mobile/reduced-motion filter, deep-link, modal, and overflow tests.
- [ ] Self-review hierarchy, card contrast, label wrapping, focus states, and layout stability; write the report.

### Task 7: Profile, header, sidebar, footer, and unified scrolling — Lead A

**Files:**
- Modify: `components/ProfileModal.tsx`
- Modify: `components/VerticalNavbar.tsx`
- Create: `components/PortfolioFooter.tsx`
- Modify: `App.tsx`
- Test: `review/portfolio-redesign/browser_verify.py`

**Interfaces:**
- Consumes: final section heights plus Task 1 glass primitive.
- Owns: all public section navigation, footer mounting, and scroll-transition integration.

- [ ] Add failing checks for the blacked-out profile, Writings navigation item, missing footer, header misalignment/crop, and Writings-specific snap target.
- [ ] Run them and record expected failures.
- [ ] Redesign the profile as a strong editorial glass panel that preserves page context, maintains actions, and retains dialog accessibility.
- [ ] Align header photo/name/practice text, move the indicator right of the text, and preserve more hair in the crop.
- [ ] Apply the shared glass system to the sidebar and remove only its Writings item.
- [ ] Add only the short statement: “Made with AI and my own skills—an ongoing experiment, not a final measure of either.”
- [ ] Replace the asymmetric section-snap conditions with one coherent hero → experience → work → footer model in both directions; reduced motion uses immediate transitions.
- [ ] Run full desktop/mobile keyboard, touch, wheel, trackpad-like burst, Back, modal, footer, and no-Writings-discovery tests.
- [ ] Self-review scroll predictability, context preservation, visual hierarchy, contrast, and mobile control collisions; write the report.

### Task 8: Whole-portfolio regression and before/after report — Orchestrator

**Files:**
- Create: `docs/reports/2026-08-13-portfolio-review-before-after.md`
- Modify: `AGENTS.md` only after all verification passes
- Test: `review/portfolio-redesign/browser_verify.py`

**Interfaces:**
- Consumes: all lead reports, file-scoped diffs, browser results, and build output.
- Produces: final delivery ledger, before/after reflection, evidence-based UX verdict, remaining blockers, and one newest-first Codex log entry.

- [ ] Inspect every changed file and compare each source-of-truth note to its implementation evidence.
- [ ] Run `npm run build` fresh and record exit status plus bundle/media observations.
- [ ] Run the complete Playwright matrix at 1440×900, 1280×800, 1024×768, 390×844, 375×667, 320×700, and reduced motion.
- [ ] Test every overlay, nested return path, project filter, deep link, public navigation item, scroll transition, local fallback, and external CTA.
- [ ] Reject visual or interaction results that are technically present but fail hierarchy, contrast, glass consistency, readability, motion, accessibility, responsive behavior, or performance.
- [ ] Send each defect back to its owning lead and repeat the focused test until it passes or a real blocker is documented.
- [ ] Write the report with: original state, user intent, implementation summary, before/after comparison, files changed, evidence, fix rounds, UX verdict, performance/accessibility findings, limitations, and reflection.
- [ ] Add one newest-first `## Codex` line to `AGENTS.md`; do not edit any other section.
- [ ] Re-run build and the complete regression after the documentation-only change, then report local completion without committing, pushing, or deploying.
