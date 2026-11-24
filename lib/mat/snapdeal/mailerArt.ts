/**
 * The Snapdeal courier bag's surface, drawn on a canvas (nothing here is a photograph of a bag).
 *
 * The reference is the photo Adi sent on 2026-11-20: a glossy red plastic courier bag, the white box-in-a-hexagon mark
 * above the lowercase word, and a grey strip down the right side where the flap seals. The mark and the word are cut
 * from his own photo of his Snapdeal ID card (tools/cut-logo.py), so the print is the real logo.
 *
 * The shipping label carries what the old Snapdeal poster said: his title (data/timeline.ts), the years, and the 14%
 * (data/resume-2026.json).
 */
import snapdealStory from '../../../public/data/snapdeal-story.json';
import { PAGE } from './pageWords';

/** The bag lying on the mat, in table units (one closed book is 1 unit, about 224 px on the 1440 px drawing). */
export const MAILER = { w: 0.8, h: 1.01 } as const;
/** Where the grey sealing strip runs, as fractions of the width from the left. */
export const STRIP = { from: 0.878, to: 0.925 } as const;
export const RED = '#e2283a';

/** Where the tear runs: just inside the grey strip, so the whole sealed end comes off. */
export const TEAR_U = STRIP.from - 0.035;
/** The invoice that comes out of the bag, in table units. */
/** The invoice that comes out of the bag: a packing slip, about A5 (15 by 21 cm), in table units. */
export const INVOICE = { w: 0.39, h: 0.55 } as const;

const TEX = { w: 1024, h: 1292 } as const;
const SANS = "'FB Geist', system-ui, sans-serif";
const DISPLAY = "'FB Bricolage', 'FB Geist', system-ui, sans-serif";

/** The same numbers every time, so the creases never move between visits. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/**
 * One crease in the film: a soft curved band, light on the side turned to the window and deep on the other. Each band is
 * laid three times, wide and faint to narrow and firmer, so its edges are soft (no canvas blur: Safari has none).
 */
function crease(c: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, wide: number, strength: number, bend: number) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const nx = -dy, ny = dx;
  const x0 = x - dx * len / 2, y0 = y - dy * len / 2, x1 = x + dx * len / 2, y1 = y + dy * len / 2;
  const band = (off: number, rgb: string, a: number) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.35, `rgba(${rgb},${a})`); g.addColorStop(0.65, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.strokeStyle = g; c.lineCap = 'round';
    [[1, 0.3], [0.6, 0.45], [0.28, 0.7]].forEach(([w, k]) => {
      c.globalAlpha = k; c.lineWidth = wide * w;
      c.beginPath(); c.moveTo(x0 + nx * off, y0 + ny * off);
      c.quadraticCurveTo(x + nx * (off + bend), y + ny * (off + bend), x1 + nx * off, y1 + ny * off); c.stroke();
    });
    c.globalAlpha = 1;
  };
  band(-wide * 0.5, '255,196,190', strength);        // the side turned to the window
  band(wide * 0.5, '104,4,22', strength * 0.95);     // the side turned away
}

/**
 * Where a crease falls. On the real bag the film is smooth over the middle and wrinkles gather along the sealed edges
 * and in the corners, so most creases land near an edge and the few in the middle are faint.
 */
function spot(rnd: () => number): { x: number; y: number; k: number } {
  let u = rnd(), v = rnd();
  if (rnd() < 0.72) { const side = Math.floor(rnd() * 4); const near = rnd() * rnd() * 0.24; if (side === 0) u = near; else if (side === 1) u = 1 - near; else if (side === 2) v = near; else v = 1 - near; }
  const middle = Math.max(Math.abs(u - 0.46) / 0.36, Math.abs(v - 0.5) / 0.4);
  return { x: u * TEX.w, y: v * TEX.h, k: middle < 1 ? 0.28 + 0.5 * middle * middle : 1 };
}

function creases(c: CanvasRenderingContext2D, rnd: () => number, count: number, strength: number) {
  for (let i = 0; i < count; i++) {
    const { x, y, k } = spot(rnd);
    // courier film creases mostly along two slants, with a few strays
    const family = rnd();
    const ang = (family < 0.42 ? 0.62 : family < 0.8 ? -0.5 : rnd() * Math.PI) + (rnd() - 0.5) * 0.7;
    const len = 70 + rnd() * 330;
    crease(c, x, y, ang, len * (0.55 + 0.45 * k), 7 + rnd() * 15, strength * k * (0.4 + rnd() * 0.6), (rnd() - 0.5) * len * 0.22);
  }
}

/** The sharp little lights on the ridges of the film, where it catches the window. */
function glints(c: CanvasRenderingContext2D, rnd: () => number, count: number) {
  c.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const { x, y, k } = spot(rnd);
    if (k < 0.6 && rnd() < 0.6) continue;
    const ang = (rnd() < 0.55 ? 0.62 : -0.5) + (rnd() - 0.5) * 0.9;
    const len = 16 + rnd() * 70, bend = (rnd() - 0.5) * len * 0.3;
    const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
    const g = c.createLinearGradient(x - dx, y - dy, x + dx, y + dy);
    const a = 0.16 + rnd() * 0.3;
    g.addColorStop(0, 'rgba(255,226,222,0)'); g.addColorStop(0.5, `rgba(255,226,222,${a})`); g.addColorStop(1, 'rgba(255,226,222,0)');
    c.strokeStyle = g; c.lineWidth = 1.2 + rnd() * 1.8;
    c.beginPath(); c.moveTo(x - dx, y - dy); c.quadraticCurveTo(x - dy / len * bend * 2, y + dx / len * bend * 2, x + dx, y + dy); c.stroke();
  }
}

/** A plausible barcode: bars only, no number that could be read as a real parcel's. */
function barcode(c: CanvasRenderingContext2D, rnd: () => number, x: number, y: number, w: number, h: number) {
  c.fillStyle = '#15171c';
  let at = x;
  while (at < x + w) { const bar = 2 + Math.floor(rnd() * 4) * 2; if (at + bar > x + w) break; c.fillRect(at, y, bar, h); at += bar + 2 + Math.floor(rnd() * 3) * 2; }
}

/** The white shipping label: his title and years, the 14%, and what the 14% is of. */
function label(c: CanvasRenderingContext2D, rnd: () => number, x: number, y: number, w: number, h: number) {
  c.save();
  c.translate(x + w / 2, y + h / 2); c.rotate(-0.028); c.translate(-w / 2, -h / 2);
  // the sticker's own thin shadow on the film, then the paper
  c.fillStyle = 'rgba(96,4,20,.32)'; c.beginPath(); c.roundRect(-3, 4, w, h, 7); c.fill();
  c.fillStyle = '#fbfaf4'; c.beginPath(); c.roundRect(0, 0, w, h, 7); c.fill();
  const pad = w * 0.06;
  c.fillStyle = '#15171c'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  c.font = `650 ${h * 0.118}px ${SANS}`;
  c.fillText('DATA ANALYST', pad, h * 0.19);
  c.textAlign = 'right'; c.font = `500 ${h * 0.118}px ${SANS}`;
  c.fillText('2020–2022', w - pad, h * 0.19);
  c.fillRect(pad, h * 0.26, w - pad * 2, 3);
  c.textAlign = 'left'; c.font = `800 ${h * 0.47}px ${DISPLAY}`;
  c.fillText('+14%', pad - 3, h * 0.7);
  const big = c.measureText('+14%').width;
  c.font = `600 ${h * 0.125}px ${SANS}`;
  c.fillText('seller ad', pad + big + w * 0.035, h * 0.52);
  c.fillText('revenue', pad + big + w * 0.035, h * 0.67);
  barcode(c, rnd, pad, h * 0.79, w - pad * 2, h * 0.13);
  c.restore();
}

/**
 * The bag's front, flat: red film with its creases, the white print, the grey sealing strip and the shipping label.
 * The corners are see-through so the bag's corners are round.
 */
export function drawMailerFront(mark: HTMLImageElement, word: HTMLImageElement): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = TEX.w; cv.height = TEX.h;
  const c = cv.getContext('2d'); if (!c) throw new Error('Canvas is unavailable');
  const rnd = seeded(20201);
  c.beginPath(); c.roundRect(0, 0, TEX.w, TEX.h, 26); c.clip();
  c.fillStyle = RED; c.fillRect(0, 0, TEX.w, TEX.h);
  // the film is never one flat red: broad lighter and deeper patches where it lifts and sags
  for (let i = 0; i < 16; i++) {
    const x = rnd() * TEX.w, y = rnd() * TEX.h, r = 150 + rnd() * 330;
    const light = rnd() < 0.5;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, light ? 'rgba(255,120,120,.10)' : 'rgba(110,0,22,.10)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  creases(c, rnd, 52, 0.27);
  glints(c, rnd, 70);

  // the print: the mark above the word, left of centre, as on the real bag (the card photo leans a little; set it level)
  const wordW = TEX.w * 0.7, wordH = wordW * word.height / word.width;
  const markW = TEX.w * 0.215, markH = markW * mark.height / mark.width;
  const lean = 0.022;
  c.save(); c.globalAlpha = 0.97;
  c.translate(TEX.w * 0.44, TEX.h * 0.565); c.rotate(lean); c.drawImage(word, -wordW / 2, -wordH / 2, wordW, wordH);
  c.restore();
  c.save(); c.globalAlpha = 0.97;
  c.translate(TEX.w * 0.4, TEX.h * 0.375); c.rotate(lean); c.drawImage(mark, -markW / 2, -markH / 2, markW, markH);
  c.restore();
  // the creases run through the print as well, fainter
  creases(c, rnd, 16, 0.12);
  glints(c, rnd, 26);

  // the heat-sealed edges: a fine pressed line just inside the left, top and bottom
  c.strokeStyle = 'rgba(112,6,24,.34)'; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(15, 0); c.lineTo(15, TEX.h); c.moveTo(0, 15); c.lineTo(TEX.w, 15); c.moveTo(0, TEX.h - 15); c.lineTo(TEX.w, TEX.h - 15); c.stroke();
  c.strokeStyle = 'rgba(255,200,196,.22)'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(18.5, 0); c.lineTo(18.5, TEX.h); c.moveTo(0, 18.5); c.lineTo(TEX.w, 18.5); c.moveTo(0, TEX.h - 18.5); c.lineTo(TEX.w, TEX.h - 18.5); c.stroke();

  // the grey sealing strip down the right side, where the flap folds over
  const sx = TEX.w * STRIP.from, sw = TEX.w * (STRIP.to - STRIP.from);
  c.fillStyle = 'rgba(96,4,20,.42)'; c.fillRect(sx - 5, 0, 5, TEX.h);
  const grey = c.createLinearGradient(sx, 0, sx + sw, 0);
  grey.addColorStop(0, '#989da6'); grey.addColorStop(0.3, '#bcc0c7'); grey.addColorStop(0.7, '#aeb2ba'); grey.addColorStop(1, '#8e939c');
  c.fillStyle = grey; c.fillRect(sx, 0, sw, TEX.h);
  for (let i = 0; i < 46; i++) {      // the strip's own fine wrinkles, across it
    const y = rnd() * TEX.h; c.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,.34)' : 'rgba(70,74,84,.22)'; c.lineWidth = 1 + rnd() * 1.5;
    c.beginPath(); c.moveTo(sx + 2, y); c.lineTo(sx + sw - 2, y + (rnd() - 0.5) * 14); c.stroke();
  }
  c.fillStyle = 'rgba(96,4,20,.3)'; c.fillRect(sx + sw, 0, 4, TEX.h);

  label(c, rnd, TEX.w * 0.085, TEX.h * 0.735, TEX.w * 0.56, TEX.h * 0.2);
  return cv;
}

/** A white cut-out (the mark, the word) laid down in another colour. */
function tinted(image: HTMLImageElement, colour: string): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = image.width; cv.height = image.height;
  const c = cv.getContext('2d')!; c.drawImage(image, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = colour; c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}
function wrap(c: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = []; let line = '';
  for (const word of text.split(' ')) { const next = line ? `${line} ${word}` : word; if (line && c.measureText(next).width > width) { out.push(line); line = word; } else line = next; }
  if (line) out.push(line); return out;
}

/**
 * The invoice in the parcel. Every parcel has one, and this one lists his Snapdeal work instead of goods: his title
 * and years at the top, then one row per story, in the words already on the site (public/data/snapdeal-story.json).
 */
export function drawInvoice(mark: HTMLImageElement, word: HTMLImageElement): HTMLCanvasElement {
  const W = 1170, H = Math.round(1170 * INVOICE.h / INVOICE.w), PAD = 78;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d'); if (!c) throw new Error('Canvas is unavailable');
  const rnd = seeded(4107);
  c.fillStyle = '#fbfaf4'; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.022)' : 'rgba(255,255,255,.5)'; c.fillRect(rnd() * W, rnd() * H, 1.5, 1.5); }
  // the fold it was packed with, across the middle
  c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(0, H / 2, W, 3); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(0, H / 2 + 3, W, 3);
  const ink = '#15171c', soft = '#5d6068', red = '#d51f34';
  const markH = 78, markW = markH * mark.width / mark.height, wordH = 72, wordW = wordH * word.width / word.height;
  c.drawImage(tinted(mark, red), PAD, PAD - 6, markW, markH);
  c.drawImage(tinted(word, ink), PAD + markW + 16, PAD - 3, wordW, wordH);
  c.textBaseline = 'alphabetic'; c.textAlign = 'right'; c.fillStyle = soft; c.font = `650 30px ${SANS}`;
  c.fillText('INVOICE', W - PAD, PAD + 48);
  c.textAlign = 'left';
  // the paragraph helper: wrapped lines, returns the next y
  const para = (text: string, x: number, y: number, width: number, size: number, weight: number, colour: string, lead = 1.3, face = SANS) => {
    c.fillStyle = colour; c.font = `${weight} ${size}px ${face}`;
    wrap(c, text, width).forEach((line) => { y += size * lead; c.fillText(line, x, y); });
    return y;
  };
  const rule = (y: number, w = 3, a = 1) => { c.fillStyle = a === 1 ? ink : `rgba(0,0,0,${a})`; c.fillRect(PAD, y, W - PAD * 2, w); };
  const IW = W - PAD * 2;
  let y = PAD + 70;
  // the role: title, company and dates, the headline
  y = para(PAGE.title, PAD, y, IW, 54, 800, ink, 1.06, DISPLAY);
  y = para(`${PAGE.company} · ${PAGE.dates}`, PAD, y + 8, IW, 29, 650, soft, 1.2);
  y += 20; rule(y, 4); y += 10;
  y = para(PAGE.headline, PAD, y + 8, IW, 31, 700, red, 1.26);
  y += 22; rule(y, 2, 0.14);
  // what he did: the four bullets
  y += 14;
  PAGE.bullets.forEach((line) => {
    const top = y; y = para(line, PAD + 40, y + 6, IW - 40, 28, 600, ink, 1.24);
    c.fillStyle = red; c.fillRect(PAD, top + 14, 16, 16); y += 6;
  });
  y += 12; rule(y, 2, 0.14); y += 10;
  // the skills, a label and what it means
  c.fillStyle = soft; c.font = `800 26px ${SANS}`; y += 34; c.fillText('SKILLS', PAD, y);
  PAGE.skills.forEach((sk) => {
    y += 8; c.fillStyle = ink; c.font = `800 28px ${DISPLAY}`; y += 32; c.fillText(sk.label, PAD, y);
    y = para(sk.description, PAD, y - 2, IW, 24, 500, soft, 1.26);
  });
  y += 20; rule(y, 2, 0.14); y += 10;
  // what set him apart
  y += 8;
  y = para(PAGE.differentiator, PAD, y, IW, 26, 600, ink, 1.28);
  // the award, stamped on in red, a little crooked
  const ay = Math.max(y + 36, H - PAD - 230);
  c.save(); c.translate(PAD + 20, ay); c.rotate(-0.025);
  c.strokeStyle = red; c.lineWidth = 6; c.beginPath(); c.roundRect(0, 0, IW * 0.72, 190, 18); c.stroke();
  c.fillStyle = red; c.font = `800 52px ${DISPLAY}`; c.fillText(`★ ${PAGE.award.title}`, 28, 66);
  c.font = `650 27px ${SANS}`; wrap(c, PAGE.award.summary, IW * 0.72 - 56).forEach((line, i) => c.fillText(line, 28, 112 + i * 36));
  c.restore();
  barcode(c, rnd, W - PAD - 250, H - PAD - 54, 250, 54);
  return cv;
}

/** The inside of the bag, seen through the torn mouth: grey film, darker the deeper it goes. */
export function drawInside(): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 8;
  const c = cv.getContext('2d')!;
  const g = c.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, '#30333a'); g.addColorStop(1, '#7d828c');
  c.fillStyle = g; c.fillRect(0, 0, 64, 8);
  return cv;
}
