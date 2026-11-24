/**
 * Draws the faces of a flip-book leaf onto 2D canvases.
 *
 * A page is stacked like a pop-up: `base` is the printed sheet, `word` is the
 * giant chapter word that floats just above it, and `fg` is the cut-out
 * (characters, objects, caption card) that floats above the word. The WebGL
 * book shifts those layers against each other; `flat` is the same page pressed
 * flat, used for far-away leaves, review sheets and the no-WebGL fallback.
 */

import { liveSceneFor } from './live';
import type { BookTheme, FlipBook, FlipPage, PageLayout } from './types';

export interface Rect { x: number; y: number; w: number; h: number }

export interface PageLayers {
  width: number;
  height: number;
  flat: HTMLCanvasElement;
  base: HTMLCanvasElement | null;
  word: HTMLCanvasElement | null;
  fg: HTMLCanvasElement | null;
  /** Quarter-size soft shadows: red = cut-out, green = word. */
  shadow: HTMLCanvasElement | null;
  /** Centre of the cut-out in uv (0..1, v up), used to enlarge it slightly when it pops. */
  fgCenter: [number, number];
  /** True when the caption did not fit its column: a layout fault to fix, never to ship. */
  overflow: boolean;
  /**
   * When set, the word layer is a plain white mask and the book colours it:
   * one colour on flat colour, another inside the picture frame [u0, v0, u1, v1].
   * Doing this at draw time keeps the colour change glued to the frame while the word floats.
   */
  wordTint: { panel: string; art: string; frame: [number, number, number, number] } | null;
  /** Picture frame the cut-out must stay inside at its sides and foot: [left u, bottom v, right u]. */
  fgClip: [number, number, number] | null;
  /** Clickable call-to-action in uv (v up), when the page has one. */
  cta: { u0: number; v0: number; u1: number; v1: number; href: string } | null;
}

export type BookImages = Map<string, HTMLImageElement>;

/**
 * `first`: the faces the home page's first lit frame draws with. The Food Rescue and Self cards on the stage and the closed
 * covers draw with Geist and Bricolage (their 700 and 750 are drawn with the 800 file, the nearest heavier one, whether
 * or not the 600 file is in). The serif and Bricolage 600 are only drawn inside the books, so they can come later.
 */
const FONT_FILES: Array<{ family: string; url: string; weight: string; first?: boolean }> = [
  { family: 'FB Geist', url: '/fonts/flipbook/Geist-Variable.woff2', weight: '100 900', first: true },
  { family: 'FB Bricolage', url: '/fonts/flipbook/Bricolage-800.woff2', weight: '800', first: true },
  { family: 'FB Bricolage', url: '/fonts/flipbook/Bricolage-600.woff2', weight: '600' },
  { family: 'FB Serif', url: '/fonts/pg/source-serif-4-normal-400.woff2', weight: '400' },
  { family: 'FB Serif', url: '/fonts/pg/source-serif-4-normal-600.woff2', weight: '600' },
];

const faces = new Map<string, Promise<void>>();

/**
 * Canvas text only uses a web font once it is loaded, so every book waits on this. Each face is fetched once; `'first'`
 * waits only for the faces of the home page's first lit frame (see FONT_FILES).
 */
export function loadFlipbookFonts(which: 'all' | 'first' = 'all'): Promise<void> {
  return Promise.all(FONT_FILES.filter((file) => which === 'all' || file.first).map(({ family, url, weight }) => {
    let ready = faces.get(url);
    if (!ready) {
      ready = new FontFace(family, `url(${url})`, { weight, style: 'normal', display: 'block' }).load().then((face) => { document.fonts.add(face); });
      faces.set(url, ready);
      // (a face that failed can be asked for again)
      ready.catch(() => faces.delete(url));
    }
    return ready;
  })).then(() => undefined);
}

/**
 * Every picture is fetched once for the life of the page: a book picked up again, a picture two pages share, or one
 * already fetched ahead of a click is never asked for twice. `unpack`: it is decoded before it is handed over, off the
 * main thread, so the home stage's small drawing steps do not stop to unpack it. (A book opened on its own page draws
 * everything at once and is ready sooner without it: there the pictures are unpacked as they are drawn, as before.)
 */
const pictures = new Map<string, Promise<HTMLImageElement>>();
const loadImage = (src: string, priority: 'high' | 'low' | 'auto' = 'auto', unpack = false): Promise<HTMLImageElement> => {
  const known = pictures.get(src);
  if (known) return known;
  const loading = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority;
    // (a failed decode is no failure: the picture has loaded and is unpacked when it is first drawn)
    img.onload = () => { if (unpack && img.decode) img.decode().then(() => resolve(img), () => resolve(img)); else resolve(img); };
    img.onerror = () => reject(new Error(`Flip book image failed to load: ${src}`));
    img.src = src;
  });
  pictures.set(src, loading);
  loading.catch(() => pictures.delete(src));
  return loading;
};

/** The pictures one page draws with: its picture, its cut-out mask, its word picture, and its live scene's pictures. */
export function pageSources(book: FlipBook, index: number): string[] {
  const page = book.pages[index];
  if (!page) return [];
  const sources = new Set<string>();
  sources.add(page.art.src);
  if (page.art.matte) sources.add(page.art.matte);
  if (page.wordImage) sources.add(page.wordImage.src);
  liveSceneFor(page)?.sources.forEach((src) => sources.add(src));
  return [...sources];
}

/**
 * A book's pictures: all of them, or only those of the pages asked for (the home stage asks for the cover alone,
 * `[0]`, before its light comes on: those are unpacked before they are handed over). The table comes with any of them.
 */
export async function loadBookImages(book: FlipBook, pages?: number[], priority: 'high' | 'low' | 'auto' = 'auto'): Promise<BookImages> {
  const sources = new Set<string>();
  if (book.table) sources.add(book.table);
  (pages ?? book.pages.map((_, index) => index)).forEach((index) => pageSources(book, index).forEach((src) => sources.add(src)));
  const entries = await Promise.all([...sources].map(async (src) => [src, await loadImage(src, priority, pages !== undefined)] as const));
  return new Map(entries);
}

/**
 * The order the home stage fetches the inside of a closed book in: the pages next to the cover first, so the first
 * spread is in before the rest. Each page lists only the pictures not already asked for by the cover or an earlier page.
 */
export function insideOrder(book: FlipBook, pages: number[] = book.pages.map((_, index) => index).slice(1)): Array<{ index: number; sources: string[] }> {
  const seen = new Set<string>([...(book.table ? [book.table] : []), ...pageSources(book, 0)]);
  return [...pages].sort((a, b) => a - b).map((index) => {
    const sources = pageSources(book, index).filter((src) => !seen.has(src));
    sources.forEach((src) => seen.add(src));
    return { index, sources };
  });
}

export interface PageFetch {
  /** Ask for these pages' pictures before any other, at high priority (the reader is on their way to them). */
  hurry(pages: number[]): void;
  /** Ask for nothing more (pictures already on their way still land, in the shared store above). */
  stop(): void;
}

/**
 * Fetches pages of a book in the order of insideOrder, a few pictures at a time (`lanes`) and at low priority, so they
 * never crowd what is already on screen. `onPage(index, pictures)` is told each page once all of its pictures are in
 * (pictures shared with the cover or an earlier page included), `onDone()` once every page has been told or has a
 * picture that failed.
 */
export function fetchBookPages(
  book: FlipBook, pages: number[], onPage: (index: number, pictures: BookImages) => void, onDone: () => void, lanes = 3,
): PageFetch {
  const order = insideOrder(book, pages);
  const queue = order.flatMap((page) => page.sources);
  const got: BookImages = new Map();
  const failed = new Set<string>();
  const told = new Set<number>();
  let running = 0;
  let stopped = false;
  let finished = false;
  const check = () => {
    order.forEach(({ index }) => {
      if (told.has(index)) return;
      const all = [...(book.table ? [book.table] : []), ...pageSources(book, index)];
      if (all.some((src) => failed.has(src))) { told.add(index); return; }
      if (!all.every((src) => got.has(src))) return;
      told.add(index);
      onPage(index, new Map(all.map((src) => [src, got.get(src)!])));
    });
    if (!finished && told.size === order.length) { finished = true; onDone(); }
  };
  const start = (src: string, priority: 'high' | 'low') => {
    running += 1;
    loadImage(src, priority, true).then((img) => { got.set(src, img); }, (error: unknown) => {
      failed.add(src);
      console.warn(error instanceof Error ? error.message : error);
    }).finally(() => {
      running -= 1;
      if (stopped) return;
      check();
      next();
    });
  };
  const next = () => { while (!stopped && queue.length && running < lanes) start(queue.shift()!, 'low'); };
  // the cover's and the table's pictures (already in, or on their way) count for every page
  [...(book.table ? [book.table] : []), ...pageSources(book, 0)].forEach((src) => {
    void loadImage(src, 'auto', true).then((img) => { got.set(src, img); if (!stopped) check(); }, () => { failed.add(src); if (!stopped) check(); });
  });
  next();
  return {
    hurry(wanted) {
      if (stopped) return;
      const urgent = new Set(wanted.flatMap((index) => pageSources(book, index)));
      // (started now, past the lanes: they must not wait behind pictures already on their way)
      for (let i = queue.length - 1; i >= 0; i -= 1) if (urgent.has(queue[i])) start(queue.splice(i, 1)[0], 'high');
    },
    stop() { stopped = true; },
  };
}

const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
};

const ctxOf = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
};

/* ---------- layout ---------- */

export function layoutKind(page: FlipPage): PageLayout {
  if (page.layout) return page.layout;
  if (page.art.cutout) return 'paper';
  const aspect = page.art.w / page.art.h;
  if (aspect > 2.2) return 'band';
  if (aspect < 1.25) return 'split';
  return 'bleed';
}

interface Layout {
  kind: PageLayout;
  portrait: boolean;
  /** Where the whole picture is placed. It may reach past the window. */
  place: Rect;
  artFit: 'cover' | 'contain';
  /** The framed part of the picture printed on the sheet. Null for cut-out art. */
  window: Rect | null;
  /** Cut-out subjects may rise above the frame's top edge. */
  breakout: boolean;
  /** Flat colour field behind text (the whole sheet on banded pages). */
  panel: Rect | null;
  word: Rect;
  wordAlign: 'left' | 'right' | 'center';
  text: Rect;
  /** Caption sits on a floating card over the picture instead of on a panel. */
  card: 'bl' | 'br' | 'tl' | 'tr' | null;
  /** Caption runs in a band across the foot of the page. */
  foot?: boolean;
  unit: number;
}

function computeLayout(page: FlipPage, index: number, W: number, H: number): Layout {
  const portrait = H > W;
  const kind = layoutKind(page);
  const unit = portrait ? W * 0.041 : W * 0.0146;
  const m = portrait ? W * 0.055 : W * 0.036;
  const side = page.panelSide ?? (index % 2 === 1 ? 'left' : 'right');
  const tune = portrait ? page.portrait : undefined;
  const wordTop = tune?.wordTop ?? (portrait ? undefined : page.wordTop);
  const wordHeight = tune?.wordHeight ?? (portrait ? undefined : page.wordHeight);
  const aspect = page.art.w / page.art.h;
  const sheet: Rect = { x: 0, y: 0, w: W, h: H };

  if (kind === 'poster') {
    // the picture carries its own lettering, so nothing is laid over it but a caption
    const none: Rect = { x: 0, y: 0, w: 0, h: 0 };
    if (portrait) {
      const place: Rect = { x: 0, y: 0, w: W, h: W / aspect };
      const textTop = place.h + unit * 1.5;
      return { kind, portrait, place, artFit: 'cover', window: place, breakout: false, panel: { x: 0, y: place.h, w: W, h: H - place.h }, word: none, wordAlign: 'left', text: { x: m, y: textTop, w: W - 2 * m, h: H - textTop - m * 0.8 }, card: null, unit };
    }
    const at = page.captionAt === 'foot' || !page.captionAt ? 'bl' : page.captionAt;
    const textW = W * 0.34;
    const textH = H * 0.3;
    const text: Rect = { x: at.endsWith('l') ? m * 1.15 : W - m * 1.15 - textW, y: at.startsWith('t') ? m : H - m * 0.95 - textH, w: textW, h: textH };
    return { kind, portrait, place: sheet, artFit: 'cover', window: sheet, breakout: false, panel: null, word: none, wordAlign: 'left', text, card: null, unit };
  }

  if (portrait) {
    const word: Rect = { x: m, y: H * (wordTop ?? 0.026), w: W - 2 * m, h: H * (wordHeight ?? 0.125) };
    if (kind === 'band') {
      const place: Rect = { x: 0, y: H * 0.128, w: W, h: W / aspect };
      const textTop = place.y + place.h + unit * 1.1;
      return { kind, portrait, place, artFit: 'cover', window: place, breakout: false, panel: sheet, word: { ...word, h: H * (wordHeight ?? 0.1) }, wordAlign: page.wordAlign ?? 'left', text: { x: m, y: textTop, w: W - 2 * m, h: H - textTop - m * 0.7 }, card: null, unit };
    }
    if (kind === 'paper') {
      const place: Rect = { x: m * 0.5, y: H * 0.125, w: W - m, h: H * 0.41 };
      const textTop = H * 0.566;
      return { kind, portrait, place, artFit: 'contain', window: null, breakout: false, panel: sheet, word, wordAlign: page.wordAlign ?? 'left', text: { x: m, y: textTop, w: W - 2 * m, h: H - textTop - m * 0.7 }, card: null, unit };
    }
    const banded = kind === 'split' || page.artTop !== undefined;
    if (banded) {
      // a strip of flat colour above the picture keeps the word readable over busy art
      const top = H * 0.112;
      const lift = H * (kind === 'split' ? 0.024 : 0.02);
      const pictureH = H * (kind === 'split' ? 0.5 : 0.52);
      const place: Rect = { x: 0, y: top - lift, w: W, h: pictureH };
      const window: Rect = { x: 0, y: top, w: W, h: place.y + place.h - top };
      const textTop = place.y + place.h + unit * 1.05;
      return { kind, portrait, place, artFit: 'cover', window, breakout: true, panel: sheet, word, wordAlign: page.wordAlign ?? 'left', text: { x: m, y: textTop, w: W - 2 * m, h: H - textTop - m * 0.7 }, card: null, unit };
    }
    const place: Rect = { x: 0, y: 0, w: W, h: H * 0.57 };
    const textTop = place.h + unit * 1.15;
    return { kind, portrait, place, artFit: 'cover', window: place, breakout: false, panel: { x: 0, y: place.h, w: W, h: H - place.h }, word, wordAlign: page.wordAlign ?? 'left', text: { x: m, y: textTop, w: W - 2 * m, h: H - textTop - m * 0.7 }, card: null, unit };
  }

  const word: Rect = { x: m, y: H * (wordTop ?? 0.045), w: W - 2 * m, h: H * (wordHeight ?? 0.29) };
  if (kind === 'bleed') {
    if (page.artTop !== undefined) {
      const top = H * page.artTop;
      const shift = H * (page.artShift ?? page.artTop - 0.05);
      const place: Rect = { x: 0, y: shift, w: W, h: W / aspect };
      if (page.captionAt === 'foot') {
        // letterbox: word band above, caption band below, picture between
        const footH = H * 0.172;
        return { kind, portrait, place, artFit: 'cover', window: { x: 0, y: top, w: W, h: H - top - footH }, breakout: true, panel: sheet, word, wordAlign: page.wordAlign ?? 'left', text: { x: m, y: H - footH, w: W - 2 * m, h: footH }, card: null, foot: true, unit };
      }
      return { kind, portrait, place, artFit: 'cover', window: { x: 0, y: top, w: W, h: H - top }, breakout: true, panel: sheet, word, wordAlign: page.wordAlign ?? 'left', text: { x: 0, y: 0, w: W * 0.37, h: H }, card: page.captionAt ?? 'bl', unit };
    }
    return { kind, portrait, place: sheet, artFit: 'cover', window: sheet, breakout: false, panel: null, word, wordAlign: page.wordAlign ?? 'left', text: { x: 0, y: 0, w: W * 0.37, h: H }, card: page.captionAt === 'foot' ? 'bl' : page.captionAt ?? 'bl', unit };
  }
  if (kind === 'split') {
    // picture anchored to the foot and the outer edge; its top is cropped by a
    // band of flat colour, and the characters rise out over that edge
    const top = H * (page.artTop ?? 0.235);
    const pictureW = Math.min(W * 0.62, H * (page.artScale ?? 0.9) * aspect);
    const pictureH = pictureW / aspect;
    const place: Rect = { x: side === 'left' ? W - pictureW : 0, y: H - pictureH, w: pictureW, h: pictureH };
    const window: Rect = { x: place.x, y: top, w: pictureW, h: H - top };
    const panelX = side === 'left' ? 0 : pictureW;
    const textTop = word.y + word.h + unit * 1.6;
    return { kind, portrait, place, artFit: 'cover', window, breakout: true, panel: sheet, word, wordAlign: page.wordAlign ?? (side === 'left' ? 'left' : 'right'), text: { x: panelX + m, y: textTop, w: W - pictureW - m * 1.9, h: H - textTop - m }, card: null, unit };
  }
  if (kind === 'band') {
    const place: Rect = { x: 0, y: H * 0.19, w: W, h: W / aspect };
    const textTop = place.y + place.h + unit * 1.25;
    return { kind, portrait, place, artFit: 'cover', window: place, breakout: false, panel: sheet, word: { ...word, y: H * (wordTop ?? 0.035), h: H * (wordHeight ?? 0.2) }, wordAlign: page.wordAlign ?? 'left', text: { x: m, y: textTop, w: W - 2 * m, h: H - textTop - m * 0.6 }, card: null, unit };
  }
  // paper: a cut-out standing on the sheet, text beside it. The word keeps to
  // the text side and only its last letter slips behind the cut-out.
  const artH = H * 0.86;
  const artW = Math.min(W * 0.56, artH * aspect);
  const place: Rect = { x: side === 'left' ? W - m * 0.9 - artW : m * 0.9, y: H * 0.115, w: artW, h: artH };
  // hiding a word's first letter costs more than hiding its last
  const overlap = artW * (page.wordOverlap ?? (side === 'left' ? 0.13 : 0.03));
  const wordBox: Rect = side === 'left'
    ? { x: m, y: word.y, w: place.x + overlap - m, h: word.h }
    : { x: place.x + artW - overlap, y: word.y, w: W - m - (place.x + artW - overlap), h: word.h };
  const textW = W * 0.36;
  const textTop = word.y + word.h + unit * 1.8;
  return { kind, portrait, place, artFit: 'contain', window: null, breakout: false, panel: sheet, word: wordBox, wordAlign: page.wordAlign ?? (side === 'left' ? 'left' : 'right'), text: { x: side === 'left' ? m : W - m - textW, y: textTop, w: textW, h: H - textTop - m }, card: null, unit };
}

/* ---------- drawing helpers ---------- */

interface Placement { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number }

function placeImage(iw: number, ih: number, rect: Rect, fit: 'cover' | 'contain', focus: [number, number]): Placement {
  if (fit === 'contain') {
    const scale = Math.min(rect.w / iw, rect.h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    return { sx: 0, sy: 0, sw: iw, sh: ih, dx: rect.x + (rect.w - dw) / 2, dy: rect.y + (rect.h - dh), dw, dh };
  }
  const scale = Math.max(rect.w / iw, rect.h / ih);
  const sw = rect.w / scale;
  const sh = rect.h / scale;
  const sx = Math.min(iw - sw, Math.max(0, focus[0] * iw - sw / 2));
  const sy = Math.min(ih - sh, Math.max(0, focus[1] * ih - sh / 2));
  return { sx, sy, sw, sh, dx: rect.x, dy: rect.y, dw: rect.w, dh: rect.h };
}

const drawPlaced = (ctx: CanvasRenderingContext2D, img: CanvasImageSource, p: Placement) => {
  ctx.drawImage(img, p.sx, p.sy, p.sw, p.sh, p.dx, p.dy, p.dw, p.dh);
};

let grainTile: HTMLCanvasElement | null = null;
/** A little paper tooth so flat colour reads as stock, not as a screen fill. */
function addGrain(ctx: CanvasRenderingContext2D, rect: Rect, strength: number): void {
  if (!grainTile) {
    grainTile = makeCanvas(192, 192);
    const g = ctxOf(grainTile);
    const data = g.createImageData(192, 192);
    let seed = 7;
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const value = 96 + ((seed / 2147483647) * 128);
      data.data[i] = value; data.data[i + 1] = value; data.data[i + 2] = value; data.data[i + 3] = 255;
    }
    g.putImageData(data, 0, 0);
  }
  const pattern = ctx.createPattern(grainTile, 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function roundedRect(ctx: CanvasRenderingContext2D, r: Rect, radius: number): void {
  const rad = Math.min(radius, r.w / 2, r.h / 2);
  ctx.beginPath();
  ctx.moveTo(r.x + rad, r.y);
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rad);
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rad);
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y, rad);
  ctx.arcTo(r.x, r.y, r.x + r.w, r.y, rad);
  ctx.closePath();
}

const setTracking = (ctx: CanvasRenderingContext2D, px: number) => {
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px.toFixed(2)}px`;
};

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines;
}

interface TextColors { ink: string; muted: string; accent: string }

interface CaptionMetrics { height: number; cta: Rect | null }

/** Title and body sizes in caption units, by where the caption sits. */
interface CaptionSizes { title: number; body: number; stat: number; font?: string; titleWeight?: number; bodyWeight?: number }
const CARD_SIZES: CaptionSizes = { title: 1.62, body: 1, stat: 3.3 };
const PANEL_SIZES: CaptionSizes = { title: 2.1, body: 1.1, stat: 4 };
const PORTRAIT_SIZES: CaptionSizes = { title: 1.4, body: 0.97, stat: 2.8 };
// poster captions sit straight on the picture, small and bookish, like a line of print under a plate
const POSTER_SIZES: CaptionSizes = { title: 1.72, body: 1.02, stat: 3.2, font: '"FB Serif", Georgia, serif', titleWeight: 600, bodyWeight: 400 };

/**
 * Lays out kicker, title, body, numbers, steps and the call to action in a
 * column. With `draw` false it only measures, so a card can be sized first.
 */
function drawCaption(
  ctx: CanvasRenderingContext2D, page: FlipPage, theme: BookTheme, colors: TextColors,
  box: Rect, unit: number, portrait: boolean, draw: boolean, sizes: CaptionSizes,
): CaptionMetrics {
  const family = theme.textFont;
  const proseFamily = sizes.font ?? family;
  let y = box.y;
  let cta: Rect | null = null;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  const kickerSize = unit * 0.76;
  ctx.font = `650 ${kickerSize}px ${family}`;
  setTracking(ctx, kickerSize * 0.12);
  ctx.fillStyle = colors.accent;
  wrapLines(ctx, page.kicker.toUpperCase(), box.w).forEach((line) => {
    y += kickerSize * 1.25;
    if (draw) ctx.fillText(line, box.x, y);
  });
  y += unit * 0.72;

  const titleSize = unit * sizes.title;
  ctx.font = `${sizes.titleWeight ?? 680} ${titleSize}px ${proseFamily}`;
  setTracking(ctx, sizes.font ? -titleSize * 0.008 : -titleSize * 0.022);
  ctx.fillStyle = colors.ink;
  wrapLines(ctx, page.title, box.w).forEach((line) => {
    y += titleSize * 1.1;
    if (draw) ctx.fillText(line, box.x, y);
  });

  if (page.body) {
    y += unit * 0.78;
    const bodySize = unit * sizes.body;
    ctx.font = `${sizes.bodyWeight ?? 450} ${bodySize}px ${proseFamily}`;
    setTracking(ctx, 0);
    ctx.fillStyle = colors.muted;
    wrapLines(ctx, page.body, box.w).forEach((line) => {
      y += bodySize * 1.42;
      if (draw) ctx.fillText(line, box.x, y);
    });
  }

  if (page.stats?.length) {
    y += unit * 1.2;
    const gap = unit * 1.1;
    const columns = page.stats.length;
    const colW = (box.w - gap * (columns - 1)) / columns;
    const valueSize = unit * (columns === 1 ? sizes.stat * (portrait ? 1.12 : 1.35) : sizes.stat);
    const labelSize = unit * 0.8;
    let tallest = 0;
    page.stats.forEach((stat, i) => {
      const x = box.x + i * (colW + gap);
      ctx.font = `${theme.displayWeight} ${valueSize}px ${theme.displayFont}`;
      setTracking(ctx, -valueSize * 0.04);
      ctx.fillStyle = colors.accent;
      if (draw) ctx.fillText(stat.value, x, y + valueSize * 0.86);
      ctx.font = `560 ${labelSize}px ${family}`;
      setTracking(ctx, 0);
      ctx.fillStyle = colors.ink;
      const labelLines = wrapLines(ctx, stat.label, colW);
      labelLines.forEach((line, li) => {
        if (draw) ctx.fillText(line, x, y + valueSize * 0.86 + labelSize * 1.5 + li * labelSize * 1.28);
      });
      tallest = Math.max(tallest, valueSize * 0.86 + labelSize * 1.5 + (labelLines.length - 1) * labelSize * 1.28 + labelSize * 0.3);
    });
    y += tallest;
  }

  if (page.steps?.length && layoutKind(page) !== 'band') {
    y += unit * 1.1;
    const stepSize = unit * 0.92;
    ctx.font = `620 ${stepSize}px ${family}`;
    setTracking(ctx, 0);
    let x = box.x;
    y += stepSize * 1.2;
    page.steps.forEach((step, i) => {
      const label = i < page.steps!.length - 1 ? `${step}  →  ` : step;
      const width = ctx.measureText(label).width;
      if (x + width > box.x + box.w + 1 && x > box.x) { x = box.x; y += stepSize * 1.55; }
      ctx.fillStyle = colors.ink;
      if (draw) ctx.fillText(label, x, y);
      x += width;
    });
  }

  if (page.note) {
    y += unit * 1.05;
    const noteSize = unit * 0.7;
    ctx.font = `500 ${noteSize}px ${family}`;
    setTracking(ctx, noteSize * 0.02);
    ctx.fillStyle = colors.muted;
    wrapLines(ctx, page.note, box.w).forEach((line) => {
      y += noteSize * 1.35;
      if (draw) ctx.fillText(line, box.x, y);
    });
  }

  if (page.cta) {
    y += unit * 1.25;
    const size = unit * 0.92;
    ctx.font = `620 ${size}px ${family}`;
    setTracking(ctx, 0);
    const label = `${page.cta.label}  →`;
    const padX = size * 1.15;
    const height = size * 2.75;
    const width = Math.min(box.w, ctx.measureText(label).width + padX * 2);
    cta = { x: box.x, y, w: width, h: height };
    if (draw) {
      ctx.fillStyle = colors.ink;
      roundedRect(ctx, cta, height / 2);
      ctx.fill();
      ctx.fillStyle = page.tone
        ? (colors.ink === page.tone.pale ? page.tone.deep : page.tone.pale)
        : theme.panel === colors.ink ? theme.paper : (colors.ink === theme.cardInk ? theme.card : theme.panel);
      ctx.textBaseline = 'middle';
      ctx.fillText(label, box.x + padX, y + height / 2 + size * 0.04);
      ctx.textBaseline = 'alphabetic';
    }
    y += height;
  }

  ctx.restore();
  return { height: y - box.y, cta };
}

/** The six-stop strip under the wide flow picture. */
function drawSteps(ctx: CanvasRenderingContext2D, page: FlipPage, theme: BookTheme, box: Rect, unit: number, portrait: boolean): number {
  const steps = page.steps ?? [];
  const columns = portrait ? 2 : steps.length;
  const gap = unit * (portrait ? 1 : 1.25);
  const colW = (box.w - gap * (columns - 1)) / columns;
  const numberSize = unit * (portrait ? 1.25 : 1.7);
  const textSize = unit * (portrait ? 0.8 : 0.86);
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  let rowTop = box.y;
  let rowHeight = 0;
  steps.forEach((step, i) => {
    const col = i % columns;
    if (col === 0 && i > 0) { rowTop += rowHeight + unit * (portrait ? 0.55 : 0.9); rowHeight = 0; }
    const x = box.x + col * (colW + gap);
    ctx.font = `${theme.displayWeight} ${numberSize}px ${theme.displayFont}`;
    setTracking(ctx, -numberSize * 0.03);
    ctx.fillStyle = theme.panelAccent;
    ctx.fillText(String(i + 1).padStart(2, '0'), x, rowTop + numberSize * 0.9);
    ctx.font = `500 ${textSize}px ${theme.textFont}`;
    setTracking(ctx, 0);
    ctx.fillStyle = theme.panelInk;
    const lines = wrapLines(ctx, step, colW);
    lines.forEach((line, li) => ctx.fillText(line, x, rowTop + numberSize * 0.9 + textSize * 1.55 + li * textSize * 1.34));
    rowHeight = Math.max(rowHeight, numberSize * 0.9 + textSize * 1.55 + (lines.length - 1) * textSize * 1.34 + textSize * 0.4);
  });
  ctx.restore();
  return rowTop + rowHeight - box.y;
}

const applyCase = (text: string, mode: BookTheme['wordCase']): string => (
  mode === 'upper' ? text.toUpperCase() : mode === 'lower' ? text.toLowerCase() : text
);

/** Draws the giant word to fill its box. Returns the area the ink covers. */
function drawWord(
  ctx: CanvasRenderingContext2D, page: FlipPage, theme: BookTheme, layout: Layout, images: BookImages,
  solid: string | null = null,
): Rect {
  const box = layout.word;
  if (page.wordImage) {
    const img = images.get(page.wordImage.src);
    if (img) {
      const scale = Math.min(box.w / img.naturalWidth, box.h / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const x = layout.wordAlign === 'right' ? box.x + box.w - w : layout.wordAlign === 'center' ? box.x + (box.w - w) / 2 : box.x;
      ctx.drawImage(img, x, box.y, w, h);
      return { x, y: box.y, w, h };
    }
  }
  const text = applyCase(page.word, theme.wordCase);
  const probe = 200;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `${theme.displayWeight} ${probe}px ${theme.displayFont}`;
  setTracking(ctx, probe * theme.displayTracking);
  const metrics = ctx.measureText(text);
  const inkW = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
  const inkH = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  const scale = Math.min(box.w / inkW, box.h / inkH);
  const size = probe * scale;
  ctx.font = `${theme.displayWeight} ${size}px ${theme.displayFont}`;
  setTracking(ctx, size * theme.displayTracking);
  const w = inkW * scale;
  const h = inkH * scale;
  const left = layout.wordAlign === 'right' ? box.x + box.w - w : layout.wordAlign === 'center' ? box.x + (box.w - w) / 2 : box.x;
  const x = left + metrics.actualBoundingBoxLeft * scale;
  const y = box.y + metrics.actualBoundingBoxAscent * scale;

  const paint = (clip: Rect | null, inverse: boolean, colour: string) => {
    ctx.save();
    if (clip) {
      ctx.beginPath();
      if (inverse) {
        ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.rect(clip.x + clip.w, clip.y, -clip.w, clip.h);
      } else {
        ctx.rect(clip.x, clip.y, clip.w, clip.h);
      }
      ctx.clip();
    }
    ctx.fillStyle = colour;
    ctx.fillText(text, x, y);
    ctx.restore();
  };
  if (solid) {
    paint(null, false, solid);
  } else if (!layout.window) {
    paint(null, false, page.wordColor ?? theme.wordOnPanel);
  } else if (!layout.panel) {
    paint(null, false, theme.wordOnArt);
  } else {
    // The word changes colour where it crosses from flat colour onto the picture.
    paint(layout.window, true, page.wordColor ?? theme.wordOnPanel);
    paint(layout.window, false, theme.wordOnArt);
  }
  ctx.restore();
  return { x: left, y: box.y, w, h };
}

/** A soft, blurred copy of a layer's silhouette in one colour, at a fraction of its size. */
function softSilhouette(source: HTMLCanvasElement, colour: string, w: number, h: number, passes: number): HTMLCanvasElement {
  const solid = makeCanvas(w, h);
  const sctx = ctxOf(solid);
  sctx.drawImage(source, 0, 0, w, h);
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = colour;
  sctx.fillRect(0, 0, w, h);
  let current = solid;
  for (let i = 0; i < passes; i += 1) {
    const small = makeCanvas(Math.max(8, w / 2.6), Math.max(8, h / 2.6));
    ctxOf(small).drawImage(current, 0, 0, small.width, small.height);
    const back = makeCanvas(w, h);
    ctxOf(back).drawImage(small, 0, 0, w, h);
    current = back;
  }
  return current;
}

/* ---------- page ---------- */

export interface ComposeOptions {
  width: number;
  height: number;
  images: BookImages;
  /** Build the separate pop-up layers as well as the flat page. */
  layered: boolean;
  /**
   * The page's pictures have not all arrived. A page that carries its own words (selfCaptioned) is drawn by its own scene
   * with its photographs left out; any other page as paper with its words (roughPage).
   */
  rough?: boolean;
}

/**
 * A picture page drawn before its pictures have arrived (the home stage's book, opened on a slow line): its giant word
 * and its words on its own colours, with the place its picture will take left clear. Its scene would draw nothing
 * without its pictures, and a poster prints nothing over its picture, so it is laid out as a cut-out page instead.
 */
const roughPage = (page: FlipPage): FlipPage => ({
  ...page,
  live: undefined,
  layout: page.layout === 'poster' ? 'paper' : page.layout,
  ...(page.tone ? { panelColor: page.tone.deep, panelInk: page.tone.pale, panelMuted: page.tone.chromeMuted, panelAccent: page.tone.mid, wordColor: page.tone.pale } : {}),
});

export function composePage(book: FlipBook, index: number, opts: ComposeOptions): PageLayers {
  const page = opts.rough && !book.pages[index].selfCaptioned ? roughPage(book.pages[index]) : book.pages[index];
  const theme = book.theme;
  const W = Math.round(opts.width);
  const H = Math.round(opts.height);
  const layout = computeLayout(page, index, W, H);
  const { unit } = layout;
  const artImg = opts.images.get(page.art.src);
  const matteImg = page.art.matte ? opts.images.get(page.art.matte) : undefined;
  const focus = (layout.portrait ? page.portrait?.focus : undefined) ?? page.art.focus
    ?? (layout.portrait && layout.kind === 'split' ? [0.5, 0.42] as [number, number] : [0.5, 0.5] as [number, number]);
  const placement = artImg ? placeImage(artImg.naturalWidth, artImg.naturalHeight, layout.place, layout.artFit, focus) : null;
  const isCutout = Boolean(page.art.cutout);

  // base: the printed sheet
  const base = makeCanvas(W, H);
  const b = ctxOf(base);
  b.fillStyle = theme.paper;
  b.fillRect(0, 0, W, H);
  if (layout.panel) {
    b.fillStyle = page.panelColor ?? (layout.kind === 'poster' && page.tone ? page.tone.deep : theme.panel);
    b.fillRect(layout.panel.x, layout.panel.y, layout.panel.w, layout.panel.h);
    addGrain(b, layout.panel, 0.16);
  }
  if (artImg && placement && layout.window) {
    b.save();
    b.beginPath();
    b.rect(layout.window.x, layout.window.y, layout.window.w, layout.window.h);
    b.clip();
    drawPlaced(b, artImg, placement);
    b.restore();
  }
  if (isCutout && placement) {
    // contact shadow where the diorama stands on the sheet
    const cx = placement.dx + placement.dw / 2;
    const cy = placement.dy + placement.dh * 0.965;
    const grad = b.createRadialGradient(cx, cy, 0, cx, cy, placement.dw * 0.56);
    grad.addColorStop(0, 'rgba(20,24,40,0.26)');
    grad.addColorStop(1, 'rgba(20,24,40,0)');
    b.save();
    b.translate(cx, cy);
    b.scale(1, 0.13);
    b.translate(-cx, -cy);
    b.fillStyle = grad;
    b.fillRect(cx - placement.dw, cy - placement.dw, placement.dw * 2, placement.dw * 2);
    b.restore();
  }

  let cta: Rect | null = null;
  let overflow = false;
  const panelColors: TextColors = {
    ink: page.panelInk ?? theme.panelInk,
    muted: page.panelMuted ?? theme.panelMuted,
    accent: page.panelAccent ?? theme.panelAccent,
  };
  const panelSizes = layout.portrait ? PORTRAIT_SIZES : PANEL_SIZES;
  if (layout.kind === 'poster') {
    // nothing is printed over a poster: its caption is real text set under the sheet
  } else if (!layout.card) {
    if (layout.foot) {
      // kicker and title on the left, body on the right, centred in the band
      const left: Rect = { x: layout.text.x, y: 0, w: layout.text.w * 0.47, h: 0 };
      const right: Rect = { x: layout.text.x + layout.text.w * 0.54, y: 0, w: layout.text.w * 0.46, h: 0 };
      const head = { ...page, body: undefined, stats: undefined, steps: undefined, note: undefined, cta: undefined };
      const leftH = drawCaption(b, head, theme, panelColors, left, unit, false, false, CARD_SIZES).height;
      drawCaption(b, head, theme, panelColors, { ...left, y: layout.text.y + (layout.text.h - leftH) / 2 - unit * 0.3 }, unit, false, true, CARD_SIZES);
      if (page.body) {
        const bodySize = unit * 1.06;
        b.save();
        b.font = `450 ${bodySize}px ${theme.textFont}`;
        setTracking(b, 0);
        b.fillStyle = panelColors.muted;
        b.textBaseline = 'alphabetic';
        const lines = wrapLines(b, page.body, right.w);
        const blockH = lines.length * bodySize * 1.42;
        lines.forEach((line, i) => b.fillText(line, right.x, layout.text.y + (layout.text.h - blockH) / 2 + (i + 0.82) * bodySize * 1.42));
        b.restore();
      }
    } else if (layout.kind === 'band') {
      const head = drawCaption(b, { ...page, steps: undefined }, theme, panelColors, { ...layout.text, w: layout.text.w }, unit, layout.portrait, true, layout.portrait ? PORTRAIT_SIZES : CARD_SIZES);
      const gap = unit * (layout.portrait ? 0.8 : 1.1);
      const stepsHeight = drawSteps(b, page, theme, { x: layout.text.x, y: layout.text.y + head.height + gap, w: layout.text.w, h: 0 }, unit, layout.portrait);
      overflow = head.height + gap + stepsHeight > layout.text.h + 2;
    } else {
      const measured = drawCaption(b, page, theme, panelColors, layout.text, unit, layout.portrait, false, panelSizes);
      overflow = measured.height > layout.text.h + 2;
      // sit the text low in its column so it is anchored to the page foot
      const drop = layout.portrait ? 0 : Math.max(0, layout.text.h - measured.height);
      cta = drawCaption(b, page, theme, panelColors, { ...layout.text, y: layout.text.y + drop }, unit, layout.portrait, true, panelSizes).cta;
    }
  }

  // word: floats above the sheet
  const word = makeCanvas(W, H);
  if (layout.kind !== 'poster') drawWord(ctxOf(word), page, theme, layout, opts.images);
  const tinted = Boolean(layout.kind !== 'poster' && layout.window && layout.panel && !page.wordImage);
  let wordLayer = word;
  if (opts.layered && tinted) {
    wordLayer = makeCanvas(W, H);
    drawWord(ctxOf(wordLayer), page, theme, layout, opts.images, '#ffffff');
  }

  // fg: the cut-out and, on full-picture pages, the caption card
  let fg: HTMLCanvasElement | null = null;
  const hasCutout = Boolean(artImg && placement && (isCutout || (matteImg && layout.window)));
  if (hasCutout || layout.card) {
    fg = makeCanvas(W, H);
    const f = ctxOf(fg);
    if (artImg && placement && isCutout) {
      drawPlaced(f, artImg, placement);
    } else if (artImg && placement && matteImg && layout.window) {
      // cut the subjects out of the same picture; on banded pages they are
      // allowed to rise above the frame, so only the sides and foot are clipped
      const cut = makeCanvas(W, H);
      const c = ctxOf(cut);
      c.save();
      c.beginPath();
      c.rect(layout.window.x, layout.window.y, layout.window.w, layout.window.h);
      if (layout.breakout) {
        const [from, to] = page.breakoutX ?? [0, 1];
        c.rect(layout.window.x + layout.window.w * from, 0, layout.window.w * (to - from), layout.window.y + 1);
      }
      c.clip();
      drawPlaced(c, artImg, placement);
      c.globalCompositeOperation = 'destination-in';
      const sxScale = matteImg.naturalWidth / artImg.naturalWidth;
      const syScale = matteImg.naturalHeight / artImg.naturalHeight;
      c.drawImage(matteImg, placement.sx * sxScale, placement.sy * syScale, placement.sw * sxScale, placement.sh * syScale, placement.dx, placement.dy, placement.dw, placement.dh);
      if (layout.breakout) {
        // soften anything the picture's own top edge would slice through
        const fade = c.createLinearGradient(0, placement.dy, 0, placement.dy + H * 0.035);
        fade.addColorStop(0, 'rgba(0,0,0,0)');
        fade.addColorStop(1, 'rgba(0,0,0,1)');
        c.fillStyle = fade;
        c.fillRect(0, 0, W, H);
      }
      c.restore();
      f.drawImage(cut, 0, 0);
    }
    if (layout.card) {
      const pad = unit * 1.5;
      const cardW = layout.text.w;
      const inner: Rect = { x: 0, y: 0, w: cardW - pad * 2, h: 0 };
      const cardColors: TextColors = { ink: theme.cardInk, muted: theme.cardMuted, accent: theme.cardAccent };
      const measured = drawCaption(f, page, theme, cardColors, inner, unit, false, false, CARD_SIZES);
      const cardH = measured.height + pad * 2 - unit * 0.2;
      const margin = W * 0.036;
      const card: Rect = {
        x: layout.card.endsWith('l') ? margin : W - margin - cardW,
        y: layout.card.startsWith('t') ? margin : H - margin - cardH,
        w: cardW,
        h: cardH,
      };
      f.fillStyle = theme.card;
      roundedRect(f, card, unit * 0.95);
      f.fill();
      f.save();
      roundedRect(f, card, unit * 0.95);
      f.clip();
      addGrain(f, card, 0.14);
      f.restore();
      cta = drawCaption(f, page, theme, cardColors, { x: card.x + pad, y: card.y + pad - unit * 0.45, w: inner.w, h: 0 }, unit, false, true, CARD_SIZES).cta;
    }
  }

  // flat: everything pressed together, with the shadows the layers would cast
  const flat = makeCanvas(W, H);
  const fl = ctxOf(flat);
  const scene = layout.portrait ? null : liveSceneFor(page);
  if (scene) {
    // a live page pressed flat is one resting frame of its own scene
    try {
      const still = scene.create(opts.images, W, H);
      still.frame({ dt: 0, pointer: null, turn: 0, turnVel: 0, onTop: false, reduced: true });
      still.flatten(flat);
      still.dispose();
      return { width: W, height: H, flat, base: null, word: null, fg: null, shadow: null, fgCenter: [0.5, 0.5], overflow: false, wordTint: null, fgClip: null, cta: null };
    } catch {
      // fall through to the still picture
    }
  }
  fl.drawImage(base, 0, 0);
  const sw = Math.round(W / 4);
  const sh = Math.round(H / 4);
  const wordShadow = softSilhouette(word, '#000', sw, sh, 2);
  const fgShadow = fg ? softSilhouette(fg, '#000', sw, sh, 2) : null;
  fl.save();
  fl.globalAlpha = 0.26;
  fl.drawImage(wordShadow, W * 0.004, W * 0.006, W, H);
  fl.restore();
  fl.drawImage(word, 0, 0);
  if (fg && fgShadow) {
    fl.save();
    fl.globalAlpha = 0.34;
    fl.drawImage(fgShadow, W * 0.006, W * 0.009, W, H);
    fl.restore();
    fl.drawImage(fg, 0, 0);
  }

  let shadow: HTMLCanvasElement | null = null;
  if (opts.layered) {
    shadow = makeCanvas(sw, sh);
    const s = ctxOf(shadow);
    s.fillStyle = '#000';
    s.fillRect(0, 0, sw, sh);
    s.globalCompositeOperation = 'lighter';
    if (fg) s.drawImage(softSilhouette(fg, '#f00', sw, sh, 2), 0, 0);
    s.drawImage(softSilhouette(word, '#0f0', sw, sh, 2), 0, 0);
  }

  const artCenter: [number, number] = [
    (layout.place.x + layout.place.w / 2) / W,
    1 - (layout.place.y + layout.place.h / 2) / H,
  ];

  return {
    width: W,
    height: H,
    flat,
    base: opts.layered ? base : null,
    word: opts.layered ? wordLayer : null,
    wordTint: tinted && layout.window ? {
      panel: page.wordColor ?? theme.wordOnPanel,
      art: theme.wordOnArt,
      frame: [layout.window.x / W, 1 - (layout.window.y + layout.window.h) / H, (layout.window.x + layout.window.w) / W, 1 - layout.window.y / H],
    } : null,
    fg: opts.layered ? fg : null,
    shadow,
    fgCenter: artCenter,
    overflow,
    fgClip: layout.window && matteImg && !isCutout
      ? [layout.window.x / W, 1 - (layout.window.y + layout.window.h) / H, (layout.window.x + layout.window.w) / W]
      : null,
    cta: cta && page.cta ? { u0: cta.x / W, u1: (cta.x + cta.w) / W, v0: 1 - (cta.y + cta.h) / H, v1: 1 - cta.y / H, href: page.cta.href } : null,
  };
}

/**
 * The reverse of a leaf, drawn as the reader sees it once the leaf has turned:
 * the spine is on the right, so the strip that stays in view carries the name
 * of the chapter just left.
 */
export function composeBack(book: FlipBook, index: number, width: number, height: number): HTMLCanvasElement {
  const page = book.pages[index];
  const theme = book.theme;
  const W = Math.round(width);
  const H = Math.round(height);
  const canvas = makeCanvas(W, H);
  const ctx = ctxOf(canvas);
  const backFill = page.tone?.deep ?? theme.back;
  const backInk = page.tone?.pale ?? theme.backInk;
  ctx.fillStyle = backFill;
  ctx.fillRect(0, 0, W, H);
  addGrain(ctx, { x: 0, y: 0, w: W, h: H }, 0.18);

  if (book.plainBack) return canvas;

  const text = applyCase(page.word, theme.wordCase);
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = backInk;
  ctx.textBaseline = 'alphabetic';
  const probe = 200;
  ctx.font = `${theme.displayWeight} ${probe}px ${theme.displayFont}`;
  setTracking(ctx, probe * theme.displayTracking);
  const metrics = ctx.measureText(text);
  const inkW = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
  const size = probe * Math.min((W * 0.8) / inkW, (H * 0.42) / (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent));
  ctx.font = `${theme.displayWeight} ${size}px ${theme.displayFont}`;
  setTracking(ctx, size * theme.displayTracking);
  ctx.fillText(text, W * 0.07, H * 0.62);
  ctx.restore();

  // running label beside the spine, read bottom to top
  const label = `${page.kicker}`.toUpperCase();
  const labelSize = (H > W ? W : H) * 0.034;
  ctx.save();
  ctx.translate(W - labelSize * 2.1, H * 0.93);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = backInk;
  ctx.font = `650 ${labelSize}px ${theme.textFont}`;
  setTracking(ctx, labelSize * 0.14);
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0);
  ctx.restore();
  return canvas;
}
