# Portfolio review — before/after reflection and delivery report

Date: 2026-08-14
Source of truth: `PORTFOLIO_REVIEW_NOTES.md`
Implementation plan: `docs/superpowers/plans/2026-08-13-portfolio-review-implementation.md`
Verified immutable build: `043d621931481022846038d56ef2df212758b5a6` / 85 commits

## Executive outcome

The review has been implemented as a cohesive portfolio pass, not as a collection of isolated cosmetic fixes. The homepage now has one shared glass and cutting-mat language; the GitHub contribution chart and exact revision count are prominent build evidence; the right edge contains two nested, cropped project/discipline arcs; Northwestern and B.Tech retain complete project context; TinkerVerse is an image-led workshop journal; Selected Work is composed on a readable variable-height mat; the profile, header, sidebar, scrolling, and footer behave as one shell.

The implementation is accepted locally after repeated source, build, browser, visual, accessibility, motion, responsive, and regression review. No deploy, push, commit, staging operation, dependency installation, destructive Git command, or production change was performed as part of this delivery.

## Confirmed intent and non-negotiables

- Preserve the portfolio's tangible-AI identity while resolving hierarchy, contrast, glass consistency, and legibility.
- Keep the exact Git commit number and contribution-history chart as the main GitHub seller; make the repository CTA supporting copy.
- Show exactly two nested partial arcs entering from the right edge—an inner discipline arc and an outer project/experience arc. Do not use a full orbit, hub, marquee, linear list, or horizontal project strip.
- Keep every project destination clickable even when its relationship is visually de-emphasized.
- Preserve the hero headline, avatar, actions, standalone tool attribution, keyboard/touch access, reduced motion, and local fallbacks.
- Restore Northwestern's linked FamilySync and Squad Up/McDonald's context and preserve nested return paths.
- Show the requested B.Tech concept renders and full education/project titles without avoidable truncation.
- Present Instagram/TinkerVerse as an image-led live workshop journal, using automatic public sourcing where feasible and a safe local fallback otherwise.
- Keep Writings intact and directly reachable, but remove it from public discovery/navigation.
- Put only this statement in the footer: “Made with AI and my own skills—an ongoing experiment, not a final measure of either.”

## Before reflection

The original experience had promising ingredients but no settled hierarchy. The cutting mat was the strongest visual idea, yet the profile, sidebar, GitHub tracker, discipline rail, work filters, and modal surfaces behaved like separate systems. The GitHub card used an imprecise `100+` claim and weak “Build Activity” framing. The contribution receipt did not clearly connect the portfolio to the work of building it. Tool marks looked like labeled pills. The right-side disciplines read as a vertical ticker rather than spatial navigation.

Content completeness also broke trust. Northwestern omitted two important projects from its own experience context, nested dismissal could eject the visitor to the homepage, B.Tech media was missing, and meaningful labels were clipped despite available space. TinkerVerse reduced a visual workshop practice to dim thumbnails and text. Selected Work began with generic portfolio language and controls that floated outside the site's strongest visual system. Writings remained publicly discoverable even though the desired interim state was to retain it privately. The profile blackout, header crop/alignment, asymmetric section transitions, and missing final footer made the shell feel assembled rather than authored.

## The rejected direction and correction

The first wheel implementation was wrong. It over-interpreted “wheel” as a complete solar-system orbit and substituted a linear mobile strip. It also demoted the contribution chart while emphasizing the GitHub CTA. Although that version could be made technically responsive, it failed the requested composition and the portfolio's selling hierarchy.

That result was rejected and reopened. The correction restored a full, nonempty 12-week contribution chart and exact build-time commit number at every breakpoint. Both visible curves and all node centers now come from the same quadratic Bézier definitions. The accepted composition is only two cropped side arcs: five disciplines on the inner curve and eleven unique project/experience destinations on the outer curve. The outer arc bows farther into the mat, the arcs remain recognizable on mobile and reduced motion, and there is no full circle, center hub, or alternate strip.

This was the most important product-management lesson in the pass: a technically valid metaphor is still wrong if it changes the user's intended silhouette or weakens the strongest evidence. The final version became better by removing interpretation, not adding detail.

## After reflection

The resulting portfolio is calmer and more legible without becoming generic. The mat now acts as a shared workshop surface instead of a homepage-only decoration. Glass is used consistently for hierarchy and separation, with restrained blur, borders, highlights, shadows, and readable fallbacks. GitHub evidence reads as a genuine build receipt. The arcs create dimensional discovery while leaving the statement, actions, avatar, contribution evidence, and scroll cue intact.

The content sections now preserve context. Northwestern exposes four readable project boxes and linked rich stories without losing the parent experience. The B.Tech story shows both requested renders as labeled concept evidence rather than physical proof. TinkerVerse behaves like an active workshop journal: one lead artifact, a small set of field notes, truthful source/status labels, project relationships, and a restrained Instagram follow-through. Selected Work starts from visitor intent, keeps its verified project memberships and order, and holds the entire variable-height grid inside a measured mat.

The shell now finishes the experience. The profile is an editorial glass surface over visible page context; the scrolled identity header aligns correctly and preserves the portrait crop; public navigation has exactly three destinations; scrolling works coherently in both directions across hero, experience, work, and footer; and returning to the hero atomically removes the portfolio layer so no stale Experience or Work content paints over it. The footer closes with the requested humble statement and nothing else.

## Delivery ledger

| User request | Acceptance criteria | Owner | Main files touched | Test evidence | UX verdict | Fix rounds | Blockers |
|---|---|---|---|---|---|---:|---|
| Shared visual system | Reusable accessible glass; measured square cutting mat; no hero geometry regression | Lead A | `components/ui/GlassSurface.tsx`, `components/ui/CuttingMatSurface.tsx`, `components/Hero.tsx` | Task 1 source/build/browser checks | Accepted | 1 | None |
| GitHub seller, tool marks, two side arcs | Exact revision count and nonempty chart prominent; subordinate CTA; unlabeled standalone marks; 5+11 targets on two cropped curves; 44px targets; desktop/mobile/reduced-motion parity | Lead A | `components/GitHubActivity.tsx`, `components/Hero.tsx`, `vite.config.ts`, `public/images/tool-marks/*` | `/tmp/portfolio-review-sdd/final85-immutable-task2/task2-measurements.json` | Accepted after user correction | 4 correction rounds, plus mobile spacing | None |
| Northwestern and B.Tech completeness | Four Northwestern boxes; linked FamilySync/Squad Up; topmost Escape/Back/close/focus return; two truthful concept renders; full titles | Lead B | `types.ts`, `data/timeline.ts`, `components/ExperienceDetail.tsx`, `components/TimelineEvent.tsx`, `components/MobileTimeline.tsx`, `public/images/bits/*` | `/tmp/portfolio-review-sdd/final2-root-task3/task3-measurements.json` | Accepted | 2 | None |
| Durable Instagram data | Required journal schema; newest-first; stable local media; public source URLs; invalid/empty/partial refresh never replaces last-known-good | Lead B | `data/tinkerverse_journal.json`, `scripts/update-instagram-data.js`, `scripts/verify-instagram-data.mjs`, `public/images/tinkerverse/*`, `types.ts`, `constants.ts` | 5 canonical entries; 6/6 invalid schemas rejected; 8/8 failure simulations preserved data; atomic publish passed | Accepted with explicit fallback | 3 validation refinements | Live public refresh unavailable without `APIFY_API_TOKEN` |
| TinkerVerse live workshop journal | Image-led lead + field notes; captions, project/status tags, fallback provenance, Instagram CTA; offline/mobile/reduced-motion/nested-detail support | Lead B | `components/TinkerVerseModal.tsx`, `components/TimelineEvent.tsx`, `components/MobileTimeline.tsx`, `constants.ts` | `/tmp/portfolio-review-sdd/final2-root-task5/task5-measurements.json` | Accepted | 1 product round | Current verified fallback has no video entry |
| Selected Work on a mat | Begin “I want to see how Adi…”; filters/cue/count/grid in one mat; exact order/count; full labels; reduced motion; deep links and dialogs | Lead B | `components/ProjectsSection.tsx`, `components/ProjectCard.tsx` | `/tmp/portfolio-review-sdd/final2-root-task6/task6-measurements.json` | Accepted after visual evidence correction | 4 | None |
| Profile, header, sidebar, scroll, footer | Editorial glass; crop-safe aligned identity; exactly 3 public destinations; Writings undiscoverable but retained; exact-only footer; coherent bidirectional flow and clean hero return | Lead A | `App.tsx`, `components/ProfileModal.tsx`, `components/VerticalNavbar.tsx`, `components/PortfolioFooter.tsx` | `/tmp/portfolio-review-sdd/final85-immutable-task7/task7-measurements.json` | Accepted | 5, plus atomic-return and mobile-spacing rounds | None |
| Concurrent FamilySync/Squad Up HCD regression | Both stories render five-section workshop contract; linked/direct desktop/mobile; lightboxes; named close; Escape/Back/focus; no `undefined.map` | Lead B regression ownership; story migrations landed concurrently | `data/hcd/familysync-story.json`, `data/hcd/mcdonalds-story.json`, shared verifier | `/tmp/portfolio-review-sdd/final85-immutable-task8/task8-measurements.json` | Accepted and preserved | 3 | None |
| Whole portfolio | Build, source contracts, desktop/mobile/reduced-motion, all overlays/routes/filters, visual review, no browser errors/overflow | Orchestrator | `review/portfolio-redesign/browser_verify.py`, this report, `AGENTS.md` | Immutable SHA-85 matrices plus final source/build/data checks | Accepted locally | Cross-lane regression/fix loop | No deployment was authorized |

## Verification evidence

### Build and source integrity

- Fresh Vite build passed at the verified SHA with 2,131 modules.
- Final main bundle: 364.67 kB raw / 103.51 kB gzip.
- Baseline main bundle: 414.21 kB raw / 110.49 kB gzip.
- Net change: approximately 49.54 kB smaller raw and 6.98 kB smaller gzip (about 12% and 6.3%, respectively), despite the richer journal, arcs, shell, and HCD coverage.
- Shared source contracts for Tasks 1, 2, 3, 5, 6, and 7 passed.
- `python -m py_compile review/portfolio-redesign/browser_verify.py` passed.
- `git diff --check` passed.
- `node scripts/verify-hcd-case-studies.mjs all` passed.

### Browser matrix

- Arc/GitHub matrix: 1440×900, 1280×800, 390×844, 320×700, and reduced motion.
- Shell matrix: 1440×900, 1280×800, 1024×768, 390×844, 375×667, 320×700, reduced motion, cross-feature smoke, direct work navigation, and real touch bidirectional flow.
- Northwestern/B.Tech: desktop and mobile judged states plus nested interactions.
- TinkerVerse: desktop, 390px, 320px, reduced motion, and offline media.
- Selected Work: 1440px, 1280px, 390px, 320px, reduced motion, all four filter orders/counts, all ten deep links, and Back/Escape/named-close/focus-return.
- HCD stories: eight linked/direct × desktop/mobile FamilySync and Squad Up paths.
- Whole-portfolio smoke: desktop and mobile.
- Accepted runs recorded zero horizontal overflow and zero console, page, local-request, or HTTP errors.
- After this report and the Codex ledger entry were written, the production build was run again and the rebuilt artifact passed a final 1440×900 + 390×844 browser regression; measurements are in `/tmp/portfolio-review-sdd/final-post-report-regression/regression-measurements.json`.

### Interaction and accessibility

- Every arc target is at least 44×44px, pairwise non-overlapping, center hit-testable, and clear of CTAs, Git evidence, avatar, mobile navigation, and desktop sidebar.
- Pointer, keyboard, touch, Escape, browser Back, backdrop, named close, focus trap, and focus restoration were exercised where applicable.
- Reduced motion uses the same information architecture without infinite bounce or moving arc geometry.
- Dialog stacking was verified; `ProjectDetail` portals to `document.body` so shell chrome cannot intercept its close controls.
- Full labels wrap instead of truncating; mobile text containers were checked for hidden inner overflow.
- Returning to the hero hides and inerts the entire portfolio layer, removes it from accessibility and hit-testing, hides the scroll header, and exposes exactly one active Profile navigation state.

### Visual and responsive quality

- Two visible arc paths and their node coordinates use the same quadratic geometry, with sub-pixel path deviation in the focused measurements.
- At 320px the Git card retains the exact count, chart, source CTA, and tool marks while maintaining explicit 12px clearances from hero actions and the bottom cue/mat boundary.
- The Selected Work mat expands to its real content height; rulers, viewBox, last-card containment, and lower paint were tested rather than inferred from a top-of-page screenshot.
- Images use stable local derivatives and non-destructive containment where provenance or portrait geometry matters.

## Data, truthfulness, and performance notes

The journal updater supports an atomic public Apify refresh, but this environment had no `APIFY_API_TOKEN`. No Instagram login, cookie reuse, or unverified network scraping was attempted. The shipped five-entry fallback uses real project records, stable local WebP derivatives, public Instagram source URLs, descriptive alt text, and an explicit `Verified portfolio fallback` label. Video-still support exists, but the current verified set contains no video entry and ships no autoplay path.

The legacy 100-caption Instagram archive remains intact on disk but is no longer imported into the public bundle. This preserves writing while avoiding a 47.72 kB public-bundle regression.

Concurrent HCD story and portrait-geometry work advanced the shared branch during this review. Those changes were not overwritten or claimed as lead commits. The final immutable build includes them, and both workshop stories were independently regression-tested in linked and direct desktop/mobile paths.

## Remaining limitations and release boundary

- There are no known local implementation or UX blockers against the review notes.
- Automatic Instagram refresh remains unavailable until an authorized public-data credential is provided; the safe local fallback remains the current source.
- Production hosting should independently confirm SPA rewrites for direct `/work/*` routes before release. Local direct-route behavior is green under the Vite preview.
- The repository remains intentionally mixed/dirty. Unrelated staged, unstaged, untracked, nested-worktree, and concurrent changes were preserved.
- This delivery did not commit, stage, push, deploy, alter production, or reconcile branches/remotes.

## Final verdict

Accepted for local review. The requested experience is built and usable across the tested desktop, tablet, mobile, touch, keyboard, offline-fallback, and reduced-motion paths. The final result follows the clarified product intent: strong build evidence on the left, two simple cropped arcs on the right, coherent workshop surfaces through the portfolio, complete project context, and a restrained ending instead of another public content gateway.
