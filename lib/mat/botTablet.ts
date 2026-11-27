/**
 * Bot on the home mat (Adi, 2026-11-27: "tablet and stand thing for representing bot on the homepage"): the tablet with two
 * black eyes leaning in a birch-ply wedge, his pick from the mat-piece concepts (design 17). It is a picture of a thing
 * standing on the mat, like the Bambu printer (a cut-out whose shadow pools at its foot), rendered once from the Bot
 * scene's own birch and screen (review/bot-rack-2026-11-24/render-tablet.html). One click opens the Bot page,
 * /work/bot/ (public/work/bot/): the rack, the screen, the standee with Play and its 10-second voiced demo.
 */
export const BOT_TABLET = {
  id: 'bot:tablet',
  href: '/work/bot/',
  title: 'Bot',
  /** written out again in FlipBookApp's loadStage, where the ship kit reads the first frame's pictures */
  src: '/images/mat/bot-tablet.webp',
  /** its middle and size in page pixels (the stage's 1440 by 900 frame): the clear mat right of the yellow record, above the clipboards */
  lay: { x: 1112, y: 176, w: 124 },
  /** the picture's height over its width */
  aspect: 706 / 770,
} as const;
