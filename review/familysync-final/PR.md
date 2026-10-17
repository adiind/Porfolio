# FamilySync: final polish — one colour code, journey map showpiece

Branch `familysync-final`. Local only: not pushed, merged or deployed.

Built on the local working tree (brand pass + Codex pass 3), not on `main` or the live site. Critique and direction: `CRITIQUE.md`. Before/after: `index.html` (open via the dev server at `/review/familysync-final/index.html`, or as a file).

## Round 2 (after Adi's review of cb8a6e0)

1. **Illustrations restored, with colour around them.** The four scenes are back. Synthesis, Exploration and Outcome now open with a two-column lead (heading | illustration), and each plate has a frame in its section's colour. Tension gets a wide plate under its copy. Synthesis, Exploration and Outcome also sit on a faint wash of their colour (blue, navy, green) that runs under the rail. No new images were generated: making new pictures from the style reference needs the image tool used in pass 3, and this session doesn't have it.
2. **Journey map, less table, more journey.**
   - **Services:** every stage has a mark in full colour. Real marks: school agent (stages 1 and 5, deck frames 45–47), calendar search, Pinterest, Instacart. New glyphs in the same tile system, based on the deck's own timeline icons (frame 57): response window (hourglass, coral), trusted circle (person, teal), location surface (pin with house, violet; deck frames 48–49 "Receiving GPS from Location Surface"). No faded icons.
   - **Feeling line:** one solid line across all seven stages, always fully drawn. Its colour follows the feeling: red when strained, amber when unsettled, green when calm. "Low point" is marked at Notify Stacy and "High point" at Control. A ring rides the line to show where you are.
   - **Travelling thread:** one line runs lane by lane, down through a stage (Stacy → FamilySync → Services) and back up through the next. Each stretch is in that stage's service colour, it draws as you scroll, and it turns in the gaps so it never crosses text.
   - **Lit column:** a soft panel in the active stage's service colour slides from stage to stage.
   - **Fewer lines:** the table rules are gone. Stacy and FamilySync are soft white bands.
   - **Clock:** the big clock runs 11:00 → 11:03 through the response window, reads "Time unknown" on stages 04–06, and lands on 15:00 at stage 07. A ruler under it fills from 11:00 to 15:00 as you scroll.
3. **Stage times 04–06:** the deck gives none. Frames 43–58 were checked and show events only, no clock. These stages say "Time unknown" rather than an invented time.

## What changed (round 1)

1. **Journey map rebuilt as the showpiece.** Lanes for Stage, Stacy, How she feels, FamilySync and Services across the seven deck stages. Stacy's feeling is one curve. It changes colour with whoever is acting (school amber → calendar blue → FamilySync navy → Instacart green). The low point (stage 2, "I'm running out of time!") and the high point (stage 7) are labelled. On desktop the map pins; scrolling draws the curve, drops a playhead onto it, pops each real service mark in at full colour, and steps a large clock through the stage times (11:00, 11:00 → 11:03, 11:03, 11:03 – 15:00, 15:00). It settles on a stage when you stop. Stage buttons jump to their stage. On phones the same lanes read top to bottom, and the numbered dots ride a spine curve with a small feeling meter. Reduced motion shows the whole map drawn.
2. **One colour code.** Every colour belongs to a service in the story. Each section's kicker, rail dot and accents use the colour of its part of the afternoon. Exploration's three directions now have colour, so they are no longer invisible white-on-cream.
3. **Rail matches Squad Up.** The white side column is gone: the page is one paper surface and the rail floats on it. Tinted bands (Context, Tension) run under the rail. Dots fill in each section's colour; the reading line takes the current one. The rail's background blur, which smeared band edges, is removed.
4. **One type rhythm.** One h2 size, one kicker style, one section gap.
5. **Illustrations.** Round 1 removed the four empty-room banners. Adi rejected that: they are restored in round 2.
6. **Bug fix.** The hero phone no longer sinks over the Context headline. Its parallax was removed; the card hand-off is unchanged.
7. **One stylesheet.** The five layered files were merged in their original order into `familysync.css`, with the final system at the end.

## Kept intact (brand-pass beats)

Real marks from the deck; the 11:00 → 11:03 clock and response window; the calendar step on the relay phone; four-card stack incl. "Confirming cart with Stacy!"; "Cart created! / Instacart ingredient list"; "Default Payment: Visa ending 1234" as plain text (no logo); gold sweep + green check on confirm; faculty credit "Dan Butt & Amy O'Keefe".

## Content rules

No new facts, times or metrics. Only 11:00, 11:03 and 15:00 come from the deck; the in-between stages show "Then" (the big clock reads "11:03 – 15:00"). The feeling words and quotes are the ones already on the page (deck frames 14, 51, 59). The "Deck 14" tags and the disclaimer paragraph under the map were removed.

## Verification (all local, 2026-10-16)

- `npm run build` passes (only the existing chunk-size warning) — `build.log`.
- `capture.cjs after` (round 2) at 1440, 390, and both with reduced motion: 0 page/console errors, 0 broken images, 0 CSS filters, 0 horizontal overflow at every section. One Lenis instance and 25–27 ScrollTriggers with motion; no Lenis and 0 triggers with reduced motion — `after-qa.json`. The harness saves PNGs; they were converted to JPG for the repo.
- `interact.cjs` through the real portfolio route `/work/familysync-jpmorgan`: the stage-4 button lands on stage 4 at 1440 and 390, and the clock reads "Time unknown" there; Confirm payment → "Cart created and paid, with your yes"; Visa text intact; Escape closes back to `/` — `interaction-qa.json`.
- New colour pairs all ≥ 4.5:1, including the round-2 inks on the green wash. White dot numbers on coral failed (3.5:1), so they use dark ink; teal was darkened to `#127a6e` (white 5.2:1) — `contrast-qa.txt`.

## Not verified

- Real-device touch scrolling (iOS Safari, Android) — only Chromium emulation at 390.
- Feel of the desktop snap with a trackpad — tested with programmatic scroll and clicks, not a human hand.
- The production deploy (not run, by instruction).

## Files

- `public/work/familysync-assets/`: `story.html`, `familysync.css` (new, replaces `cc/polish/motion/brand/pass3.css`), `journey.js` (new), `motion.js`, `cc.js`, `assets/` (all nine scenes).
- `components/hcd/FamilySyncProjectDetail.tsx` and `hooks/useDialogA11y.ts`: the existing iframe wrapper from the earlier passes, committed here because the page needs them (`historyBasePath`).
- `review/familysync-final/`: critique, gallery, harness, QA output, and `before-code/` (exact baseline files, for rollback).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
