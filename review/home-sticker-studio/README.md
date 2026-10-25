# Adi — Sticker Studio

An artwork-first homepage candidate: a small identity/navigation bar, one scattered 14-project sticker collection, project stories, collapsible experience and compact contact links. This is an independent review entry; the portfolio's existing homepage and case-study routes are preserved.

## Preview

From this folder: `npm install`, then `npm run dev`. The local URL is **http://127.0.0.1:4466/**. From the repository root with dependencies already installed: `./node_modules/.bin/vite --config review/home-sticker-studio/vite.config.mjs`.

`npm run build` produces the standalone site in `dist/`. The content and optimized assets needed to run it are included. This entry is not automatically published by the existing production Vite build.

The collection uses deliberately scattered coordinates, varied scales, rotations and overlapping clusters, with a separate phone composition. Labels appear on hover or keyboard focus. Sticker textures retain their original colour without scene relighting. The slogan hero, duplicate sticker display and marketing headings are removed; Adi remains capitalized in the navigation.

## Interaction

- Click any project sticker to open its story. Browser Back, Escape and the close controls return to the collection with focus restored.
- Hover lifts and gently bends a sticker. On desktop, drag a collection sticker and release it to return. Touch remains available for ordinary page scrolling.
- Filters narrow the collection; experience rows expand.
- System reduced-motion preferences and the footer motion control disable interactive movement. A static artwork fallback is available with `?no3d` and activates after WebGL failure.
- Direct links use `?project=<id>`; existing full case studies retain their canonical `/work/<id>` links.

## Sticker pipeline

Read [the agent workflow](pipeline/AGENT-WORKFLOW.md). `registry.json` selects each version; `catalog.mjs` controls the project collection. `stickers.mjs plan` prepares exact two-reference image-tool jobs, `accept` versions and records visually reviewed outputs, and `validate` checks hashes, transparency, clipping and dimensions. `prepare.mjs` builds optimized images and content from a source-qualified snapshot; it does not call a generator. The original source and selected PNG files are bundled under pipeline/inputs with their source paths and hashes recorded. refresh-sources.mjs is a separate explicit refresh from the full portfolio workspace.

The six newly generated illustrations are documented in `pipeline/generation-log.json`. Eight stickers reuse the existing selected collection. Every sticker is illustration, not a new photograph or physical validation. The project imagery inside each story comes from existing portfolio files.

## Verification

Run `npm run check:assets` and, with the preview running, `npm run check:browser`. Browser QA uses installed Google Chrome via Playwright. Results are saved to `pipeline/asset-QA.json` and `pipeline/browser-QA.json`. Visual evidence is under `shots/`.

Checked at 320, 390, 768 and 1440 pixels: all project entries, filters, keyboard focus return, direct link, Back/Forward, drag/release, reduced motion, no horizontal overflow, and loss of WebGL. Captures were visually inspected. These are digital browser checks; no physical product claims are added.

## Design references

- [Haoqi Wen](https://haoqi.design/): dimensional lettering, soft sky backdrop, tactile stickers.
- [Yan Liu](https://yanliuportfolio.vercel.app/): a collection of objects with a maker's character.
- [John Gearhart](https://johngearhart.me/): distinct project colours and source imagery.
- [Kevin Hilgendorf](https://kevinhilgendorf.com/): large typography and controlled editorial spacing.

The implementation uses Adi's existing project artwork and its retained sticker template. Subjective superiority over the references is not established by browser tests.
