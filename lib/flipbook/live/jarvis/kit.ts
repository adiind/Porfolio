/**
 * What every Jarvis story page shares: the shape of a page module, the spread's colours, his
 * photographs, a walk that eases in and out, and prints shown whole.
 *
 * A story page is one module in this folder exporting one JarvisStoryPage; jarvisStory.ts turns
 * the list into scenes with the Surya story kit (storyScene in suryaStory.ts), so the pages keep
 * Surya's paper, type, note, line weights and labels.
 */

import { rgba } from '../motion';
import { SANS, print, tracking, wrap, type Copy, type Drawing, type Kit, type StoryTone } from '../suryaStory';

export interface JarvisStoryPage {
  /** Scene id, as named by the page's `live` in data/flipbooks.ts. */
  id: string;
  tone: StoryTone;
  /** Kicker, title, body, note. Leave `photo` out and draw prints with drawWholePrints, or give one as Surya does. */
  copy: Copy;
  /** The left half of the page (and any prints), redrawn every frame. */
  drawing: Drawing;
  /** Seconds the story takes, and the moment a still picture shows. */
  loop: number;
  rest: number;
  /** Every picture the page draws. */
  sources: string[];
  /** Every word the drawing puts on the page (labels, captions), for the book's tests. */
  words: string[];
  /** The picture's description for screen readers: what the drawing does, as `art.alt` in data/flipbooks.ts. */
  alt: string;
}

/**
 * What a picture page (jarvis<Word>.ts) says about itself, exported as `COPY`: data/flipbooks.ts reads it,
 * so a builder never touches that file. `kicker` is the small line over the title (at least 4 characters),
 * `title` a sentence (more than 8 characters), `body` one or two plain lines, `alt` what moves.
 */
export interface JarvisPictureCopy { kicker: string; title: string; body: string; alt: string }

/** The amber family of the first spread (Sensor | PRESENT). */
export const AMBER: StoryTone = { paper: [255, 241, 219], ink: [92, 46, 8], mid: [224, 132, 20] };
/** One colour family per later spread; both pages of a spread share it (data/flipbooks.ts derives the page colours from these). */
export const ROSE: StoryTone = { paper: [255, 238, 240], ink: [106, 18, 48], mid: [216, 55, 94] };
export const GREEN: StoryTone = { paper: [238, 250, 236], ink: [20, 73, 42], mid: [47, 143, 78] };
export const BLUE: StoryTone = { paper: [234, 244, 255], ink: [13, 42, 110], mid: [47, 125, 240] };
export const PLUM: StoryTone = { paper: [246, 236, 253], ink: [58, 26, 85], mid: [142, 85, 196] };
export const RED: StoryTone = { paper: [255, 236, 231], ink: [111, 23, 17], mid: [220, 58, 44] };

const PARTS = '/images/flipbook/jarvis/parts';
/** Adi's own photographs of the device. Never prints.webp on these pages, and never anything from project-worlds. */
export const PHOTO = {
  sensor: `${PARTS}/sensor.webp`,
  back: `${PARTS}/sensor-back.webp`,
  case: `${PARTS}/case.webp`,
};

/** A steady pace that eases into a stop over the last 15% of the way. */
export const arrive = (u: number): number => {
  const a = 0.85;
  const v = 1 / (a + (1 - a) / 2);
  return u <= a ? v * u : v * a + v * (u - a) - (v * (u - a) ** 2) / (2 * (1 - a));
};
/** The same, setting off from standing. */
export const depart = (u: number): number => 1 - arrive(1 - u);
/** The first moment between a and b at which `test` holds (it must stay true after). */
export const firstWhen = (test: (t: number) => boolean, a: number, b: number): number => {
  let lo = a;
  let hi = b;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (test(mid)) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
};

/** The story kit's right column, in page units. */
const COLUMN = { x: 1170, w: 760 };
const FOOT = 62;
/** Where the kit's photographs ended: their bottoms sit here, so the page keeps its balance. */
const PRINTS_FOOT = 1140;

export interface WholePrint { src: string; caption: string }

/**
 * Two photographs side by side across the right column, each shown whole at its own proportions (no crop),
 * tops aligned, the first `split` of the width. Their bottoms sit where the kit's prints end, or lower than
 * the body text if that is longer. Captions are set a little smaller than the kit's (25, not 28) so they
 * fit under prints this narrow.
 */
export function drawWholePrints(kit: Kit, copy: Copy, prints: readonly [WholePrint, WholePrint], split = 0.54): void {
  const { k, images, stage } = kit;
  const fg = stage.fg;
  const pictures = prints.map((item) => images.get(item.src));
  if (pictures.some((img) => !img)) return;
  // where the kit's body text ends (it measures the same way)
  const ctx = stage.base;
  ctx.save();
  ctx.font = `450 ${43 * k}px ${SANS}`;
  const lines = copy.body ? wrap(ctx, copy.body, COLUMN.w * k).length : 0;
  ctx.restore();
  const textEnd = 264 + 98 * copy.title.length + 4 + 60 * lines + 4;
  const gap = 36;
  const widths = [(COLUMN.w - gap) * split, (COLUMN.w - gap) * (1 - split)];
  const heights = widths.map((w, i) => w * (pictures[i]!.naturalHeight / pictures[i]!.naturalWidth));
  const top = Math.max(textEnd, 560, PRINTS_FOOT - FOOT - Math.max(...heights));
  let x = COLUMN.x;
  prints.forEach((item, i) => {
    const img = pictures[i]!;
    print(fg, k, img, { src: item.src }, x, top, widths[i], heights[i], FOOT);
    fg.save();
    fg.fillStyle = rgba([70, 58, 52]);
    fg.font = `500 ${25 * k}px ${SANS}`;
    tracking(fg, 0);
    // a longer caption steps down in size until it sits inside its card (the card is widths[i] wide)
    const room = (widths[i] - 12) * k;
    const full = fg.measureText(item.caption).width;
    if (full > room) fg.font = `500 ${Math.floor(25 * k * (room / full) * 10) / 10}px ${SANS}`;
    fg.textAlign = 'left';
    fg.textBaseline = 'middle';
    fg.fillText(item.caption, (x + 6) * k, (top + heights[i] + FOOT / 2 + 2) * k);
    fg.restore();
    x += widths[i] + gap;
  });
}
