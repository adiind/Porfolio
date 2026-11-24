/**
 * What is in the Snapdeal parcel besides the invoice: a folded T-shirt with a hang tag, a box of earphones and a
 * shoebox (Adi, 2026-11-20: "its common to get clothes and shoes and small electroincs from there"). Every surface is
 * drawn on a canvas. Each thing carries one of his Snapdeal stories, in the words already on the site
 * (public/data/snapdeal-story.json): the tag has the seller ads work, the earphones box the 14%, the shoebox's stock
 * label the warehousing. The products themselves are plain, unbranded things; nothing here claims to be a real product.
 */
import snapdealStory from '../../../public/data/snapdeal-story.json';
import { seeded } from './mailerArt';
import { PAGE, type FeatureWords } from './pageWords';

/** Sizes on the mat, in table units (one closed book is 1 unit). */
/**
 * Real sizes, in table units. The courier bag is about 30 by 38 cm and lies on the mat at 0.8 by 1.01, so one unit is
 * about 38 cm, and everything else is set from what it measures in life: a T-shirt folded the way a shop folds it is
 * about 23 by 30 cm and 2 to 3 cm thick.
 */
export const TEE = { w: 0.6, h: 0.782, thick: 0.06 } as const;
/** The same shirt unfolded: it comes out folded (TEE is its folded size) and opens out to this on the mat. */
export const SHIRT = { w: 0.8, h: 0.84, thick: 0.012 } as const;
/** A hang tag, about 5 by 9 cm. */
export const TAG = { w: 0.22, h: 0.44 } as const;
/** The tag's picture: its width in px and where its string hole is, from the top. */
export const TAG_PX = { w: 880, hole: 80 } as const;
/** The stock box (navy card, a watch on a cushion inside as first-party stock; the brand is not the point), about 11 by 11 by 4.5 cm. */
export const PHONES = { w: 0.28, h: 0.28, tall: 0.12 } as const;
export const SHOEBOX = { w: 0.62, h: 0.36, tall: 0.16, lid: 0.055 } as const;

const SANS = "'FB Geist', system-ui, sans-serif";
const DISPLAY = "'FB Bricolage', 'FB Geist', system-ui, sans-serif";
const INK = '#15171c', SOFT = '#5d6068', RED = '#d51f34';
const story = (id: string) => snapdealStory.find((card) => card.id === id)!;

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cv = document.createElement('canvas'); cv.width = Math.round(w); cv.height = Math.round(h);
  const c = cv.getContext('2d'); if (!c) throw new Error('Canvas is unavailable');
  return [cv, c];
}
function wrap(c: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = []; let line = '';
  for (const word of text.split(' ')) { const next = line ? `${line} ${word}` : word; if (line && c.measureText(next).width > width) { out.push(line); line = word; } else line = next; }
  if (line) out.push(line); return out;
}
/** A title, then the story's lines, set to fill a box: returns where the text ended. */
function words(c: CanvasRenderingContext2D, card: { title: string; lines: string[] }, x: number, y: number, width: number, title: number, body: number, red?: RegExp): number {
  c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = INK; c.font = `800 ${title}px ${DISPLAY}`;
  wrap(c, card.title, width).forEach((line) => { y += title * 1.04; c.fillText(line, x, y); });
  y += body * 0.5; c.font = `400 ${body}px ${SANS}`;
  wrap(c, card.lines.join(' '), width).forEach((line) => { y += body * 1.26; c.fillStyle = red && red.test(line) ? RED : INK; c.fillText(line, x, y); });
  return y;
}
function specks(c: CanvasRenderingContext2D, rnd: () => number, w: number, h: number, count: number, dark: string, light: string) {
  for (let i = 0; i < count; i++) { c.fillStyle = rnd() < 0.5 ? dark : light; c.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
}

/** Brown box card: its fibres, flecks and the faint ribs of the corrugation under the paper. */
export function drawKraft(w = 512, h = 512, seed = 31): HTMLCanvasElement {
  const [cv, c] = canvas(w, h); const rnd = seeded(seed);
  c.fillStyle = '#c69a62'; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 9) { c.fillStyle = 'rgba(92,58,22,.05)'; c.fillRect(x, 0, 3, h); c.fillStyle = 'rgba(255,236,204,.05)'; c.fillRect(x + 4, 0, 2, h); }
  for (let i = 0; i < w * h / 260; i++) {
    const x = rnd() * w, y = rnd() * h, len = 5 + rnd() * 22, a = (rnd() - 0.5) * 0.6;
    c.strokeStyle = rnd() < 0.55 ? `rgba(82,50,18,${0.05 + rnd() * 0.1})` : `rgba(255,238,208,${0.06 + rnd() * 0.1})`; c.lineWidth = 0.8 + rnd();
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
  }
  specks(c, rnd, w, h, w * h / 420, 'rgba(70,42,14,.2)', 'rgba(255,240,214,.2)');
  return cv;
}

/**
 * A box face in brown card that has been handled: the card and its fibres, its edges crushed paler where they were
 * knocked, a few dents and scuffs. Each face is drawn on its own canvas (box faces each read the whole picture).
 */
export function drawKraftFace(w = 512, h = 256, seed = 41): HTMLCanvasElement {
  const cv = drawKraft(w, h, seed); const c = cv.getContext('2d')!; const rnd = seeded(seed + 7);
  wornEdges(c, rnd, w, h, 'rgba(255,232,196,', 'rgba(70,42,14,');
  for (let i = 0; i < 5; i++) {     // dents: a short dark crease with a pale lip
    const x = rnd() * w, y = rnd() * h, len = 14 + rnd() * 40, a = rnd() * Math.PI;
    c.lineCap = 'round'; c.strokeStyle = 'rgba(70,42,14,.2)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 4, y + Math.sin(a) * len * 0.5 + 4, x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
    c.strokeStyle = 'rgba(255,236,204,.22)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x - 2, y - 2); c.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 2, y + Math.sin(a) * len * 0.5 + 2, x + Math.cos(a) * len - 2, y + Math.sin(a) * len - 2); c.stroke();
  }
  return cv;
}

/** Edges that have been knocked: a thin uneven pale band right at the edge, a shade just inside it. */
function wornEdges(c: CanvasRenderingContext2D, rnd: () => number, w: number, h: number, light: string, dark: string) {
  const along = (len: number, put: (t: number, d: number) => [number, number]) => {
    for (let t = 0; t < len; t += 3) {
      const d = 2 + Math.abs(Math.sin(t * 0.05 + rnd() * 0.6)) * 4 + rnd() * 2;
      const [x, y] = put(t, d);
      c.fillStyle = `${light}${0.16 + rnd() * 0.18})`; c.fillRect(x, y, 3, 3);
    }
  };
  along(w, (t, d) => [t, rnd() * d]); along(w, (t, d) => [t, h - 3 - rnd() * d]);
  along(h, (t, d) => [rnd() * d, t]); along(h, (t, d) => [w - 3 - rnd() * d, t]);
  c.strokeStyle = `${dark}.12)`; c.lineWidth = 5; c.strokeRect(9, 9, w - 18, h - 18);
}

/** Smooth printed card, for the sides of the earphones box. */
export function drawCard(colour = '#efece4'): HTMLCanvasElement {
  const [cv, c] = canvas(128, 128); const rnd = seeded(8);
  c.fillStyle = colour; c.fillRect(0, 0, 128, 128); specks(c, rnd, 128, 128, 240, 'rgba(0,0,0,.03)', 'rgba(255,255,255,.3)');
  return cv;
}

/** A white card face, a little larger, with its edges softly rubbed grey from handling. */
export function drawCardFace(w = 256, h = 128, seed = 12, colour = '#efece4'): HTMLCanvasElement {
  const [cv, c] = canvas(w, h); const rnd = seeded(seed);
  c.fillStyle = colour; c.fillRect(0, 0, w, h); specks(c, rnd, w, h, w * h / 60, 'rgba(0,0,0,.035)', 'rgba(255,255,255,.4)');
  wornEdges(c, rnd, w, h, 'rgba(255,255,255,', 'rgba(0,0,0,');
  for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(0,0,0,.025)'; c.beginPath(); c.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 40, 8 + rnd() * 14, rnd() * 3, 0, Math.PI * 2); c.fill(); }
  return cv;
}

/** The folded shirt's picture: 900 px wide; where its parts sit on it (the 3D shape is made to match, mailerLayer.ts). */
export const FOLDED_PX = { w: 900, h: Math.round(900 * TEE.h / TEE.w), neck: { x: 450, y: 125, rx: 205, ry: 95, hx: 158, hy: 62, hdy: 10 }, sleeve: { top: 170, bottom: 520, x0: 250, x1: 272, y0: 110, y1: 575 }, hem: 100 } as const;

/** One soft fold drawn into cloth: a band of shade on one side, a band of light on the other, three passes each so it has no hard edge. */
function clothFold(c: CanvasRenderingContext2D, pts: Array<[number, number]>, wide: number, deep: number, lightSide: number) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  const run = (off: number, rgb: string, a: number) => {
    [[1.6, 0.25], [1, 0.4], [0.45, 0.7]].forEach(([w, k]) => {
      c.strokeStyle = `rgba(${rgb},${a * k})`; c.lineWidth = wide * w;
      c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x + off, y + off * 0.6) : c.moveTo(x + off, y + off * 0.6))); c.stroke();
    });
  };
  run(wide * 0.45 * -lightSide, '4,22,12', deep);
  run(wide * 0.45 * lightSide, '190,255,220', deep * 0.42);
}

/**
 * The team T-shirt folded the way a shop folds it, seen from above, drawn and shaded the way the bag's film is: the
 * knit and its dye; the team print on the chest (the Snapdeal mark and word, cut from his own ID card photo, and DATA
 * SCIENCE TEAM), screen-printed so the knit shows through it; then the light and shade laid over everything, print
 * included, so the print sits in the cloth: the window's light across it, the soft folds where the sleeves turn in,
 * the shade under the collar and along the fold at the foot, and the cloth darkening where it rolls over its edges.
 */
export function drawTee(mark: HTMLImageElement, word: HTMLImageElement): HTMLCanvasElement {
  const { w: W, h: H, neck: N, sleeve: SL, hem } = FOLDED_PX;
  const [cv, c] = canvas(W, H); const rnd = seeded(612);
  c.beginPath(); c.roundRect(0, 0, W, H, 40); c.clip();
  c.fillStyle = '#2e7052'; c.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 4) { c.fillStyle = 'rgba(0,26,14,.1)'; c.fillRect(x, 0, 1.5, H); c.fillStyle = 'rgba(190,255,224,.05)'; c.fillRect(x + 2, 0, 1, H); }
  for (let i = 0; i < 30; i++) { const x = rnd() * W, y = rnd() * H, r = 90 + rnd() * 240; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rnd() < 0.5 ? 'rgba(170,255,214,.05)' : 'rgba(0,30,16,.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  specks(c, rnd, W, H, 7000, 'rgba(0,24,12,.14)', 'rgba(196,255,226,.09)');
  // the sleeves turned in over the chest: their hems, stitched, along the inner edges
  const sx = (x: number, side: number) => (side > 0 ? x : W - x);
  [1, -1].forEach((side) => {
    c.strokeStyle = 'rgba(0,22,10,.35)'; c.lineWidth = 2.5; c.setLineDash([10, 7]);
    c.beginPath(); c.moveTo(sx(SL.x1 - 16, side), SL.bottom - 20); c.lineTo(sx(14, side), SL.y1 - 22); c.stroke(); c.setLineDash([]);
  });
  // the collar: the inside of the back neck and its label, then the ribbed band
  c.fillStyle = '#1b4a35'; c.beginPath(); c.ellipse(N.x, N.y + N.hdy, N.hx, N.hy, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#efe8d6'; c.beginPath(); c.roundRect(N.x - 40, N.y - 36, 80, 34, 4); c.fill();
  c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(N.x - 30, N.y - 26, 60, 3); c.fillRect(N.x - 22, N.y - 18, 44, 3);
  c.save(); c.beginPath(); c.ellipse(N.x, N.y, N.rx, N.ry, 0, 0, Math.PI * 2); c.ellipse(N.x, N.y + N.hdy, N.hx, N.hy, 0, 0, Math.PI * 2); c.clip('evenodd');
  c.fillStyle = '#2a6a4d'; c.fillRect(0, 0, W, 300);
  for (let a = 0; a < Math.PI * 2; a += 0.045) { c.strokeStyle = 'rgba(0,20,10,.3)'; c.lineWidth = 2; c.beginPath(); c.moveTo(N.x + Math.cos(a) * N.hx * 0.98, N.y + N.hdy + Math.sin(a) * N.hy * 0.98); c.lineTo(N.x + Math.cos(a) * N.rx * 1.01, N.y + Math.sin(a) * N.ry * 1.01); c.stroke(); }
  c.restore();
  // the team print, screen-printed: the knit shows through the ink, and it is a little worn
  const print = document.createElement('canvas'); print.width = W; print.height = H; const p = print.getContext('2d')!;
  const wordW = 250, wordH = wordW * word.height / word.width, markH = wordH * 1.06, markW = markH * mark.width / mark.height;
  const lw = markW + 12 + wordW, lx = (W - lw) / 2, ly = 540;
  p.drawImage(mark, lx, ly, markW, markH);
  p.globalCompositeOperation = 'source-in'; p.fillStyle = '#e8283b'; p.fillRect(lx - 2, ly - 2, markW + 4, markH + 4); p.globalCompositeOperation = 'source-over';
  p.drawImage(word, lx + markW + 12, ly + (markH - wordH) / 2 + 3, wordW, wordH);
  p.fillStyle = '#f1efe8'; p.textBaseline = 'alphabetic';
  const spaced = (text: string, y: number, size: number, gap: number) => {
    p.font = `800 ${size}px ${DISPLAY}`; const ws = [...text].map((ch) => p.measureText(ch).width); const all = ws.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
    let x = W / 2 - all / 2; [...text].forEach((ch, i) => { p.fillText(ch, x, y); x += ws[i] + gap; });
  };
  spaced('DATA SCIENCE', 700, 40, 5); spaced('TEAM', 752, 40, 12);
  p.fillStyle = '#e8283b'; p.fillRect(W / 2 - 70, 774, 140, 6);
  p.globalCompositeOperation = 'destination-out';
  for (let x = 0; x < W; x += 4) { p.fillStyle = 'rgba(0,0,0,.2)'; p.fillRect(x, 0, 1.5, H); }
  for (let i = 0; i < 1600; i++) { p.fillStyle = `rgba(0,0,0,${0.3 + rnd() * 0.5})`; p.fillRect(300 + rnd() * 300, 520 + rnd() * 280, 1.5 + rnd() * 2, 1.5 + rnd() * 2); }
  p.globalCompositeOperation = 'source-over';
  c.drawImage(print, 0, 0);
  // light and shade over everything, print included
  const sun = c.createLinearGradient(W, 0, 0, H); sun.addColorStop(0, 'rgba(210,255,230,.1)'); sun.addColorStop(0.55, 'rgba(0,0,0,0)'); sun.addColorStop(1, 'rgba(0,20,10,.16)');
  c.fillStyle = sun; c.fillRect(0, 0, W, H);
  [1, -1].forEach((side) => {
    // where each sleeve turns in: a soft ridge down its inner edge, and the shade it throws on the chest
    clothFold(c, [[sx(SL.x0, side), SL.top], [sx((SL.x0 + SL.x1) / 2, side), (SL.top + SL.bottom) / 2], [sx(SL.x1, side), SL.bottom]], 26, 0.32, side);
    clothFold(c, [[sx(SL.x1, side), SL.bottom], [sx(140, side), SL.bottom + 28], [sx(10, side), SL.y1]], 22, 0.26, 1);
    // a loose wrinkle or two in each sleeve
    clothFold(c, [[sx(40, side), 230], [sx(150, side), 300], [sx(215, side), 330]], 14, 0.16, 1);
  });
  clothFold(c, [[300, 840], [450, 870], [620, 850]], 18, 0.14, 1);
  clothFold(c, [[330, 400], [420, 440], [520, 430]], 14, 0.1, 1);
  // the fold at the foot and the hem turned under it
  clothFold(c, [[40, H - hem], [W / 2, H - hem + 6], [W - 40, H - hem]], 24, 0.34, 1);
  // under the collar band, and the opening's depth
  c.strokeStyle = 'rgba(0,20,10,.28)'; c.lineWidth = 18; c.beginPath(); c.ellipse(N.x, N.y + 12, N.rx + 4, N.ry + 6, 0, 0.15, Math.PI - 0.15); c.stroke();
  c.strokeStyle = 'rgba(200,255,225,.14)'; c.lineWidth = 5; c.beginPath(); c.ellipse(N.x, N.y - 2, N.rx - 6, N.ry - 6, 0, Math.PI + 0.3, Math.PI * 2 - 0.3); c.stroke();
  // the cloth darkens where it rolls over its edges onto the mat
  const rim = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.66);
  rim.addColorStop(0, 'rgba(0,20,10,0)'); rim.addColorStop(1, 'rgba(0,20,10,.3)'); c.fillStyle = rim; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(0,18,8,.35)'; c.lineWidth = 26; c.strokeRect(0, 0, W, H);
  return cv;
}

/**
 * `tee-shade-crop.webp` is only the part of the 782 x 1021 shade photo that can reach the screen: the print's ink
 * (logo, DATA SCIENCE TEAM, the red bar) spans x 211..571, y 362..591 of the shirt, and the shade is multiplied and then
 * kept only where there is ink. The picture is that rectangle plus 4 px, laid back at the same pixels (1 to 1, no scaling).
 */
const TEE_SHADE_AT = { x: 207, y: 358 };

/**
 * The folded team T-shirt's surface: a photo of a plain folded green tee (made with an image tool: a generic shirt, not
 * one of Adi's own products; cut out by tools/cut-tee.py), with the team print laid into it. The print (the Snapdeal mark
 * and word, cut from his own ID card photo, and DATA SCIENCE TEAM) is darkened by the photo's own light and shade, so
 * the folds run through the ink, and the knit shows through it.
 */
export function drawTeePhoto(cut: HTMLImageElement, shade: HTMLImageElement, mark: HTMLImageElement, word: HTMLImageElement): HTMLCanvasElement {
  const W = cut.width, H = cut.height;
  const [cv, c] = canvas(W, H); const rnd = seeded(612);
  c.drawImage(cut, 0, 0);
  const print = document.createElement('canvas'); print.width = W; print.height = H; const p = print.getContext('2d')!;
  const wordW = W * 0.34, wordH = wordW * word.height / word.width, markH = wordH * 1.05, markW = markH * mark.width / mark.height;
  const lw = markW + W * 0.014 + wordW, lx = (W - lw) / 2, ly = H * 0.355;
  p.drawImage(mark, lx, ly, markW, markH);
  p.globalCompositeOperation = 'source-in'; p.fillStyle = '#e8283b'; p.fillRect(lx - 2, ly - 2, markW + 4, markH + 4); p.globalCompositeOperation = 'source-over';
  p.drawImage(word, lx + markW + W * 0.014, ly + (markH - wordH) / 2 + 2, wordW, wordH);
  p.fillStyle = '#f1efe8'; p.textBaseline = 'alphabetic';
  const size = Math.round(W * 0.05);
  const spaced = (text: string, y: number, gap: number) => {
    p.font = `800 ${size}px ${DISPLAY}`; const ws = [...text].map((ch) => p.measureText(ch).width); const all = ws.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
    let x = W / 2 - all / 2; [...text].forEach((ch, i) => { p.fillText(ch, x, y); x += ws[i] + gap; });
  };
  const ty = ly + markH + size * 1.9;
  spaced('DATA SCIENCE', ty, size * 0.14); spaced('TEAM', ty + size * 1.3, size * 0.36);
  p.fillStyle = '#e8283b'; p.fillRect(W / 2 - W * 0.09, ty + size * 1.75, W * 0.18, size * 0.16);
  // screen print: thin where the knit rises, a little worn
  p.globalCompositeOperation = 'destination-out';
  for (let x = 0; x < W; x += 3) { p.fillStyle = 'rgba(0,0,0,.1)'; p.fillRect(x, 0, 1, H); }
  for (let i = 0; i < 700; i++) { p.fillStyle = `rgba(0,0,0,${0.25 + rnd() * 0.5})`; p.fillRect(W * 0.28 + rnd() * W * 0.44, ly - 6 + rnd() * (ty + size * 2 - ly), 1 + rnd() * 2, 1 + rnd() * 2); }
  // the photo's light and shade over the ink, so it sits in the cloth (multiply also paints outside the ink, so the
  // ink's own shape is kept and the result trimmed back to it)
  p.globalCompositeOperation = 'source-over';
  const ink = document.createElement('canvas'); ink.width = W; ink.height = H; ink.getContext('2d')!.drawImage(print, 0, 0);
  // (at half strength: the folds still run through the ink, but white ink stays white, as screen print on cotton does)
  p.globalCompositeOperation = 'multiply'; p.globalAlpha = 0.55; p.drawImage(shade, TEE_SHADE_AT.x, TEE_SHADE_AT.y); p.globalAlpha = 1;
  p.globalCompositeOperation = 'destination-in'; p.drawImage(ink, 0, 0);
  p.globalCompositeOperation = 'source-over';
  c.drawImage(print, 0, 0);
  return cv;
}

/** Reads a grey picture (e.g. assets/tee-height.png) as a function of (u, v) in 0..1, v up, bilinear. */
export function greyLookup(image: HTMLImageElement): (u: number, v: number) => number {
  const [cv, c] = canvas(image.width, image.height); c.drawImage(image, 0, 0);
  const d = c.getImageData(0, 0, image.width, image.height).data; const N = image.width, M = image.height; void cv;
  const g = (x: number, y: number) => d[(y * N + x) * 4] / 255;
  return (u, v) => {
    const x = Math.min(N - 1, Math.max(0, u * (N - 1))), y = Math.min(M - 1, Math.max(0, (1 - v) * (M - 1)));
    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(N - 1, x0 + 1), y1 = Math.min(M - 1, y0 + 1), fx = x - x0, fy = y - y0;
    return (g(x0, y0) * (1 - fx) + g(x1, y0) * fx) * (1 - fy) + (g(x0, y1) * (1 - fx) + g(x1, y1) * fx) * fy;
  };
}

/** The tissue paper a pair of shoes is wrapped in: thin white sheet, its crinkles, and the light through it. */
export function drawTissue(): HTMLCanvasElement {
  const W = 768, H = Math.round(768 * 0.34 / 0.6);
  const [cv, c] = canvas(W, H); const rnd = seeded(77);
  c.fillStyle = '#f3f1ec'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    const x = rnd() * W, y = rnd() * H, len = 20 + rnd() * 90, a = rnd() * Math.PI;
    c.strokeStyle = rnd() < 0.5 ? `rgba(150,140,128,${0.06 + rnd() * 0.12})` : `rgba(255,255,255,${0.3 + rnd() * 0.4})`; c.lineWidth = 0.8 + rnd() * 1.6;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
  }
  specks(c, rnd, W, H, 1800, 'rgba(120,110,96,.05)', 'rgba(255,255,255,.6)');
  return cv;
}

/** A round red seal sticker with the Snapdeal mark, the kind that closes the tissue in a shoebox. */
export function drawSeal(mark: HTMLImageElement): HTMLCanvasElement {
  const [cv, c] = canvas(256, 256);
  c.fillStyle = '#e2283a'; c.beginPath(); c.arc(128, 128, 124, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 5; c.beginPath(); c.arc(128, 128, 104, 0, Math.PI * 2); c.stroke();
  const w = 120, h = w * mark.height / mark.width; c.drawImage(mark, 128 - w / 2, 128 - h / 2, w, h);
  return cv;
}

/** The black foam tray an earbuds case sits in. */
export function drawFoam(colour = '#26282d'): HTMLCanvasElement {
  const [cv, c] = canvas(256, 256); const rnd = seeded(5);
  c.fillStyle = colour; c.fillRect(0, 0, 256, 256); specks(c, rnd, 256, 256, 3500, 'rgba(0,0,0,.35)', 'rgba(255,255,255,.07)');
  return cv;
}


/** One feature card of the page, every word of it, laid down a column: title, role, text, pills, details, skills. */
function cardColumn(c: CanvasRenderingContext2D, f: FeatureWords, x: number, y: number, width: number, k: number) {
  const para = (text: string, px: number, yy: number, w: number, size: number, weight: number, colour: string, lead = 1.28, face = SANS) => {
    c.fillStyle = colour; c.font = `${weight} ${size}px ${face}`; c.textAlign = 'left';
    wrap(c, text, w).forEach((line) => { yy += size * lead; c.fillText(line, px, yy); }); return yy;
  };
  const label = (text: string, yy: number) => { c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(x, yy + 6 * k, width, 2 * k); if (text === 'SKILLS') { c.fillStyle = SOFT; c.font = `800 ${22 * k}px ${SANS}`; c.fillText(text, x, yy + 34 * k); return yy + 40 * k; } return yy + 14 * k; };
  y = para(f.title, x, y, width, 66 * k, 800, INK, 1.06, DISPLAY);
  y = para(f.subtitle, x, y + 6 * k, width, 36 * k, 800, RED, 1.2);
  y = para(f.text, x, y + 10 * k, width, 27 * k, 500, INK, 1.3);
  y = label('PILLS', y + 22 * k) ;
  f.pills.forEach((p) => { y = para(p.label, x, y, width, 30 * k, 800, INK, 1.15, DISPLAY); y = para(p.description, x, y - 4 * k, width, 24 * k, 500, SOFT, 1.26); y += 8 * k; });
  y = label('WHAT I DID', y + 10 * k);
  f.details.forEach((d) => { const top = y; y = para(d, x + 26 * k, y, width - 26 * k, 25 * k, 600, INK, 1.26); c.fillStyle = RED; c.fillRect(x, top + 8 * k, 12 * k, 12 * k); y += 6 * k; });
  y = label('SKILLS', y + 10 * k);
  f.skills.forEach((sk) => { y = para(sk.label, x, y, width, 28 * k, 800, INK, 1.15, DISPLAY); y = para(sk.description, x, y - 4 * k, width, 24 * k, 500, SOFT, 1.26); y += 6 * k; });
  return y;
}
/** The spec tag on the shirt: card with a punched hole, and every word of the page's seller-ads card on it. */
export function drawTag(): HTMLCanvasElement {
  const W = TAG_PX.w, H = Math.round(W * TAG.h / TAG.w), PAD = 56;
  const [cv, c] = canvas(W, H); const rnd = seeded(77);
  c.fillStyle = '#f6f0df'; c.beginPath(); c.roundRect(0, 0, W, H, 30); c.fill();
  c.save(); c.beginPath(); c.roundRect(0, 0, W, H, 30); c.clip(); specks(c, rnd, W, H, 5200, 'rgba(60,40,0,.04)', 'rgba(255,255,255,.45)');
  wornEdges(c, rnd, W, H, 'rgba(255,255,255,', 'rgba(60,40,0,'); c.restore();
  c.strokeStyle = 'rgba(60,40,0,.2)'; c.lineWidth = 9; c.beginPath(); c.arc(W / 2, TAG_PX.hole, 32, 0, Math.PI * 2); c.stroke();
  c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(W / 2, TAG_PX.hole, 24, 0, Math.PI * 2); c.fill(); c.globalCompositeOperation = 'source-over';
  c.textBaseline = 'alphabetic';
  cardColumn(c, PAGE.ads, PAD, 120, W - PAD * 2, 1);
  return cv;
}
/**
 * The lid of the stock box. The box is plain navy card with no brand on it: what it stands for is the first-party
 * warehousing he set up (Adi, 2026-11-23: "the watch thing is about building the warehousing infra, not about the watch
 * brand"), so the lid carries a label with every word of the page's warehousing card. Drawn in the usual order: card,
 * then label and print, then light and shade over all.
 */
export function drawPhonesTop(): HTMLCanvasElement {
  const W = 1280;
  const [cv, c] = canvas(W, W); const rnd = seeded(140);
  c.fillStyle = '#1d2a46'; c.fillRect(0, 0, W, W);
  for (let i = 0; i < 30000; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.04)'; c.fillRect(rnd() * W, rnd() * W, 2, 2); }
  wornEdges(c, rnd, W, W, 'rgba(255,255,255,', 'rgba(0,0,0,');
  const lx = 90, ly = 100, lw = W - 180, lh = W - 200;
  c.save(); c.translate(W / 2, W / 2); c.rotate(-0.01); c.translate(-W / 2, -W / 2);
  c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath(); c.roundRect(lx - 4, ly + 9, lw, lh, 10); c.fill();
  c.fillStyle = '#f7f5ee'; c.beginPath(); c.roundRect(lx, ly, lw, lh, 10); c.fill();
  c.save(); c.beginPath(); c.roundRect(lx, ly, lw, lh, 10); c.clip();
  specks(c, rnd, W, W, 6000, 'rgba(60,50,30,.05)', 'rgba(255,255,255,.5)');
  c.fillStyle = RED; c.fillRect(lx, ly, lw, 50);
  c.textBaseline = 'alphabetic';
  let bx = lx + 36; const by = ly + 90;
  c.fillStyle = INK; while (bx < lx + lw - 36) { const bar = 3 + Math.floor(rnd() * 3) * 2; c.fillRect(bx, by, bar, 36); bx += bar + 3 + Math.floor(rnd() * 3) * 2; }
  cardColumn(c, PAGE.warehouse, lx + 36, ly + 120, lw - 72, 0.95);
  c.restore(); c.restore();
  const sun = c.createLinearGradient(W, 0, 0, W); sun.addColorStop(0, 'rgba(255,255,255,.10)'); sun.addColorStop(0.5, 'rgba(0,0,0,0)'); sun.addColorStop(1, 'rgba(0,0,0,.18)');
  c.fillStyle = sun; c.fillRect(0, 0, W, W);
  return cv;
}

/** The shoebox's lid: brown card, a shoe printed on it in one ink, and the stock label with the warehousing story. */
export function drawShoeLid(): HTMLCanvasElement {
  const W = 992, H = Math.round(992 * SHOEBOX.h / SHOEBOX.w);
  const [cv, c] = canvas(W, H); const rnd = seeded(903);
  c.drawImage(drawKraft(W, H, 55), 0, 0);
  wornEdges(c, rnd, W, H, 'rgba(255,232,196,', 'rgba(70,42,14,');
  // the printed shoe: a plain trainer in side view, one dark ink, a little worn where the card is rough
  c.save(); c.translate(26, 96); c.strokeStyle = 'rgba(58,34,12,.82)'; c.lineWidth = 7; c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath(); c.moveTo(18, 268); c.lineTo(264, 268); c.quadraticCurveTo(280, 236, 254, 222); c.lineTo(178, 196); c.lineTo(138, 136);
  c.quadraticCurveTo(108, 118, 84, 138); c.lineTo(58, 158); c.quadraticCurveTo(22, 176, 20, 222); c.closePath(); c.stroke();
  c.beginPath(); c.roundRect(10, 268, 262, 26, 12); c.stroke();
  [0, 1, 2].forEach((i) => { c.beginPath(); c.moveTo(146 + i * 16, 156 + i * 20); c.lineTo(176 + i * 16, 146 + i * 20); c.stroke(); });
  c.restore();
  // the stock label
  const lx = 322, ly = 72, lw = 640, lh = H - 144;
  c.fillStyle = 'rgba(60,34,8,.3)'; c.beginPath(); c.roundRect(lx - 4, ly + 5, lw, lh, 6); c.fill();
  c.fillStyle = '#fbfaf4'; c.beginPath(); c.roundRect(lx, ly, lw, lh, 6); c.fill();
  c.fillStyle = SOFT; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.font = `650 24px ${SANS}`;
  c.fillText('SUPPLY', lx + 28, ly + 46);
  c.fillStyle = INK; let bx = lx + lw - 28 - 190;
  while (bx < lx + lw - 30) { const bar = 2 + Math.floor(rnd() * 3) * 2; c.fillRect(bx, ly + 22, bar, 30); bx += bar + 2 + Math.floor(rnd() * 3) * 2; }
  c.fillRect(lx + 28, ly + 64, lw - 56, 3);
  words(c, story('warehouse'), lx + 28, ly + 70, lw - 56, 45, 35);
  return cv;
}
