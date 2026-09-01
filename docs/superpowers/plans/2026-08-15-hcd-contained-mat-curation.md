# HCD Contained-Mat Curation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the deck-dump HCD pages with six contained portfolio mats per project, literal square notes, and curated 5/6 visual stories.

**Architecture:** Keep the existing shared HCD renderer and accessible viewer, but compose hero and beats through the existing `CuttingMatSurface`. Curate each project independently in its JSON manifest, while browser smoke treats the rendered visual count, mat geometry, square-note geometry, context, scrolling, and viewer behavior as the public contract.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion, Vite, Node verification scripts, Playwright browser smoke.

## Global Constraints

- FamilySync renders exactly 5 unique visuals; Squad Up renders exactly 6.
- Each route renders exactly 6 contained mats: one hero plus five story beats.
- Post-its are square, 148–184px wide, at least 14px type, and never clip.
- No full-page mat, white story panel, paper sheet, public Figma/source/evidence UI, or deleted stored assets.
- Preserve the five story beats, truth boundaries, native wheel scrolling, accessibility, and the unrelated dirty worktree.

---

### Task 1: Write the curated visual and square-note regression

**Files:**
- Modify: `scripts/smoke-hcd-case-studies.cjs`
- Modify: `scripts/verify-hcd-case-studies.mjs`

**Interfaces:**
- Consumes: Current HCD DOM markers and JSON manifests.
- Produces: Browser/static contract for `data-hcd-mat-board`, exactly 5/6 visuals, exactly 6 mats, square note geometry, contextual captions, and absence of retired white panels.

- [x] Add literal expected visual ID arrays for the five FamilySync and six Squad Up selections.
- [x] Assert six `data-hcd-mat-board` elements and six descendant `data-cutting-mat-surface` elements per route.
- [x] Assert every note’s computed width/height differ by no more than 1px, width is 148–184px, font is at least 14px, and content does not overflow.
- [x] Assert `data-hcd-story-panel` and `.hcd-paper-sheet` render zero times.
- [x] Run `node scripts/verify-hcd-case-studies.mjs all` and the browser smoke against port 4188; record RED on the old 9/18, white-panel, non-square implementation.

### Task 2: Curate FamilySync

**Files:**
- Modify: `data/hcd/familysync-story.json`

**Interfaces:**
- Consumes: Exact visual list and content rules in the design spec.
- Produces: Five-visual FamilySync manifest with two to four short notes per beat and the unchanged truth boundary.

- [x] Retain only `care-visibility-presence`, `care-crisis-journey`, `care-trust-takeaways`, `care-three-pillars`, and `care-schedule-management` in the public story.
- [x] Shorten hero/beat notes so each is a phrase that fits a 148px square at 14px without clipping.
- [x] Keep `Coordinate the work.`, `Communicate what is happening.`, and `Preserve the human connection.` as separate highlighted notes.
- [x] Run `jq empty data/hcd/familysync-story.json` and the Care verifier.

### Task 3: Curate Squad Up

**Files:**
- Modify: `data/hcd/mcdonalds-story.json`

**Interfaces:**
- Consumes: Exact visual list and content rules in the design spec.
- Produces: Six-visual Squad Up manifest with two to four short notes per beat and the unchanged truth boundary.

- [x] Retain only `mcd-live-progress`, `mcd-research-insight`, `mcd-capabilities-gap`, `mcd-value-props`, `mcd-squad-details`, and `mcd-order-complete` in the public story.
- [x] Shorten hero/beat notes so each is a phrase that fits a 148px square at 14px without clipping.
- [x] Preserve the research sample in concise surrounding copy without retaining the research-summary slide.
- [x] Run `jq empty data/hcd/mcdonalds-story.json` and the McDonald’s verifier.

### Task 4: Rebuild the shared contained-mat renderer

**Files:**
- Modify: `components/hcd/HcdCaseStudy.tsx`
- Modify: `components/hcd/PostItNote.tsx`
- Reuse: `components/ui/CuttingMatSurface.tsx`

**Interfaces:**
- Consumes: `HcdProjectStory`, `HcdStorySection`, and the curated JSON manifests.
- Produces: Six `data-hcd-mat-board` compositions with square pasted notes and optional contextual images.

- [x] Import and reuse `CuttingMatSurface` for the hero and each beat; do not recreate mat CSS in HCD files.
- [x] Make `PostItNote` `aspect-square`, 148–184px wide, 14px minimum, with paper texture, lifted lower edge, small rotations, and no clipping.
- [x] Replace standalone black hero text and white story panels with contained mat boards, dark-glass heading plaques, direct-on-mat notes, and unboxed images.
- [x] Preserve the existing lightbox, close control, portrait handling, focus return, and internal scroll container.
- [x] Run the static verifier and browser smoke until GREEN.

### Task 5: Final responsive verification and handoff

**Files:**
- Modify: `AGENTS.md` (`## Codex` only)

**Interfaces:**
- Consumes: Completed shared renderer and curated manifests.
- Produces: Verified local preview and scoped change record.

- [x] Run `npm run build`.
- [x] Run `node scripts/verify-hcd-case-studies.mjs all`.
- [x] Run `node scripts/smoke-hcd-case-studies.cjs http://127.0.0.1:4188` across 1440, 629, and 390 viewports.
- [x] Confirm exact 5/6 visual IDs, six mats, square unclipped notes, real wheel scrolling, no overflow/errors, and optional viewer behavior.
- [x] Add one newest-first line under `## Codex`; do not stage, commit, push, or deploy.
