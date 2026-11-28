/**
 * Bot on the home mat (Adi, 2026-11-27: "tablet and stand thing for representing bot on the homepage"): the tablet with two
 * black eyes leaning in a birch-ply wedge, his pick from the mat-piece concepts (design 17). It is built in 3D on the
 * mat (lib/mat/botTabletLayer.ts) over an empty click target, whose place and size are set here. One click opens the Bot page,
 * /work/bot/ (public/work/bot/): the rack, the screen, the standee with Play and its 10-second voiced demo.
 */
export const BOT_TABLET = {
  id: 'bot:tablet',
  href: '/work/bot/',
  title: 'Bot',
  /** the click target: its middle and width in the stage's pixels (its 1440 by 900 frame, which the slanted camera shows a little lower and shorter). It boxes the whole drawn thing, on the clear mat right of the yellow record, under the Work label and above the clipboards */
  lay: { x: 1110, y: 168, w: 104 },
  /** the click target's height over its width */
  aspect: 1.29,
  /** the stand's length, as a share of the click target's width (seen turned, it is narrower than its own length) */
  stand: 0.859,
  /** where the stand's middle is set down, from the target's middle, as shares of the target's width (right, and down the page) */
  foot: { x: -4 / 104, y: 22 / 104 },
} as const;
