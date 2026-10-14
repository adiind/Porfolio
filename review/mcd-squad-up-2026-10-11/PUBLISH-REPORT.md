# Squad Up publish report

Status: original Squad Up page published and verified on 2026-10-13; tracker correction published and verified on 2026-10-14.

## Corrective update — 2026-10-14

- Restored the R1-style cream/red left progress rail over the current story, tracking Start, Overview, and all six process phases. Its stops jump to current content and its active label follows scroll. Reserved a desktop gutter without changing story copy, images, background, or motion. Kept the “Back to portfolio” control.
- Kept `/work/mcdonalds-interaction-design` as the public route. The story document is served from `public/work/squad-up-assets/story.html` inside the portfolio project dialog.
- `npm run build` passed on code commit `212d055`. The report-only follow-up commit did not change page code.
- GitHub PR [#55](https://github.com/adiind/Porfolio/pull/55) merged to `main` on 2026-10-14 as `5ecf9c2`. Cloudflare auto-deployed from `main`.

### Shipped corrective files

- `components/hcd/McDonaldsProjectDetail.tsx`
- `public/work/squad-up-assets/story.html` (moved from the former route file)
- `review/mcd-squad-up-2026-10-11/PUBLISH-REPORT.md`
- `AGENTS.md` Codex session log

### Live verification

- Live URL: [https://adidesign.org/work/mcdonalds-interaction-design](https://adidesign.org/work/mcdonalds-interaction-design)
- Direct route and homepage card both open Squad Up inside the portfolio shell; “Back to portfolio” returns to the homepage.
- At 1440px, the left tracker and back control are visible, all eight tracker landmarks render, and selecting Research updates the story fragment to `#p-research`. The story retains all six road stops.
- At 390px, the existing responsive layout hides the left rail and keeps the back control visible. No horizontal overflow.
- Reduced motion sets the story’s `no-motion` mode. 30 story images loaded and none were broken; no 404s or browser console errors were observed. The existing Tailwind CDN and font preload warnings remain.

## Changes made

- Replaced the existing McDonald’s project detail at `/work/mcdonalds-interaction-design` with the approved Squad Up page while keeping that public route.
- Updated the homepage/work-index card title, summary, and thumbnail to match the replacement page.
- Removed stale Figma `sourceUrl` and `sourceLabel` data fields that the replacement page does not use.
- Shipped only the page HTML, its required CSS/JavaScript/font runtime, and its route-scoped image assets. Kept backups, `journey-final2.js`, screenshots, reports, and capture tooling in `review/`.
- Recompressed three large WebPs without changing their pixel dimensions: clay logo 2171×724 (about 1,098 KB → 272 KB), phone shell 823×1544 (about 826 KB → 91 KB), and context scene 2400×1600 (about 684 KB → 550 KB). No images were upscaled.
- No copy, layout direction, or motion behavior was changed. The existing first-scroll warmup remains in place.

## Shipped files

- `components/hcd/McDonaldsProjectDetail.tsx`
- `data/projects/mcdonalds-interaction-design.json`
- `public/work/mcdonalds-interaction-design/index.html`
- `public/work/squad-up-assets/` (17 required CSS, JavaScript, and font files)
- `public/images/mcd/squad-up/` (49 optimized WebP files)

## Build and local checks

- `npm run build` passed on commit `76a10b8` before merge. Vite emitted the existing large-chunk advisory; there were no build errors.
- Checked the public route at 1440px and 390px, including the homepage card handoff, road navigation, and reduced-motion mode. No horizontal overflow, loaded broken images, or Squad Up console errors were found. The six road links target the six case-study phases; all image references resolve in the shipped tree.
- The surrounding app reports its existing Tailwind CDN production warning; no Squad Up page error was logged.

## Commit, PR, and live verification

- Branch: `mcd-squad-up-final`
- Commits: `45963db` (page replacement) and `76a10b8` (remove stale source-link fields)
- PR: [#52 — Replace Squad Up project page](https://github.com/adiind/Porfolio/pull/52), merged 2026-10-13 as `aaf20c176f1149a97f4be309e77f73b01a391760`.
- Cloudflare Worker `portfolio` deployment observed at 100% traffic: version `8f713eb9-ec73-4366-91d7-dbe812d77916`, created 2026-10-13 19:32 UTC.
- Live URL: [https://adidesign.org/work/mcdonalds-interaction-design](https://adidesign.org/work/mcdonalds-interaction-design)
- Post-deploy check: the live homepage card shows “Squad Up — group ordering for McDonald’s” and “Group ordering across shared digital touchpoints.” Opening the card preserves the existing public route and displays the new page; the prior case-study content is absent.
- The live page exposes all six road links; selecting Research changes the fragment to `#p-research`. `?static=1#p-outcome` activates `no-motion` and retains all six sections. No loaded image was broken, no image filter was applied, and no Squad Up console errors were logged.

PR #53 adds this report and the requested Codex log entry only; it does not change page code or assets.
