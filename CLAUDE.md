# CLAUDE.md

Personal portfolio site for adidesign.org — a React 19 + TypeScript + Vite SPA with no backend. All content is data-driven from local TS/JSON files; content changes are data edits, not component edits.

## Commands

```sh
npm run dev        # Vite dev server on http://localhost:3000
npm run build      # Type check, every test, then the production build — the standard verification step
npm run check      # Type check and tests only
npm run preview    # Serve the production build
npm run sync:pull  # Notion task cache sync (also: sync:push, sync:list, sync:status)
```

Verify changes with `npm run build` plus a browser check on `localhost:3000` — that is this repo's convention. The build stops on a type error or a failing test, and CI (`.github/workflows/check.yml`) runs the same command on every push.

## Gotchas

- Tailwind is loaded from the CDN with an inline `tailwind.config` in `index.html` — it is **not** a build dependency. Don't add a tailwind.config.js or PostCSS setup; edit the inline config instead.
- **Tailwind does nothing on the 3D home and the flip books** (`/`, `/mat`, `/book/<slug>`). Since 2026-11-24 `index.html` gives those pages only Tailwind's fixed base sheet (its reset, `#tw-base`) and never loads the compiler, because it held the 3D code back. A Tailwind utility class written under `components/mat`, `components/flipbook`, `lib/mat` or `lib/flipbook` silently has no effect: use the page's own CSS files there. The old home, case studies and `/experience` pages still get the compiler (added by script; `index.tsx` waits for `window.__tailwindReady` before the first render).
- `.env` holds `NOTION_TOKEN`, read only by the `sync:*` scripts. `GEMINI_API_KEY` is wired through `define` in vite.config.ts but is currently unset.
- The `@/` path alias resolves to the repo root (vite.config.ts).
- The repo directory is spelled `Porfolio` (no "t") — keep paths as-is.

## Architecture

- **The 3D mat is the only home** (Adi, 2026-11-24: "this new 3d mat is everything and branches to everything"). There is no old home, no `/classic`, no blog: `App.tsx`, `Hero`, the old timeline, `ProjectsSection`, the project wheel and the blog components were deleted that day. Do not bring a second home back.
- `index.html` (the inline "door" script) and `index.tsx` decide the page: `/` and `/mat` are the mat (`components/flipbook/FlipBookApp.tsx`, `components/mat/`, `lib/mat/`, `lib/flipbook/`) in a wide window and the flat copy `public/home-flat/` on a phone; `/book/<slug>` is a flip book; `/work/<id>` and `/experience/<id>` are **branch pages** (`lib/ship/BranchPage.tsx`): the detail component alone on its page (`ProjectDetail` and its variants, `ExperienceDetail`, `TinkerVerseModal`, `CaseStudyModal`), nothing underneath. Any other address goes to `/`.
- Leaving a branch page: the detail owns one history entry (`hooks/useDialogA11y.ts`), so Close, Escape and browser Back all end at `/`, and `lib/ship/returnHome.ts` steps back to the mat as it was left (or loads the home on a direct visit). Checked by `e2e/`.
- `data/` — all portfolio content: `projects.ts`, `timeline.ts` (the experience pages and the Snapdeal bag read it), per-project case studies in `data/projects/*.json`, the mat's own `lib/mat/timelineData.json` and `public/data/*-story.json`, and the synced Notion cache `notion-tasks.json`.
- `context/ProjectsContext.tsx` + `lib/projectDraftStorage.ts` — runtime project state for the Portfolio Studio editor; drafts persist to IndexedDB. Publishing roadmap lives in `PORTFOLIO_STUDIO_PLAN.md`.
- `lib/analytics.ts` — vendor-neutral event tracking (Zaraz/PostHog/Plausible/Umami browser globals, all optional).

## Conventions

- `AGENTS.md` is a prepend-only session changelog: after completing a work session, add a dated one-line entry at the **top** describing what changed and how it was verified (build + browser check, screenshots for UI passes).
- Check both a wide window and a phone-sized one (390 px) after touching routing, a branch page or anything that scrolls: phones get the flat home and the same branch pages.
