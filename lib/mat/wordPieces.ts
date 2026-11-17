/**
 * The home page's words laid on the mat (Adi, 2026-11-16, direction A: "name should be laid on mat"). Each block of words
 * is a thing lying on the mat, drawn once on a canvas in the page's own materials: the cards' cream paper and its cut
 * edge, navy ink, black for his name, the real Self logo. HeroOverlay keeps every word as real text for screen readers
 * and keyboards; these are what the eye sees.
 *
 * Sizes are in pixels of the 1440 by 900 drawing of the home page (data/matStage.json's frame). The stage is drawn
 * smaller on a narrower window, so `big` pieces (for windows under WORDS_BIG_BELOW wide) carry larger type: every word
 * stays readable at 1024 wide.
 */

export const PAPER = '#fbf6ea';
export const PAPER_EDGE = '#e3d9c0';
export const NAVY = '#18204f';
export const BLACK = '#0a0b10';
const SANS = "'FB Geist', Geist, system-ui, sans-serif";
const DISPLAY = "'FB Bricolage', 'FB Geist', system-ui, sans-serif";

/** Below this window width the stage is drawn at under 0.87 of its size: the words take larger type. */
export const WORDS_BIG_BELOW = 1250;

/** One piece: its picture and its size in page pixels. */
export interface WordPiece { image: HTMLCanvasElement; w: number; h: number }

type Ctx = CanvasRenderingContext2D;
/** canvas pixels per page pixel: sharp when the camera comes close */
const S = 3;

function canvasFor(w: number, h: number): [HTMLCanvasElement, Ctx | null] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * S);
  canvas.height = Math.round(h * S);
  const ctx = canvas.getContext('2d');
  ctx?.scale(S, S);
  return [canvas, ctx];
}

const spacing = (ctx: Ctx, px: number) => { (ctx as Ctx & { letterSpacing?: string }).letterSpacing = `${px}px`; };

function text(ctx: Ctx, s: string, x: number, y: number, font: string, color: string, track = 0, align: CanvasTextAlign = 'left') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  spacing(ctx, track);
  ctx.fillText(s, x, y);
  spacing(ctx, 0);
}

function measure(s: string, font: string, track = 0): number {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return s.length * 8;
  ctx.font = font;
  spacing(ctx, track);
  return ctx.measureText(s).width;
}

/** A seeded scatter, so the paper's tooth is the same on every visit (and in every capture). */
function tooth(ctx: Ctx, w: number, h: number, seed0 = 7) {
  let seed = seed0;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < w * h * 0.06; i += 1) {
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(120,100,60,.05)' : 'rgba(255,255,255,.18)';
    ctx.fillRect(rnd() * w, rnd() * h, 0.5, 0.5);
  }
}

/** Cream card paper: the fill, a touch brighter toward the window (top right), its tooth, the darker cut edge. */
function paper(ctx: Ctx, w: number, h: number, r: number, seed = 7) {
  ctx.save();
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, r); ctx.clip();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
  const light = ctx.createLinearGradient(w, 0, 0, h);
  light.addColorStop(0, 'rgba(255,255,255,.35)'); light.addColorStop(1, 'rgba(120,100,60,.06)');
  ctx.fillStyle = light; ctx.fillRect(0, 0, w, h);
  tooth(ctx, w, h, seed);
  ctx.restore();
  ctx.strokeStyle = PAPER_EDGE; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(0.5, 0.5, w - 1, h - 1, Math.max(0, r - 0.5)); ctx.stroke();
}

/** His name, at the top left, on a cream label: black, upright, never curvy. */
export function drawNameLabel(big = false): WordPiece {
  const size = big ? 25 : 20;
  const font = `800 ${size}px ${DISPLAY}`;
  const w = Math.ceil(measure('Adi Agarwal', font, -0.3) + size * 1.4); const h = Math.round(size * 1.9);
  const [canvas, ctx] = canvasFor(w, h);
  if (!ctx) return { image: canvas, w, h };
  paper(ctx, w, h, 5, 11);
  text(ctx, 'Adi Agarwal', size * 0.7, h / 2 + size * 0.36, font, BLACK, -0.3);
  return { image: canvas, w, h };
}

/** A short cream tab with one word in navy (the menu, LinkedIn, Timeline); an optional mark at its side. */
export function drawTab(word: string, opts: { big?: boolean; mark?: 'in' | 'down' } = {}): WordPiece {
  const size = opts.big ? 19 : 15;
  const font = `600 ${size}px ${SANS}`;
  const markW = opts.mark === 'in' ? size * 1.45 : opts.mark === 'down' ? size * 1.2 : 0;
  const pad = size;
  const w = Math.ceil(measure(word, font) + pad * 2 + markW); const h = Math.round(size * 2.27);
  const [canvas, ctx] = canvasFor(w, h);
  if (!ctx) return { image: canvas, w, h };
  paper(ctx, w, h, 6, 13 + word.length);
  let x = pad;
  if (opts.mark === 'in') {
    const box = size * 1.05;
    ctx.fillStyle = NAVY; ctx.beginPath(); ctx.roundRect(x - 2, h / 2 - box / 2, box, box, size * 0.2); ctx.fill();
    text(ctx, 'in', x - 2 + box / 2, h / 2 + size * 0.3, `800 ${size * 0.76}px ${SANS}`, PAPER, 0, 'center');
    x += markW;
  }
  text(ctx, word, x, h / 2 + size * 0.36, font, NAVY);
  if (opts.mark === 'down') {
    const ax = w - pad - size * 0.2; const ay = h / 2; const k = size / 15;
    ctx.strokeStyle = NAVY; ctx.lineWidth = 1.6 * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay - 5 * k); ctx.lineTo(ax, ay + 5 * k); ctx.moveTo(ax - 4 * k, ay + 1.5 * k); ctx.lineTo(ax, ay + 5.5 * k); ctx.lineTo(ax + 4 * k, ay + 1.5 * k); ctx.stroke();
  }
  return { image: canvas, w, h };
}

/** Where the greeting's letters sit in its picture: the size it is set at and its baseline, for the loading greeting's landing. */
export interface GreetingSet { w: number; h: number; size: number; baseline: number; left: number; textW: number; track: number }

/** The greeting's type: one place for the cut letters and for the loading greeting that lands on them. */
export const GREETING = { size: 84, track: -2, weight: 800 } as const;

/**
 * "Hi, I'm Adi." as thick card letters cut out and laid on the mat: "Hi, I'm" in the cream card, "Adi." in black card.
 * Each letter shows its cut edge a hair down and to the left, so it reads as card with a thickness. Its shadow follows
 * the letters (StageProp.alphaShadow).
 */
export function drawGreetingLetters(): WordPiece & { set: GreetingSet } {
  const { size, track, weight } = GREETING;
  const font = `${weight} ${size}px ${DISPLAY}`;
  const first = 'Hi, I’m ';
  const left = 6;
  const firstW = measure(first, font, track);
  const w = Math.ceil(left + firstW + measure('Adi.', font, track) + 10); const h = Math.round(size * 1.2);
  const baseline = Math.round(size * 0.95);
  const [canvas, ctx] = canvasFor(w, h);
  const set = { w, h, size, baseline, left, textW: firstW + measure('Adi.', font, track), track };
  if (!ctx) return { image: canvas, w, h, set };
  const cut = (s: string, at: number, face: string, edge: string) => {
    text(ctx, s, at - 0.9, baseline + 1.1, font, edge, track);
    text(ctx, s, at, baseline, font, face, track);
  };
  cut(first, left, PAPER, PAPER_EDGE);
  cut('Adi.', left + firstW, BLACK, '#000');
  return { image: canvas, w, h, set };
}

/** "I worked on agentic AI products at" and the real Self logo, on a cream strip. */
export function drawSelfStrip(logo: HTMLImageElement, big = false): WordPiece {
  // (a longer line now, "I worked on ...": a little smaller, so the strip ends before the Snapdeal poster)
  const size = big ? 21 : 18;
  const font = `500 ${size}px ${SANS}`;
  const words = 'I worked on agentic AI products at';
  const lw = size * 3.25; const lh = (lw * logo.naturalHeight) / Math.max(1, logo.naturalWidth);
  const ww = measure(words, font, -0.4);
  const w = Math.ceil(size * 0.75 + ww + size * 0.45 + lw + size * 0.6); const h = Math.round(size * 2.2);
  const [canvas, ctx] = canvasFor(w, h);
  if (!ctx) return { image: canvas, w, h };
  paper(ctx, w, h, 7, 17);
  text(ctx, words, size * 0.75, h / 2 + size * 0.36, font, NAVY, -0.4);
  ctx.drawImage(logo, size * 0.75 + ww + size * 0.45, h / 2 + size * 0.36 - lh * 0.8, lw, lh);
  return { image: canvas, w, h };
}

/** The three facts, as HeroOverlay has them: [when, what, where]. */
export const FACTS: ReadonlyArray<readonly [string, string, string]> = [
  ['2026', 'AI Product Manager intern, ', 'Self'],
  ['Now', 'M.S. Engineering Design Innovation, ', 'Northwestern'],
  ['Before', 'Senior Product Analyst, ', 'Zomato'],
];

/** The three facts on an index card: a navy head rule, faint ruled lines. `big`: larger type, the long line wraps. */
export function drawFactsCard(big = false): WordPiece {
  const size = big ? 18 : 14.5;
  const w = 440;
  const label = big ? 92 : 86;
  const rows = FACTS.map(([when, what, where]) => (
    big && measure(what + where, `450 ${size}px ${SANS}`) > w - label - 20 ? [[when, what.replace(/, $/, ','), ''], ['', '', where]] : [[when, what, where]]
  ));
  const step = big ? 30 : 33;
  const head = 16;
  const lines = rows.reduce((n, group) => n + group.length, 0);
  const h = head + lines * step + 12;
  const [canvas, ctx] = canvasFor(w, h);
  if (!ctx) return { image: canvas, w, h };
  paper(ctx, w, h, 8, 23);
  ctx.fillStyle = 'rgba(24,32,79,.55)'; ctx.fillRect(0, 11, w, 1.3);
  let n = 0;
  rows.forEach((group, gi) => {
    group.forEach(([when, what, where], li) => {
      const base = head + 23 + n * step;
      if (li === group.length - 1 && gi < rows.length - 1) { ctx.fillStyle = 'rgba(24,32,79,.13)'; ctx.fillRect(0, base + step * 0.36, w, 1); }
      if (when) text(ctx, when, 20, base, `600 ${size - 0.5}px ${SANS}`, 'rgba(24,32,79,.62)');
      const ww = what ? measure(what, `450 ${size}px ${SANS}`) : 0;
      if (what) text(ctx, what, label, base, `450 ${size}px ${SANS}`, NAVY);
      if (where) text(ctx, where, label + ww, base, `700 ${size}px ${SANS}`, NAVY);
      n += 1;
    });
  });
  return { image: canvas, w, h };
}

/** Where one piece lies: its top left corner in page pixels, its turn in degrees (clockwise). */
export interface WordPlace { x: number; y: number; turn: number }

/**
 * Where the words lie, laid out from their sizes so nothing ever overlaps: the photo (data/matStage.json's photo poster,
 * 91 to 278 across, 192 to 390 down) and the résumé beside it stay where they are; the name, the GitHub sticker and the menu
 * along the top; the greeting, the Self strip, the facts card, the tag and LinkedIn down the left column under the photo;
 * Timeline at the foot. Every place is in pixels of the 1440 by 900 drawing.
 */
export function layoutWords(size: Record<'name' | 'github' | 'work' | 'linkedin' | 'timeline' | 'hello' | 'say' | 'facts', { w: number; h: number }>, menu: Array<{ id: string; w: number; h: number }>): Record<string, WordPlace> {
  const top = 52;
  const at: Record<string, WordPlace> = {
    'word:name': { x: 60, y: top + 1, turn: -1.2 },
    'piece:github': { x: 720 - size.github.w / 2 - 74, y: top + 2, turn: -1.2 },
    'word:hello': { x: 54, y: 406, turn: -0.6 },
  };
  // the menu: right-aligned along the top, a little gap between tabs, each turned a hair differently
  let right = 1386;
  const turns = [1.1, -0.8, 1.4];
  [...menu].reverse().forEach((tab, i) => { at[tab.id] = { x: right - tab.w, y: top + 1, turn: turns[i % turns.length] }; right -= tab.w + 12; });
  const sayY = at['word:hello'].y + size.hello.h + 4;
  at['word:say'] = { x: 62, y: sayY, turn: 0.7 };
  const factsY = sayY + size.say.h + 22;
  at['word:facts'] = { x: 60, y: factsY, turn: 0.5 };
  const tagY = factsY + size.facts.h + 18;
  at['piece:work'] = { x: 62, y: tagY, turn: -1.2 };
  at['word:linkedin'] = { x: 62 + size.work.w + 22, y: tagY + (size.work.h - size.linkedin.h) / 2, turn: 1.6 };
  at['word:timeline'] = { x: 620 - size.timeline.w / 2, y: 900 - size.timeline.h - 26, turn: -0.6 };
  return at;
}
