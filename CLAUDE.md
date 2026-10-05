# CLAUDE.md

Personal portfolio site for adidesign.org — a React 19 + TypeScript + Vite SPA with no backend. All content is data-driven from local TS/JSON files; content changes are data edits, not component edits.

## Commands

```sh
npm run dev        # Notion pull + Vite dev server on http://localhost:3000
npx vite           # Dev server WITHOUT the Notion pull (works offline / without .env)
npm run build      # Production build — the standard verification step
npm run preview    # Serve the production build
npm run sync:pull  # Notion task cache sync (also: sync:push, sync:list, sync:status)
```

No test runner or linter is configured. Verify changes with `npm run build` plus a browser check on `localhost:3000` — that is this repo's convention.

## Gotchas

- `npm run dev` is `notion-sync pull && vite`. If the pull fails (missing `NOTION_TOKEN` in `.env`, or offline), the script exits 1 and **the dev server never starts**. Use `npx vite` to skip the pull.
- Tailwind is loaded from the CDN with an inline `tailwind.config` in `index.html` — it is **not** a build dependency. Don't add a tailwind.config.js or PostCSS setup; edit the inline config instead.
- `.env` holds `NOTION_TOKEN`. `GEMINI_API_KEY` is wired through `define` in vite.config.ts but is currently unset.
- The `@/` path alias resolves to the repo root (vite.config.ts).
- The repo directory is spelled `Porfolio` (no "t") — keep paths as-is.

## Architecture

- `App.tsx` — application shell: intro flow, section state, global modal/overlay coordination, custom scroll + mobile gesture bridging.
- `components/` — Hero (cutting-mat SVG surface), timeline (`TimelineRail`, `TimelineEvent`, `MobileTimeline`), Selected Work (`ProjectsSection`, `ProjectCard`, `ProjectDetail`), writings (`BlogSection`, `BlogDetail`), `ProjectStudio` (live project editor), shared primitives in `components/ui/`.
- `data/` — all portfolio content: `projects.ts`, `timeline.ts`, `posts.ts`, per-project case studies in `data/projects/*.json`, and the synced Notion cache `notion-tasks.json`.
- `context/ProjectsContext.tsx` + `lib/projectDraftStorage.ts` — runtime project state for the Portfolio Studio editor; drafts persist to IndexedDB. Publishing roadmap lives in `PORTFOLIO_STUDIO_PLAN.md`.
- `lib/analytics.ts` — vendor-neutral event tracking (Zaraz/PostHog/Plausible/Umami browser globals, all optional).

## Conventions

- `AGENTS.md` is a prepend-only session changelog: after completing a work session, add a dated one-line entry at the **top** describing what changed and how it was verified (build + browser check, screenshots for UI passes).
- Mobile behavior is hand-tuned (touch/wheel/pointer gesture bridging in `App.tsx`) — check both desktop and mobile viewports after touching scroll or overlay logic.
