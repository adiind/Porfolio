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
  /** its middle and size in page pixels (the stage's 1440 by 900 frame): the clear mat right of the yellow record, above the clipboards */
  lay: { x: 1106, y: 175, w: 104 },
  /** turned (radians, counter-clockwise from above) so the stand's cut left end, with the ply's layers, shows */
  turn: 0.75,
  /** the click target's height over its width: the standing thing fills it */
  aspect: 784 / 728,
} as const;
