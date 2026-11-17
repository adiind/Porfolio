// The Zomato Food Rescue card, drawn with canvas 2D so it can be a texture in the 3D mat scene,
// plus five story cards in the same style. No React; only canvas and document.fonts.

import { loadFlipbookFonts } from '../flipbook/pageArt';

export type NotchStyle = 'tab' | 'scoop' | 'bite';

export const RESCUE_SOURCES = {
  bag: '/images/mat/food-rescue/bag.webp',
  offer: '/images/mat/food-rescue/offer.webp',
  logo: '/images/mat/food-rescue/zomato-wordmark.webp',
} as const;

export interface RescueArt {
  bag: HTMLImageElement;
  offer: HTMLImageElement;
  logo: HTMLImageElement;
}

/** Card size in canvas pixels. The card's shape matches the home page card: 124.1 wide to 296.4 tall. */
export const RESCUE_CARD = { w: 620, h: 1481 } as const;

const RED = '#e23744';
// The site's own Bricolage file (weight 800), the one the books draw with: no wait on another company's server, and
// no chance of the card being drawn once in a stand-in typeface because that server was slow.
const BRICOLAGE = `'FB Bricolage', 'FB Geist', system-ui, sans-serif`;
const SANS = `'FB Geist', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`;
const W = RESCUE_CARD.w;
const H = RESCUE_CARD.h;
/** Corner radius: 12.8% of the card's width. */
const R = Math.round(W * 0.128);
/** Side padding for all type. */
const PAD = 62;

/** Resolves when the typefaces the cards use are ready to draw with. */
export function rescueFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return loadFlipbookFonts().then(() => undefined, () => undefined);
}

function makeCanvas(): { cv: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  return { cv, ctx };
}

// ---------- outlines ----------

/** Plain rounded rectangle, with an optional per-corner radius [tl, tr, br, bl]. */
function roundRectPath(p: Path2D, x: number, y: number, w: number, h: number, r: [number, number, number, number]) {
  const [tl, tr, br, bl] = r;
  p.moveTo(x + tl, y);
  p.lineTo(x + w - tr, y);
  if (tr) p.arcTo(x + w, y, x + w, y + tr, tr);
  p.lineTo(x + w, y + h - br);
  if (br) p.arcTo(x + w, y + h, x + w - br, y + h, br);
  p.lineTo(x + bl, y + h);
  if (bl) p.arcTo(x, y + h, x, y + h - bl, bl);
  p.lineTo(x, y + tl);
  if (tl) p.arcTo(x, y, x + tl, y, tl);
  p.closePath();
}

// Notch numbers shared by the layout and the outlines.
const TAB = { w: 372, d: 132, gap: 11, fillet: 26, r: 46 };
const SCOOP = { r: 128 };
const BITE = { w: 348, h: 136, gap: 11, convex: 44, fillet: 30 };

/** Height of the zone at the top that the wordmark owns, per style. */
const TOP_ZONE: Record<NotchStyle, number> = { tab: TAB.d + 56, scoop: SCOOP.r + 40, bite: BITE.h + 56 };

function cardPath(notch: NotchStyle | 'plain'): Path2D {
  const p = new Path2D();
  if (notch === 'plain') {
    roundRectPath(p, 0, 0, W, H, [R, R, R, R]);
    return p;
  }
  if (notch === 'tab') {
    // Rounded notch cut down from the middle of the top edge, with small concave fillets where it meets the edge.
    const x0 = (W - TAB.w) / 2;
    const x1 = x0 + TAB.w;
    const f = TAB.fillet;
    const r = TAB.r;
    p.moveTo(R, 0);
    p.lineTo(x0 - f, 0);
    p.arcTo(x0, 0, x0, f, f); // concave fillet into the notch's left wall
    p.lineTo(x0, TAB.d - r);
    p.arcTo(x0, TAB.d, x0 + r, TAB.d, r);
    p.lineTo(x1 - r, TAB.d);
    p.arcTo(x1, TAB.d, x1, TAB.d - r, r);
    p.lineTo(x1, f);
    p.arcTo(x1, 0, x1 + f, 0, f);
    p.lineTo(W - R, 0);
    p.arcTo(W, 0, W, R, R);
    p.lineTo(W, H - R);
    p.arcTo(W, H, W - R, H, R);
    p.lineTo(R, H);
    p.arcTo(0, H, 0, H - R, R);
    p.lineTo(0, R);
    p.arcTo(0, 0, R, 0, R);
    p.closePath();
    return p;
  }
  if (notch === 'scoop') {
    // Both top corners are bitten away by a circle centred on the corner: concave, with a raised shoulder between.
    const s = SCOOP.r;
    p.moveTo(s, 0);
    p.lineTo(W - s, 0);
    p.arc(W, 0, s, Math.PI, Math.PI / 2, true); // from (W-s,0) round to (W,s), bulging into the card
    p.lineTo(W, H - R);
    p.arcTo(W, H, W - R, H, R);
    p.lineTo(R, H);
    p.arcTo(0, H, 0, H - R, R);
    p.lineTo(0, s);
    p.arc(0, 0, s, Math.PI / 2, 0, true);
    p.closePath();
    return p;
  }
  // bite: only the top-left corner is cut away as an inward rounded step.
  const { w, h, convex: c, fillet: f } = BITE;
  p.moveTo(w + c, 0);
  p.lineTo(W - R, 0);
  p.arcTo(W, 0, W, R, R);
  p.lineTo(W, H - R);
  p.arcTo(W, H, W - R, H, R);
  p.lineTo(R, H);
  p.arcTo(0, H, 0, H - R, R);
  p.lineTo(0, h + c);
  p.arcTo(0, h, c, h, c); // the card's new left-edge corner, rounded
  p.lineTo(w - f, h);
  p.arcTo(w, h, w, h - f, f); // inner concave corner of the step
  p.lineTo(w, c);
  p.arcTo(w, 0, w + c, 0, c); // the card's new top-edge corner, rounded
  p.closePath();
  return p;
}

// ---------- drawing helpers ----------

/** What a card is made of: the red card stock of the main card, white paper, or the brown paper of the bag itself. */
export type RescuePaper = 'red' | 'white' | 'kraft';

interface Inks {
  ground: string;
  /** the soft light in the top-left corner, and where it fades to */
  lift: [string, string];
  /** small label at the top */
  kicker: string;
  /** the big number */
  figure: string;
  /** headings */
  title: string;
  /** running lines */
  body: string;
  rule: string;
  logo: string;
  note: string;
  /** the shadow under the app screen */
  shade: string;
}

const INKS: Record<RescuePaper, Inks> = {
  red: {
    ground: RED, lift: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)'],
    kicker: 'rgba(255,255,255,0.9)', figure: '#ffffff', title: '#ffffff', body: '#ffffff',
    rule: 'rgba(255,255,255,0.32)', logo: '#ffffff', note: 'rgba(255,255,255,0.8)', shade: 'rgba(90,10,16,0.4)',
  },
  white: {
    ground: '#fffdfa', lift: ['rgba(255,255,255,1)', 'rgba(244,236,230,0.9)'],
    kicker: RED, figure: RED, title: '#231a1a', body: '#4a3f3f',
    rule: 'rgba(35,26,26,0.14)', logo: RED, note: 'rgba(35,26,26,0.55)', shade: 'rgba(70,30,30,0.26)',
  },
  kraft: {
    ground: '#d3ab7c', lift: ['rgba(255,238,205,0.5)', 'rgba(255,238,205,0)'],
    kicker: '#8c1a20', figure: '#3b1c0c', title: '#3b1c0c', body: '#4a2a17',
    rule: 'rgba(59,28,12,0.24)', logo: '#c2202b', note: 'rgba(59,28,12,0.62)', shade: 'rgba(59,28,12,0.34)',
  },
};

/**
 * Ways to colour the four story cards, first to last. The main card is always red.
 *   pages: red cover, white pages.   mix: white and red take turns.   bag: one card is the bag's own brown paper.
 */
export const RESCUE_SCHEMES = {
  pages: ['white', 'white', 'white', 'white'],
  mix: ['white', 'red', 'white', 'red'],
  bag: ['white', 'kraft', 'white', 'red'],
  red: ['red', 'red', 'red', 'red'],
} as const satisfies Record<string, readonly RescuePaper[]>;
export type RescueScheme = keyof typeof RESCUE_SCHEMES;

function paintBase(ctx: CanvasRenderingContext2D, outline: Path2D, paper: RescuePaper = 'red') {
  const inks = INKS[paper];
  ctx.save();
  ctx.clip(outline);
  ctx.fillStyle = inks.ground;
  ctx.fillRect(0, 0, W, H);
  // the soft light in the top-left of the home page card
  const g = ctx.createRadialGradient(W * 0.1, 0, 0, W * 0.1, 0, paper === 'white' ? H * 1.02 : W * 1.05);
  g.addColorStop(0, inks.lift[0]);
  g.addColorStop(1, inks.lift[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Draw the wordmark at a width, never stretched, centred on (cx, cy). Tinted by painting into a scratch canvas. */
function drawWordmark(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, cx: number, cy: number, width: number, colour: string) {
  const h = width * (logo.naturalHeight / logo.naturalWidth);
  if (colour.toLowerCase() === '#ffffff') {
    ctx.drawImage(logo, cx - width / 2, cy - h / 2, width, h);
    return;
  }
  const tint = document.createElement('canvas');
  tint.width = Math.ceil(width);
  tint.height = Math.ceil(h);
  const t = tint.getContext('2d');
  if (!t) return;
  t.imageSmoothingQuality = 'high';
  t.drawImage(logo, 0, 0, tint.width, tint.height);
  t.globalCompositeOperation = 'source-in';
  t.fillStyle = colour;
  t.fillRect(0, 0, tint.width, tint.height);
  ctx.drawImage(tint, cx - tint.width / 2, cy - tint.height / 2);
}

function setFont(ctx: CanvasRenderingContext2D, weight: number | string, px: number, family: string) {
  ctx.font = `${weight} ${px}px ${family}`;
}

/** Wrap by measuring. A single word wider than maxW stays on its own line (callers shrink the type to fit). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && ctx.measureText(test).width > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Largest size (stepping down) at which every wrapped line fits, and the line count stays within maxLines. */
function fitWrapped(
  ctx: CanvasRenderingContext2D, text: string, weight: number | string, family: string,
  maxW: number, startPx: number, minPx: number, maxLines: number,
): { px: number; lines: string[] } {
  for (let px = startPx; px >= minPx; px -= 2) {
    setFont(ctx, weight, px, family);
    const lines = wrap(ctx, text, maxW);
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)) return { px, lines };
  }
  setFont(ctx, weight, minPx, family);
  return { px: minPx, lines: wrap(ctx, text, maxW) };
}

/** Largest single-line size (up to startPx) at which the text fits maxW. */
function fitOneLine(ctx: CanvasRenderingContext2D, text: string, weight: number | string, family: string, maxW: number, startPx: number) {
  let px = startPx;
  setFont(ctx, weight, px, family);
  while (ctx.measureText(text).width > maxW && px > 20) {
    px -= 2;
    setFont(ctx, weight, px, family);
  }
  return px;
}

// ---------- the main card ----------

function paintNotchArt(ctx: CanvasRenderingContext2D, art: RescueArt, notch: NotchStyle) {
  if (notch === 'tab') {
    const x0 = (W - TAB.w) / 2 + TAB.gap;
    const w = TAB.w - TAB.gap * 2;
    const h = TAB.d - TAB.gap;
    const p = new Path2D();
    // flush with the card's top edge: square top, rounded bottom
    roundRectPath(p, x0, 0, w, h, [0, 0, TAB.r - TAB.gap, TAB.r - TAB.gap]);
    ctx.fillStyle = '#ffffff';
    ctx.fill(p);
    drawWordmark(ctx, art.logo, W / 2, h / 2 - 2, 212, RED);
  } else if (notch === 'scoop') {
    drawWordmark(ctx, art.logo, W / 2, 60 + 2, 250, '#ffffff');
  } else {
    const w = BITE.w - BITE.gap;
    const h = BITE.h - BITE.gap;
    const pr = h / 2;
    const p = new Path2D();
    // outer edges continue the card's outline: its top-left corner takes the card radius
    roundRectPath(p, 0, 0, w, h, [R, pr, pr, BITE.convex - 8]);
    ctx.fillStyle = '#ffffff';
    ctx.fill(p);
    drawWordmark(ctx, art.logo, w / 2 + 6, h / 2 - 1, 212, RED);
  }
}

/** The main card. Everything outside the card's outline (including the cut of the notch) is transparent. */
export function drawRescueCard(art: RescueArt, notch: NotchStyle): HTMLCanvasElement {
  const { cv, ctx } = makeCanvas();
  ctx.imageSmoothingQuality = 'high';
  const outline = cardPath(notch);
  paintBase(ctx, outline);

  ctx.save();
  ctx.clip(outline);

  // the bag, tilted a little and lifted off the red by a soft shadow
  const bagW = 470;
  const bagH = bagW * (art.bag.naturalHeight / art.bag.naturalWidth);
  const top = TOP_ZONE[notch];
  const bagCy = top + 40 + (610 - top) / 2 + (bagH - 540) * 0 + 150;
  ctx.save();
  ctx.translate(W / 2 - 2, bagCy);
  ctx.rotate((-5 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(90,10,16,0.45)';
  ctx.shadowBlur = 44;
  ctx.shadowOffsetY = 30;
  ctx.drawImage(art.bag, -bagW / 2, -bagH / 2, bagW, bagH);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // big figure
  const bigPx = fitOneLine(ctx, '~50%', 750, BRICOLAGE, W - PAD * 2, 214);
  ctx.letterSpacing = `${(-0.05 * bigPx).toFixed(1)}px`;
  setFont(ctx, 750, bigPx, BRICOLAGE);
  ctx.fillText('~50%', PAD - 4, 1120);
  ctx.letterSpacing = '0px';

  // caption
  const cap = fitWrapped(ctx, 'less food waste, pan-India', 400, SANS, W - PAD * 2, 56, 40, 2);
  setFont(ctx, 400, cap.px, SANS);
  cap.lines.forEach((l, i) => ctx.fillText(l, PAD, 1196 + i * Math.round(cap.px * 1.25)));

  // thin rule
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  ctx.fillRect(PAD, 1328, W - PAD * 2, 2);

  // role
  ctx.fillStyle = '#ffffff';
  const rolePx = fitOneLine(ctx, 'Lead Product Analyst', 500, SANS, W - PAD * 2, 50);
  setFont(ctx, 500, rolePx, SANS);
  ctx.fillText('Lead Product Analyst', PAD, 1328 + 36 + rolePx * 0.8);
  ctx.restore();
  // the tab and the pill sit in the cut, outside the card's outline, so they are drawn without the clip
  paintNotchArt(ctx, art, notch);
  return cv;
}

// ---------- the story ----------

export interface RescueStory {
  id: string;
  kicker: string;
  title: string;
  lines: string[];
  figure?: string;
  /** true when the line's facts come from the owner in conversation and are not in his published case study */
  fromHim?: boolean;
}

// Every line here is in his 4-page deck or on the app screen itself. Two lines that were only said in conversation
// ("~3 km" and "the restaurant recovers its cost") were cut on 2026-11-16: he did not confirm them for the public page.
export const RESCUE_STORY: RescueStory[] = [
  {
    id: 'screen',
    kicker: '1 of 4 · In the app',
    title: 'An order was just cancelled',
    lines: ['People nearby get this offer.', 'They have a few minutes to claim it.'],
  },
  {
    id: 'problem',
    kicker: '2 of 4 · The problem',
    figure: '~400,000',
    title: 'orders cancelled a month',
    lines: ['Freshly cooked, perfectly good meals were being thrown away.', 'Restaurants lost the food, drivers lost the trip.'],
  },
  {
    id: 'repitch',
    kicker: '3 of 4 · The re-pitch',
    title: "Out along the driver's route",
    lines: [
      'A cancellation sets off an instant re-pitch.',
      'It looks for the closest buyer, and skips the person who cancelled and people next to them.',
    ],
  },
  {
    id: 'gains',
    kicker: '4 of 4 · Who gains',
    title: 'Buyer, restaurant, driver',
    lines: [
      'The new buyer gets a freshly made meal in minutes, at a steep discount.',
      "The restaurant's meal is eaten, not thrown away.",
      'The driver is paid for the detour.',
    ],
  },
];

/** One of the four story cards, same size and outline family as the main card, on the paper asked for. */
export function drawRescueStoryCard(art: RescueArt, index: number, paper: RescuePaper = 'red'): HTMLCanvasElement {
  const inks = INKS[paper];
  const story = RESCUE_STORY[Math.max(0, Math.min(RESCUE_STORY.length - 1, index))];
  const { cv, ctx } = makeCanvas();
  ctx.imageSmoothingQuality = 'high';
  const outline = cardPath('plain');
  paintBase(ctx, outline, paper);
  ctx.save();
  ctx.clip(outline);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const maxW = W - PAD * 2;

  // kicker (at least 30 px)
  ctx.fillStyle = inks.kicker;
  const kPx = fitOneLine(ctx, story.kicker, 500, SANS, maxW, 36);
  setFont(ctx, 500, kPx, SANS);
  ctx.fillText(story.kicker, PAD, 108);

  // the logo sits at the very bottom
  const logoW = 180;
  const logoH = logoW * (art.logo.naturalHeight / art.logo.naturalWidth);
  const logoCy = H - PAD - logoH / 2 - 4;
  const limit = logoCy - logoH / 2 - 44;

  let y = 250;
  ctx.fillStyle = inks.title;
  if (story.id === 'screen') {
    // the real offer screen, whole and uncropped, with its own corners rounded
    const iw = maxW;
    const ih = iw * (art.offer.naturalHeight / art.offer.naturalWidth);
    ctx.save();
    const clip = new Path2D();
    roundRectPath(clip, PAD, 150, iw, ih, [30, 30, 30, 30]);
    ctx.shadowColor = inks.shade;
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = '#f6efe0';
    ctx.fill(clip);
    ctx.shadowColor = 'transparent';
    ctx.clip(clip);
    ctx.drawImage(art.offer, PAD, 150, iw, ih);
    ctx.restore();
    y = 150 + ih + 62;
    ctx.fillStyle = inks.title;
  }
  if (story.figure) {
    // tight tracking, sized by measuring with that tracking in place
    let fPx = 200;
    for (; fPx > 100; fPx -= 2) {
      setFont(ctx, 750, fPx, BRICOLAGE);
      ctx.letterSpacing = `${(-0.06 * fPx).toFixed(1)}px`;
      if (ctx.measureText(story.figure).width <= maxW + 4) break;
    }
    ctx.fillStyle = inks.figure;
    ctx.fillText(story.figure, PAD - 4, y + fPx * 0.78);
    ctx.fillStyle = inks.title;
    ctx.letterSpacing = '0px';
    y += fPx * 0.78 + 40;
    const t = fitWrapped(ctx, story.title, 600, SANS, maxW, 66, 58, 3);
    setFont(ctx, 600, t.px, SANS);
    t.lines.forEach((l, i) => ctx.fillText(l, PAD, y + t.px * 0.9 + i * t.px * 1.16));
    y += t.lines.length * t.px * 1.16 + 44;
  } else if (story.id === 'screen') {
    const t = fitWrapped(ctx, story.title, 600, SANS, maxW, 62, 58, 3);
    setFont(ctx, 600, t.px, SANS);
    t.lines.forEach((l, i) => ctx.fillText(l, PAD, y + t.px * 0.9 + i * t.px * 1.16));
    y += t.lines.length * t.px * 1.16 + 34;
  } else {
    const t = fitWrapped(ctx, story.title, 750, BRICOLAGE, maxW, 120, 84, 3);
    setFont(ctx, 750, t.px, BRICOLAGE);
    ctx.letterSpacing = `${(-0.035 * t.px).toFixed(1)}px`;
    t.lines.forEach((l, i) => ctx.fillText(l, PAD - 3, y + t.px * 0.8 + i * t.px * 1.04));
    ctx.letterSpacing = '0px';
    y += t.lines.length * t.px * 1.04 + 50;
  }

  // thin rule, then the lines (44 px down to 40 px; smaller only if nothing else fits)
  ctx.fillStyle = inks.rule;
  ctx.fillRect(PAD, y, maxW, 2);
  y += 40;
  ctx.fillStyle = inks.body;
  let laid: { px: number; blocks: string[][] } = { px: 44, blocks: [] };
  for (let px = 44; px >= 32; px -= 2) {
    setFont(ctx, 400, px, SANS);
    const blocks = story.lines.map((l) => wrap(ctx, l, maxW));
    const count = blocks.reduce((n, b) => n + b.length, 0);
    const height = count * px * 1.28 + (blocks.length - 1) * px * 0.45;
    laid = { px, blocks };
    if (y + height <= limit) break;
  }
  setFont(ctx, 400, laid.px, SANS);
  let ly = y + laid.px * 0.95;
  laid.blocks.forEach((b, bi) => {
    b.forEach((l) => {
      ctx.fillText(l, PAD, ly);
      ly += laid.px * 1.28;
    });
    if (bi < laid.blocks.length - 1) ly += laid.px * 0.45;
  });

  drawWordmark(ctx, art.logo, PAD + logoW / 2, logoCy, logoW, inks.logo);
  if (story.id === 'screen') {
    ctx.fillStyle = inks.note;
    setFont(ctx, 500, 28, SANS);
    ctx.textAlign = 'right';
    ctx.fillText('Screen: Zomato', W - PAD, logoCy + 10);
    ctx.textAlign = 'left';
  }
  ctx.restore();
  return cv;
}
