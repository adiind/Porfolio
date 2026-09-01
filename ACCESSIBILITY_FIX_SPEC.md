# P0 Accessibility Fix Spec

Implements the P0 items from `ACCESSIBILITY_AUDIT.md` (2026-07-06): keyboard operability for all interactive content (O-1, O-2, O-3, O-6) and a shared accessible-dialog system (O-4, O-5, R-1, R-2, U-3). Line numbers are approximate — locate each site by the quoted code anchor, not the number.

**Ground rules for the implementer**
- Match existing code style (Tailwind classes, framer-motion usage, arrow components). No explanatory comments about the change itself.
- Do not restructure layouts or alter visuals except where a focus ring is specified.
- After each workstream: `npm run build` must pass. Do not run `npm run dev` (Notion pull can fail); use `npx vite` if a dev server is needed.
- The shared keyboard-activation snippet used across Workstream 1:

```tsx
const handleActivate = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    /* same handler the onClick calls */
  }
};
```

- Focus style to use everywhere a new focusable element is created (matches the Edit-Projects button precedent):
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/80`

---

## Workstream 1 — Keyboard operability

Reference implementation already in the repo: `components/ProjectCard.tsx` (~113–158) — `role="button"`, `tabIndex={0}`, `onKeyDown` Enter/Space, `aria-label`. Copy that pattern; do not invent a new one.

### 1.1 `components/TimelineEvent.tsx`
Clickable divs to upgrade (add `role="button"`, `tabIndex={0}`, `onKeyDown`, `aria-label`, focus ring):
- Grid cards: the three `onClick={handleGridClick}` sites (~157, ~166, ~184). Label: `aria-label={`Open ${item.title}`}`.
- Rail cards: `onClick={() => onOpenProject && onOpenProject(item)}` (~427 and ~579). Same label.
- TinkerVerse box: `onClick={() => !isScrolling && onOpenTinkerVerse && onOpenTinkerVerse()}` (~567). Label `"Open TinkerVerse"`. This container has nested `<button>`s (Plotter/Surya/Jarvis quick-opens) — keep it a `role="button"` div (not `<button>`), and confirm the inner buttons call `e.stopPropagation()` in both click and keydown paths.
- Case-study module (~956 `onClick={(e) => {`) and the FitCard component (`onClick={onClick}` at ~1028 and ~1068): same pattern; label from the item/case-study title.
- Hover-reveal (audit O-11, do the cheap part now): wherever card detail content is shown via `group-hover:` classes on these cards, add the matching `group-focus-within:` variant so keyboard focus reveals the same content.

### 1.2 `components/MobileTimeline.tsx`
- Card tap: `onClick={() => handleCardTap(item)}` (~97) → role/tabIndex/onKeyDown/aria-label.
- Feature card (~217) and "show more" (~268): same, unless already a `<button>` — check first; if it's a div, upgrade.
- TinkerVerse box: `onClick={onOpenTinkerVerse}` (~306): same.

### 1.3 `components/VerticalNavbar.tsx`
- Desktop items (~44–52): change `motion.div` → `motion.button` (type="button"). Keep existing classes/handlers/aria-label; drop the now-redundant `role="button"`. Add `aria-current={isActive ? 'true' : undefined}` and the focus ring.
- Mobile items (already `<button>`): add `aria-current` the same way. Give each button `min-w-11 min-h-11` (44px) with centered content — icon size unchanged.

### 1.4 `components/Hero.tsx`
- Avatar/profile trigger: the element with `onClick={onOpenProfile}` (~762, the wrapper that includes the "View Profile" CTA, currently `tabindex="0"` with no role): add `role="button"`, `onKeyDown` (Enter/Space → `onOpenProfile`), `aria-label="View profile"`, focus ring.
- The two `outline-none` buttons (audit O-9, skills list ~579 and ~628): replace `outline-none` with the focus-visible ring combo above.

### 1.5 `App.tsx`
- Header profile chip: `onClick={() => handleOpenProfile('header_badge')}` (~996) on a div → make it a `<button type="button">` with `aria-label="View profile"` and focus ring (it contains only image/text — safe as a real button). Keep layout classes.
- Mobile Home button (~1153 `onClick={() => {`, renders `<Home size={20} />` with no text): add `aria-label="Back to top"`.
- Zoom buttons (~1098–1122): replace `title="..."` naming with `aria-label` of the same text (keep `title` too if present).
- **Intro keyboard exit (O-6):** add a `useEffect` keydown listener on `window`: when `mode === 'intro'`, no modal open, and `e.key` is `'ArrowDown'`, `'PageDown'`, or `' '` (Space) with the event target not an input/textarea/button, call the same transition the intro wheel handler calls (`dismissIntroForTouchScroll('keyboard')` — grep for it) and `e.preventDefault()`. Mirror: in `fit` mode, `'ArrowUp'`/`'PageUp'` at container top may call the intro-return path if trivially wireable; skip if not.
- **"SCROLL TO EXPLORE" affordance:** wrap the existing "SCROLL TO EXPLORE" text (grep for it; it may live in Hero.tsx) in a `<button type="button">` that triggers the same intro-dismiss transition, styled identically (no visual change beyond the focus ring), `aria-label="Explore timeline"`.

### 1.6 `components/SnapdealAdsCard.tsx`
- Toggle div (~21 `onClick={(e) => {`): role/tabIndex/onKeyDown + `aria-expanded={isExpanded}` (grep the actual state name).

---

## Workstream 2 — Accessible dialog system

### 2.1 New hook: `hooks/useDialogA11y.ts`

One hook, used by every overlay. Signature and required behavior:

```tsx
import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export function useDialogA11y(onClose: () => void, options?: { historyTag?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    container?.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();               // state-based close — never via history
        return;
      }
      if (e.key === 'Tab' && container) {   // focus trap
        const els = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)]
          .filter(el => el.offsetParent !== null || el === document.activeElement);
        if (!els.length) { e.preventDefault(); container.focus(); return; }
        const first = els[0], last = els[els.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === container)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
        else if (!container.contains(active)) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);

    // Browser-back closes the dialog; the dialog never depends on history to close.
    const tag = options?.historyTag;
    const handlePopState = () => onCloseRef.current();
    if (tag) {
      window.history.pushState({ modal: tag }, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (tag) {
        window.removeEventListener('popstate', handlePopState);
        if (window.history.state?.modal === tag) window.history.back(); // consume entry; fire-and-forget
      }
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  return containerRef;
}
```

Notes: capture-phase keydown so it wins over app-level listeners; the ref goes on the dialog's outermost fixed container, which must also get `tabIndex={-1}`.

### 2.2 Retrofit every overlay

For each overlay below:
1. `const dialogRef = useDialogA11y(<the real state close>, { historyTag: '<tag>' })` — the close callback must be the direct state close (`onClose` prop), **not** `history.back()`.
2. On the outermost fixed motion.div: `ref={dialogRef}`, `tabIndex={-1}`, `role="dialog"`, `aria-modal="true"`, `aria-labelledby="<id>"`; give the title heading that `id`.
3. Delete the component's own pushState/popstate/Escape effect (the hook replaces it). Rewire `handleManualClose`/backdrop/close-button to call `onClose()` directly.
4. Name every icon-only button.

| Overlay | historyTag | Title element to id | Icon buttons to name |
|---|---|---|---|
| `ExperienceDetail.tsx` (outer, ~79) | `'experience'` | the `<h1>` role title | carousel prev/next chevrons → "Previous image"/"Next image" |
| `ExperienceDetail.tsx` FeatureCardModal (~433) | `'feature'` | its `<h2>` | its close X → "Close" |
| `ProjectDetail.tsx` (~222) | `'project'` | project `<h1>` | close X → "Close project"; carousel arrows → "Previous/Next image"; tab buttons already have text — ensure it's their accName; thumbnail buttons → `aria-label={`View image ${i + 1}`}` |
| `BlogDetail.tsx` (~292) | `'writing'` | post `<h1>` | close → "Close article" |
| `ProfileModal.tsx` (~39) | `'profile'` | "Hello, I'm Adi." `<h2>` | close X → "Close profile" |
| `CaseStudyModal.tsx` (~42) | `'casestudy'` | current slide `<h1>`/deck title | close X → "Close case study"; chevrons → "Previous slide"/"Next slide" |
| `TinkerVerseModal.tsx` (already has role/aria-modal/labelledby) | `'tinkerverse'` | keep existing | keep |
| `ProjectStudio.tsx` (already has role/aria-modal/labelledby) | none (no history entry today — don't add one) | keep | keep |
| `Hero.tsx` skill overlay (~798, portal) | `'skill'` | skill card `<h2>` | keep existing labeled close |

- `ProjectStudio.tsx` extra: the hook gives it Escape-to-close (wire to the same handler as "Back to site") and focus management; also add `role="status"` + `aria-live="polite"` to the autosave status div (~160) — one-line R-3 fix while in the file.
- `ExperienceDetail.tsx`/`ProjectDetail.tsx`/`BlogDetail.tsx`/`Hero.tsx`: remove the old `window.history.pushState` + `popstate` + Escape effects entirely — grep `history.pushState` and `key === 'Escape'` in each file to find them. `App.tsx` also has window-level Escape handling for some overlays (grep `'Escape'` in App.tsx) — where it duplicates a retrofitted dialog, remove the duplicate; where it closes something not retrofitted, leave it.
- Backdrop click-to-close stays as is (pointer affordance), but must call `onClose()` directly.

### 2.3 Out of scope
No DOM `inert` on the background (modals are inline in the tree; `aria-modal` + the focus trap covers it — a portal refactor is a future item). No visual redesign. No P1/P2 items beyond the one-liners named above.

---

## Verification (run after both workstreams)

1. `npm run build` — clean.
2. `npx vite` + browser: Tab from load → skill buttons → **timeline cards focusable, Enter opens ExperienceDetail** → focus lands in dialog → Tab cycles inside only → **Escape closes** → focus returns to the card.
3. Desktop nav: Tab reaches the three nav buttons; Enter navigates; `aria-current` on the active one.
4. Intro: ArrowDown/PageDown/Space dismisses the intro; "SCROLL TO EXPLORE" is a focusable button.
5. Profile: header chip and hero avatar both open via Enter; Escape closes; ProfileModal announces as dialog (role present in DOM).
6. Browser Back with a dialog open closes the dialog and does not navigate away.

---
---

# P1 Accessibility Fix Spec

Implements the P1 items from `ACCESSIBILITY_AUDIT.md`: contrast floor (P-1, P-2, P-3), landmarks & headings (P-4, P-5), and motion (O-7, O-8). Same ground rules as P0 (match code style, no explanatory comments, `npm run build` must pass, do not commit, `npx vite` not `npm run dev`).

**Concurrency warning:** another session is actively editing `App.tsx`, `Hero.tsx`, `TimelineEvent.tsx`, and the modals for animation-perf work. **Always Read the current file immediately before editing** — line numbers here are approximate and the code may have shifted. Prefer minimal, additive, localized edits.

Contrast reference (composited over `#050505`, from live measurement): `/70`≈11.1 · `/60`≈7.3 · `/55`≈6.2 · `/50`≈5.3 · `/45`≈4.5 (borderline) · **`/40`≈3.71 fail · `/35`≈3.01 fail · `/30`≈2.47 fail · `/25`≈2.08 fail · `/20`≈1.71 fail**.

## Workstream A — Contrast (P-1, P-2, P-3)

### A.1 Dark-theme muted text (P-1)
Rule: any `text-white/{20,25,30,35,40,42,43,45}` applied to **text a user needs to read or an information-bearing icon** must move up to **`text-white/55`** (or `/60` for text ≤10px). **Leave as-is** only genuinely decorative marks: the Hero cutting-mat grid ruler numbers/ticks/angle labels in `Hero.tsx` (the SVG mat background) and purely ornamental separators. When unsure whether something is decorative, bump it — a slightly brighter decoration is safer than failing text.

Known offenders to fix (grep each token; ~25 `/40`, 11 `/30`, 6 `/20`, 2 `/35`, 2 `/25` sites): `ExperienceDetail.tsx` (metadata/dates/tag chips, e.g. the `+2` chip and `•` separators), `MobileTimeline.tsx` (`text-white/30` show-more button + chevron, CTAs, timestamps — line ~267 area), `BlogSection.tsx` (`text-white/20` body + external-link icons ~line 108), `ScrollTracker.tsx` (`text-white/35` sub-labels ~282, and the inactive node `text-white/25`/`text-white/40` label states — the newly-added section buttons), `TimelineEvent.tsx` (9px month axis + inactive states), `ProjectDetail.tsx` (`text-white/35` tab label ~"The Story"), `marquee-feed.tsx` (`text-white/40` meta, `text-white/20` external-link icon ~21/29/33).

For icon-only affordances that are information-bearing (e.g. external-link, chevrons), the same `/55` floor satisfies both 1.4.3 and the 3:1 non-text rule.

### A.2 Light-theme surfaces (P-2, plus TimelineEvent light chips)
On the CaseStudyModal white/`gray-50`/`gray-100` deck and TimelineEvent light-theme cards:
- `text-gray-400` on white → `text-gray-600` (`CaseStudyModal.tsx` slide counter/attributions/labels ~74). `text-gray-500` on `gray-100` → `text-gray-600` (~213).
- `text-orange-600` "Case Study" chip on `gray-100` → `text-orange-700` (`TimelineEvent.tsx` ~975).
- `text-amber-800/80` award text on amber-100 → `text-amber-900` (full opacity) (`TimelineEvent.tsx` ~866); `text-amber-700` "Achievement" label → `text-amber-800`.
- `text-blue-900/60` journal name on blue-100 → `text-blue-900` (full opacity) (`TimelineEvent.tsx` ~945).
- On dark tiles: `text-gray-500`/`text-gray-600` (TinkerVerseModal comment counts/labels + MessageCircle icon ~30/166) → `text-white/55`.

### A.3 Non-text contrast — control boundaries (P-3)
- `ProjectStudio.tsx`: form inputs delineated only by `border-white/12` → **`border-white/40`** (≈3.7:1); placeholder `placeholder:text-white/20` → `placeholder:text-white/50`; the Studio grey label ramp `text-white/{42,43,45}` → `text-white/55` (covered by A.1).
- `TinkerVerseModal.tsx` and elsewhere: where a hairline `border-white/5`…`/10` is the **sole** visual boundary of an interactive control (input/button), raise to `border-white/40`. Do **not** touch borders that merely decorate a card whose whole surface is already an obvious clickable/hover target.

## Workstream B — Landmarks & headings (P-4, P-5)

### B.1 Skip link + main + nav (P-4)
- `App.tsx`: as the **first** element inside the top-level return `<div>` (~939), add a skip link:
  `<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">Skip to content</a>` (`sr-only`/`not-sr-only` are built into the CDN Tailwind).
- The scroll-container `<div ref={scrollContainerRef}>` (~1157): add `id="main-content"`, `role="main"`, `tabIndex={-1}`. (Keep it a `div` — it carries scroll handlers; `role="main"` gives the landmark.) Confirm it's the only `main`/`role="main"` in the app besides the Studio dialog's inner one (leave that; R-6 is P3).
- `VerticalNavbar.tsx`: wrap the desktop item list and the mobile item list each in `<nav aria-label="Sections">` (the outer positioning `div`s → `<nav>` or a `<nav>` inside them).

### B.2 Single h1 + modal title levels (P-5)
- `Hero.tsx`: the name (currently `<h2>` ~628) → **`<h1>`**; the tagline (currently `<h1>` ~925 "A human-centered…") → **`<p>`** (keep all its classes/animation). Net: the Hero name is the page's only `h1`.
- Demote each modal/detail title `<h1>` → `<h2>` (they already sit in `role="dialog"` with `aria-labelledby` pointing at these ids, so keep the `id`, change only the level): `ExperienceDetail.tsx:145`, `ProjectDetail.tsx:258`, `BlogDetail.tsx:331`, `CaseStudyModal.tsx:123`, `ProjectStudio.tsx:159`. Leave `BlogDetail.tsx:212` (markdown-rendered content h1) and `ErrorBoundary.tsx` alone.
- Do **not** chase every level-skip (2.4.6 minors) — only the h1→h2 demotions above.

## Workstream C — Motion (O-7, O-8)

### C.1 Reduced motion (O-8)
- `index.tsx`: wrap `<App />` in framer-motion's `<MotionConfig reducedMotion="user">` (import from `framer-motion`), inside `<ErrorBoundary>`. This makes framer transform/layout animations (the intro↔fit full-viewport zoom, card tilts, modal slide) honor `prefers-reduced-motion` automatically while keeping opacity fades.
- `utils.ts` `smoothScrollTo` (~38): when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, use `behavior: 'auto'` (instant) instead of `'smooth'`.
- `index.html`: add a scoped media block (near the existing inline styles) to stop CSS-driven loops for reduced-motion users, without a global `*` nuke:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .animate-scroll-vertical, .animate-marquee, .animate-pulse, .animate-ping { animation: none !important; }
    html, body { scroll-behavior: auto !important; }
  }
  ```
  (Grep `index.html` for the actual animation class/keyframe names — match them exactly; include the Hero skills-marquee class if it's CSS-based.)

### C.2 Pause loops on focus (O-7)
- `marquee-feed.tsx` (~53): the pause rule is `.group\/column:hover .animate-scroll-vertical { animation-play-state: paused }` — add `:focus-within`: `.group\/column:hover .animate-scroll-vertical, .group\/column:focus-within .animate-scroll-vertical { animation-play-state: paused; }`.
- `Hero.tsx` skills marquee (~621–640): wherever it pauses on `:hover`, add the `:focus-within` equivalent so a keyboard-focused skill button stops the scroll (prevents the focused control drifting out of view).

## Verification (after each workstream)
1. `npm run build` clean, then `npm run preview` (production, no StrictMode).
2. **Contrast:** re-run the composited-contrast eval helper over intro/fit/projects and inside ExperienceDetail, ProjectDetail, CaseStudyModal, ProjectStudio — flagged-count should drop to ~0 for meaningful text (decorative mat marks may remain and are acceptable).
3. **Landmarks:** on load, first Tab focuses "Skip to content"; activating it moves focus to `#main-content`. `document.querySelectorAll('nav,[role=main]')` shows the nav(s) + main. Heading scan shows exactly one `h1` (Hero name) on the base page.
4. **Motion:** `preview_resize` supports `colorScheme` but not reduced-motion emulation — verify via `preview_eval` that `MotionConfig` is mounted and `smoothScrollTo` branches on the media query; note in the summary that full reduced-motion confirmation needs a real browser/OS setting. Confirm marquee CSS gains `:focus-within` pause.
5. No new console errors; no visual regressions in screenshots (contrast bumps should be subtle).

---
---

# P2 / P3 Accessibility Fix Spec

Cleanup of the worthwhile P2/P3 items — all additive semantic changes, **no visual redesign**. Same ground rules (match style, no explanatory comments, `npm run build` passes, `npx vite` not `npm run dev`, no commit). Files change under a concurrent session — **Read each file fresh before editing**.

**Explicitly OUT of scope (do NOT do):** blanket sub-12px→12px text bumps (P-7 — design-defining, not a 2.1 AA failure), enlarging non-nav touch targets to 44px (2.5.5 is AAA; the controls already clear the 24px 2.5.8 minimum which isn't even in 2.1 AA), the CaseStudyModal accent-badge shade (brand color, owner's call), a blanket `aria-hidden` sweep of decorative lucide icons (low value, high churn — most icon-only buttons already have `aria-label` from P0), and O-12 inert-on-off-screen-sections (touches heavily-contended `App.tsx` — defer).

## Workstream D — ProjectStudio semantics (single file: `components/ProjectStudio.tsx`)

1. **R-4 state ARIA:**
   - Theme color buttons (~line 181, `aria-label={`Use ${color} project color`}`): add `aria-pressed={project.themeColor === color}`.
   - Sidebar project list: find the project-select buttons (the list under the "Projects · N" header ~line 170; the active one is styled with an accent border/bg) and add `aria-current={activeId === <that project's id> ? 'true' : undefined}` to the active item's button.
   - The native `<select>` status (~189) already conveys value — leave it.
2. **U-1 error message:** the status region (~162) has `role="status"`/`aria-live` (good) but the specific `draftError` text is only in a `title=`. When `draftStatus === 'error'` and `draftError` is set, render `draftError` as **visible text** in a `role="alert"` element (a small line near the status/header). Keep the existing status region.
3. **R-6 label/landmark hygiene:**
   - The preview column uses `<main>` (~179) inside the `role="dialog"` — change that `<main>` to a `<div>` (the app now has its real `<main>` from P1; a second main inside a dialog is wrong).
   - Nested `<label>`: `Field` (~37) renders a `<label>`, and the Hero-image (~185) and Gallery (~192) fields put a `MediaDropzone` (which has its **own** `<label htmlFor>`, ~89) inside it — nested labels are invalid. Give `Field` an optional prop (e.g. `asGroup`/`element`) so those two composite fields render a `<div>` with the label text in a `<span>` instead of a `<label>`; leave all single-control fields as the implicit-`<label>` form (they work). Do not break the accessible names of the plain text/textarea/select fields.
   - The JSON import file input (~165, `sr-only`) has no name — add `aria-label="Import draft JSON"`.

## Workstream E — Alt text, states, teaser, dead-modal (files: `Hero.tsx`, `TimelineEvent.tsx`, `TinkerVerseModal.tsx`, `ProjectsSection.tsx`, `ProjectModal.tsx`)

1. **P-6 meaningful alt text** — replace generic alt with descriptive text drawn from the item data:
   - `Hero.tsx:~898` `alt="Profile"` → `alt="Adi Agarwal"`.
   - `TimelineEvent.tsx` `alt="Logo"` (~242, ~785) → the item's company/title (e.g. `` `${item.company ?? item.title} logo` `` — use whatever field exists); `alt="Thumbnail"` (~501, ~1033) and `alt="Project"` (~515) → the item/project title.
   - `alt="TV"` (`TimelineEvent.tsx:~1161/~1232`, `TinkerVerseModal.tsx:~92`) → `alt="TinkerVerse"`.
   - Read the surrounding code to use the correct in-scope variable for each; don't invent fields.
2. **R-4 aria-expanded on Hero skill toggles:** the skill buttons (`Hero.tsx` ~749, ~782, `onClick={() => handleActiveNodeChange(skill.id)}`) open the skill overlay — add `aria-expanded={activeSkillId === skill.id}` (grep the actual state var; it's `activeSkillId`, `skillExpanded = activeSkillId !== null`). If the overlay container has a stable id, add `aria-controls` to it too; skip `aria-controls` if there's no stable id.
3. **O-13 writings teaser** (`ProjectsSection.tsx` ~124): the unlock `<button>`'s accessible name is currently the cryptic concatenated span text and its label only reveals on `:hover`. Add `aria-label="Read my writings"` to the button, and add `group-focus:`/`group-focus-within:` variants next to the `group-hover:` classes on the revealing label span (~134) so keyboard focus reveals it too.
4. **O-14 dead modal** (`ProjectModal.tsx` ~102): change the YouTube embed `autoplay=1` → `autoplay=0` (component is imported but not rendered; this neutralizes the latent autoplay issue without deleting code the other session may touch).

## Verification (after both)
`npm run build` clean. In `npm run preview`: open Studio → theme buttons expose `aria-pressed`, active sidebar project has `aria-current`, no nested `<label>` (`document.querySelectorAll('label label').length === 0`), only one `main` in the whole doc; open a timeline experience → images have descriptive alt (spot-check the accessibility snapshot); Hero skill buttons expose `aria-expanded`; the writings teaser announces "Read my writings"; grep confirms `autoplay=0`.
