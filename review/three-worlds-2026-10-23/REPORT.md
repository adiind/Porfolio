# Three project worlds — 2026-10-23

Three existing routes upgraded: `/work/surya`, `/work/jarvis`, `/work/plotter`.

## Direction and scene score

References inspected: the current P&G prototype `review/pg-blank-bottle-2026-10-10/index.html` and integrated Squad Up `/work/mcdonalds-interaction-design`. Their shared principle is a meaningful visual world followed by legible source-backed detail. Their project-specific content and branding were not reused.

- **Surya:** sunlit / moonlit domestic miniature → close camera travel → three illustrative flowers open and fold at different phases → an interactive day slider → design journey and original mandala fabrication photos. The exact layer order and motor mechanism are not established by the available source inventory; the page avoids presenting its graphics as a mechanical simulation.
- **Jarvis:** sound / processor / room miniature → camera push and pull → a path illuminates voice, recognition, MQTT and response → selectable signal stages and a lamp response → documented pipeline, source thumbnail and build decisions. No microphone input or live hardware control.
- **Plotter:** sculptural paper / pen illustration → camera travel → paper settles and the pen draws along a measured vector path → scrubbable sample drawing → documented speech / preview / G-code / plot pipeline, original photograph and calibration tradeoffs.

Opening motion uses native scroll as its only clock, with entry, push-in, dissolve, reading hold and reversible exit. Desktop and phone compositions differ. Reduced motion skips the travel and keeps the complete readable page and controls. Process timelines show order, not invented dates or durations.

## Source and artwork boundaries

Existing `data/projects/{surya,jarvis,plotter}.json` supplies context, build, decisions and reflection. Those data files are unchanged. New short headings and process summaries are editorial organization of the existing narrative, with no added metrics, awards or research findings. The conflicting Surya motor choice is omitted from the displayed decisions.

Original project images were downloaded from the URLs already present in the project data. Surya engraving/layer photographs are M03/M06 in `review/surya-2026-10-12/INVENTORY.md`; derivatives were rotated/resized for web without recoloring. Generated miniature scenes are labeled in the interface. Source paths, hashes and sizes are in `ASSETS.json`; exact built-in imagegen prompts are in `PROMPTS.md`.

## Iterations

1. Built three editorial worlds with custom illustrations, native-scroll openings, interactive explanations, process timelines, original evidence, decisions and reflection.
2. Replaced an overly static opening treatment with project-specific scroll choreography. Corrected Plotter's pen to use the path's arc length, so its tip stays on the actual drawn endpoint. A final rendered check also removed non-scaling SVG stroke behavior that had desynchronized visible dash length from the geometric endpoint; pen-fixed.png records the corrected rendering.
3. Corrected phone overflow from transformed decorative artwork and a rotating square orbit container. Added intrinsic photo dimensions, preserved original image ratios, and made faded opening controls inert after independent review.
4. Clean `main` lacked a Forward reopen handler. The release adds one limited to the three upgraded routes; the shared workspace already contains a broader handler and was preserved.

## Verification

- Clean main baseline build and 31 existing tests passed; exact release build and the same 31 tests passed after changes.
- Scoped TypeScript check for `components/worlds` passed. The shared workspace's broad TypeScript and library test commands have unrelated pre-existing failures; those files are not included in this release.
- `MOTION-QA.json`: desktop / 390 / 320 controls, original-image enlargement and Escape, reduced motion, reverse-pose equality, and SVG-measured Plotter pen/path alignment.
- `QA.json`: final desktop / tablet / phone / narrow-phone section captures, horizontal overflow, missing images and JavaScript page errors.
- `NAVIGATION-QA.json`: card entry, Back/Forward, Escape and focus return, plus other project route inspection.
- Independent read-only code review found an invisible focus target; it was fixed before release. No critical findings. Re-review confirmed all three faded controls are skipped/restored, Back/Forward/Escape works, and Surya has no 320px overflow at any of its 24 slider hours.
- No continuous ambient timers or hardware calls; hidden-tab animation is naturally idle because motion follows scroll.
- Existing large-bundle warning remains. Touch checks are browser emulation, not physical-device testing.

## Release scope

Authoring and usable preview remain in `/Users/adi/Portfolio/Porfolio` at `http://127.0.0.1:3063`. A clean managed checkout at `/Users/adi/.codex/worktrees/three-project-worlds/Porfolio` holds the release branch, based on main `2ef9581`, and production preview at `http://127.0.0.1:3064`. Only `components/worlds`, scoped integration/navigation, eight image assets and this task's records are included. Other local work remains untouched.

Verified Cloudflare Worker `portfolio` has an active default-branch trigger connected to GitHub `adiind/Porfolio`, branch `main`, build `npm run build`. Release uses GitHub PR/main and the existing automatic deployment. No local Wrangler invocation or alternate host is used.
