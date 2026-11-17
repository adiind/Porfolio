/**
 * The timeline's stops as paper cards on the mat (prototype G, review/home-mat-tape/?c=7). Every word, date and picture
 * comes from TimelineSection.tsx's TL and LOOK (copied into ./timelineData.json; its test fails if they drift apart).
 *
 * The stops, as Adi asked on 2026-11-16: Self, Northwestern, Zomato, Udaan, Schmooze, Snapdeal, BITS Pilani, and
 * Tinker Verse as one card that is already open, with small prints of his builds. Bambu Lab, Portfolio V2 and the
 * Jarvis competition are not on it.
 *
 * Each card has two faces, drawn once: at rest (cream, a colour year tab, photo, name, role) and open (its own colour
 * all over, with dates, facts and small pictures). Both are drawn into a canvas of the open size, laid from the card's
 * inner top corner (the corner by the tape), so the card can grow from that corner while one face gives way to the
 * other. Tinker Verse has one face.
 */
import data from './timelineData.json';

export const PAPER = '#fbf6ea';
export const PAPER2 = '#f1e9d6';
export const EDGE = '#e3d9c0';
export const NAVY = '#18204f';
const INK2 = '#4a5180';
const INK3 = '#646a92';
/** canvas pixels per mat pixel */
export const FACE_SCALE = 2;

type Proof = [string, string, string?, string?];
interface Work { t: string; r: string; img?: string; pos?: string; big?: string }
export interface TLItem {
  id: string; short: string; title: string; company?: string; headline?: string; start: string; end: string; lane: number;
  c?: string; f?: string; pic?: string; logo?: number; pos?: string; role?: string; pin?: string; href?: string;
  proofs?: Proof[]; notes?: string[]; works?: Work[];
}
interface Look { c: string; tab: string; tc: string; on: string; ton: string; num: string; dp: string; pic?: string }
const TL = (data as unknown as { tl: { today: string; items: TLItem[] } }).tl;
const LOOK = (data as unknown as { look: Record<string, Look> }).look;
const TODAY = Date.parse(TL.today);

/**
 * Tinker Verse's prints: his own photographs and screenshots of what he built, already on the site. Each opens its
 * thing. `crop` is the part of the picture shown (x, y, w, h as fractions).
 */
export interface Thumb { src: string; cap: string; href: string; crop: [number, number, number, number] }
export const TINKER_THUMBS: Thumb[] = [
  // Surya on his wall: web copy of his phone photo IMG_1438 (lib/flipbook/live/suryaStory.ts, "Adi's own photographs")
  { src: '/images/flipbook/surya/parts/wall.webp', cap: 'Surya', href: '/book/surya', crop: [0.17, 0.06, 0.52, 0.88] },
  // Jarvis's printed case on his cutting mat, from hero-image.jpg in his diy-jarvis repo (scripts/flipbook/make-jarvis-parts.py)
  { src: '/images/flipbook/jarvis/parts/case.webp', cap: 'Jarvis', href: 'https://github.com/adiind/diy-jarvis', crop: [0.05, 0.12, 0.9, 0.8] },
  // Helios, printed and lit, on his mat: the site's own photo of it, cropped above its title lettering
  { src: '/images/helios.jpg', cap: 'Helios', href: '/work/helios', crop: [0, 0, 1, 0.6] },
  // Muse, printed, in his hand (HISTORY.md 2026-11-16: "his real photograph of the finished Muse")
  { src: '/images/flipbook/muse/parts/muse-real.webp', cap: 'Muse', href: '/book/muse', crop: [0.08, 0.04, 0.84, 0.72] },
  // Zero's workspace: a screenshot of the running app (HISTORY.md 2026-04-28: real screenshots of the local Zero runtime)
  { src: '/images/zero_text_mode.webp', cap: 'Zero', href: '/work/zero-my-ai', crop: [0, 0, 0.7, 0.75] },
  // Surya's engraved layer held up in the workshop (his photo IMG_9301)
  { src: '/images/flipbook/surya/parts/held.webp', cap: 'Laser cut', href: '/book/surya', crop: [0.05, 0.08, 0.9, 0.8] },
];

/** One stop as a card on the mat. Sizes are mat pixels. */
export interface MatStop {
  id: string; item: TLItem;
  /** 0 Work, left of the tape; 1 School, right of it (Tinker Verse is "on the side" and lies in the School lane). */
  lane: 0 | 1;
  start: string; end: string; today: number;
  look: { c: string; tab: string; tc: string; on: string; ton: string; num: string };
  restW: number; restH: number; openW: number; openH: number;
  /** Tinker Verse: already open; it fills its lane between the card above and the card below (set by the layout). */
  fill?: boolean;
  thumbs?: Thumb[];
  /** What a screen reader hears, in the same words as the card (the old timeline's wording). */
  label: string;
  /** Where a click goes: a story on the mat (#experience-<id>), a page, or nothing yet (a note says so). */
  story: string | null;
  href: string | null;
}

const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const my = (s: string): string => { if (s === 'Present') return 'now'; const d = new Date(s); return `${M[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const endOf = (it: TLItem): number => (it.end === 'Present' ? TODAY : Date.parse(it.end));
function dur(it: TLItem): string {
  if (it.lane === 1) return endOf(it) > TODAY ? 'in progress' : '';
  if (it.lane === 2) return '';
  const m = Math.round((endOf(it) - Date.parse(it.start)) / 2629800000);
  if (m < 12) return `${m} months`;
  const y = Math.floor(m / 12); const r = m % 12;
  return `${y}${y > 1 ? ' yrs' : ' yr'}${r ? ` ${r} mos` : ''}`;
}
/** Years for a tab: "2026", or "2024" with "–25" under it (TimelineSection.tsx's yearTab). */
export function yearTab(it: TLItem): [string, string] {
  const a = new Date(it.start).getUTCFullYear(); const open = it.end === 'Present'; const b = open ? 0 : new Date(it.end).getUTCFullYear();
  return [String(a), open ? '–now' : b !== a ? `–${String(b).slice(2)}` : ''];
}

/** The experience stories on the mat (components/mat/experienceStories.ts), by the stop's short name. */
const STORIES = new Set(['self', 'zomato', 'udaan', 'schmooze', 'snapdeal']);
const LEFT_OFF = new Set(['portfolio-website', 'jarvis-competition']);

/** The stops on the mat, newest first. */
export function matStops(): MatStop[] {
  const items = [...TL.items].filter((it) => !LEFT_OFF.has(it.id)).sort((a, b) => Date.parse(b.start) - Date.parse(a.start));
  return items.map((it) => {
    const L = LOOK[it.id];
    const look = L
      ? { c: L.c, tab: L.tab, tc: L.tc, on: L.on, ton: L.ton, num: L.num }
      : { c: it.c || PAPER, tab: it.c || PAPER2, tc: it.c || PAPER2, on: it.f || NAVY, ton: it.f || NAVY, num: it.f || NAVY };
    const item = L?.pic ? { ...it, pic: L.pic } : it;
    // the old timeline's words for a stop (TimelineSection.tsx): name, role, dates, where it goes
    const label = `${it.short}: ${it.role || it.pin || it.title}, ${my(it.start)} to ${my(it.end)}. Opens its page.`;
    const key = it.short.toLowerCase();
    const story = STORIES.has(key) ? key : null;
    // the stops with no story on the mat open their own page in the site (/experience/<id>; on the dev server this is the
    // old home page, as expected)
    const base = {
      id: it.id, item, start: it.start, end: it.end, today: TODAY, look, label, story, href: it.href ?? (story ? null : `/experience/${it.id}`),
    };
    if (it.id === 'tinkerverse') {
      return { ...base, lane: 1, restW: 440, restH: 300, openW: 440, openH: 300, fill: true, thumbs: TINKER_THUMBS } as MatStop;
    }
    return { ...base, lane: it.lane === 0 ? 0 : 1, restW: 440, restH: 84, openW: 560, openH: 250 } as MatStop;
  });
}

/** Every picture the cards need. */
export function stopPictures(stops: MatStop[]): string[] {
  const set = new Set<string>();
  stops.forEach((s) => {
    if (s.item.pic) set.add(s.item.pic);
    (s.item.works || []).forEach((w) => { if (w.img) set.add(w.img); });
    (s.thumbs || []).forEach((t) => set.add(t.src));
  });
  return [...set];
}

/* ---------- drawing ---------- */

const hex = (h: string): number[] => { const v = parseInt(h.replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const mix = (a: string, b: string, t: number): string => { const x = hex(a); const y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`; };
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, pos?: string) {
  const iw = img.naturalWidth || img.width; const ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih); const sw = w / s; const sh = h / s;
  let px = 0.5; let py = 0.5;
  const m = pos?.match(/([\d.]+)%\s+([\d.]+)%/);
  if (m) { px = +m[1] / 100; py = +m[2] / 100; }
  ctx.drawImage(img, (iw - sw) * px, (ih - sh) * py, sw, sh, x, y, w, h);
}
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}
/** Words on lines no wider than max, never cut; null if they do not fit in that many lines. */
function wrapAll(ctx: CanvasRenderingContext2D, text: string, max: number, lines: number): string[] | null {
  const out: string[] = []; let cur = '';
  for (const w of text.split(' ')) {
    if (ctx.measureText(w).width > max) return null;
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > max) { out.push(cur); cur = w; } else cur = t;
  }
  if (cur) out.push(cur);
  return out.length <= lines ? out : null;
}
const DISP = '"FB Bricolage", "FB Geist", sans-serif';
const SANS = '"FB Geist", -apple-system, "Helvetica Neue", Arial, sans-serif';
function arrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, col: string) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 4.5, cy); ctx.lineTo(cx + 4.5, cy); ctx.moveTo(cx + 0.5, cy - 4); ctx.lineTo(cx + 4.5, cy); ctx.lineTo(cx + 0.5, cy + 4); ctx.stroke();
  ctx.restore();
}

export type Pictures = Map<string, HTMLImageElement>;

/** A canvas of a card's open size (in canvas pixels). */
export function faceCanvas(stop: MatStop): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(stop.openW * FACE_SCALE); c.height = Math.round(stop.openH * FACE_SCALE);
  return c;
}

/**
 * Draws one face: `open` 0 the resting face, 1 the open face. The canvas is the open size; the face is laid from the
 * card's inner top corner (top right for Work, top left for School), and the resting face's paper and year tab are
 * carried on to the canvas's edges, so the card can grow from that corner showing more of the same face.
 */
export function drawFace(canvas: HTMLCanvasElement, stop: MatStop, open: 0 | 1, pics: Pictures): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(FACE_SCALE, 0, 0, FACE_SCALE, 0, 0);
  if (stop.fill) { drawTinker(ctx, stop, pics); return; }
  const W = stop.openW; const H = stop.openH;
  const w = open ? stop.openW : stop.restW; const h = open ? stop.openH : stop.restH;
  const lk = stop.look; const it = stop.item;
  const fl = open;
  const work = stop.lane === 0;
  const bg = mix(PAPER, lk.c, fl);
  const tabW = 66 + 10 * open;
  const tabBg = mix(lk.tc, lk.tab, fl);
  // the paper, and the year tab down the inner edge, all the way down the canvas
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = tabBg; ctx.fillRect(work ? W - tabW : 0, 0, tabW, H);
  // the face itself, from the inner top corner
  ctx.save();
  ctx.translate(work ? W - w : 0, 0);
  const tx = work ? w - tabW : 0;
  const [y1, y2] = yearTab(it);
  ctx.fillStyle = lk.ton; ctx.textBaseline = 'alphabetic';
  const ax = (t: string): number => (work ? tx + 11 : tx + tabW - 11 - ctx.measureText(t).width);
  ctx.font = `800 ${17 + 3 * open}px ${DISP}`; ctx.fillText(y1, ax(y1), 27 + 4 * open);
  if (y2) { ctx.globalAlpha = 0.82; ctx.font = `650 ${14 + 2 * open}px ${SANS}`; ctx.fillText(y2, ax(y2), 45 + 6 * open); ctx.globalAlpha = 1; }
  if (open) {
    // the arrow that says "this opens its page", as on today's stops
    const ox = work ? tx + 24 : tx + tabW - 24;
    ctx.beginPath(); ctx.arc(ox, h - 26, 13, 0, Math.PI * 2); ctx.fillStyle = lk.ton; ctx.fill();
    arrow(ctx, ox, h - 26, tabBg);
  }
  const x0 = work ? 0 : tabW; const cw = w - tabW;
  drawStop(ctx, stop, open, x0, cw, pics, fl);
  ctx.restore();
}

function drawStop(ctx: CanvasRenderingContext2D, stop: MatStop, e: 0 | 1, x0: number, cw: number, pics: Pictures, fl: number) {
  const it = stop.item; const lk = stop.look;
  const ink = mix(NAVY, lk.on, fl); const ink2 = mix(INK2, lk.on, fl); const ink3 = mix(INK3, lk.on, fl);
  // the photo, a plain rounded print
  const ps = 64 + 36 * e; const pp = 10 + 6 * e;
  const img = it.pic ? pics.get(it.pic) : undefined;
  ctx.save(); rr(ctx, x0 + pp, pp, ps, ps, 8 + 2 * e); ctx.clip();
  if (it.logo) {
    ctx.fillStyle = mix(lk.c, '#ffffff', fl); ctx.fillRect(x0 + pp, pp, ps, ps);
    if (img) ctx.drawImage(img, x0 + pp + ps * 0.18, pp + ps * 0.18, ps * 0.64, ps * 0.64);
  } else if (img) cover(ctx, img, x0 + pp, pp, ps, ps, it.pos);
  ctx.restore();
  const tx = x0 + pp + ps + 14 + 2 * e; const tw = x0 + cw - tx - 12;
  // name and role; the role is never cut: on one line if it fits, else on two (the name moves up to make room)
  const role = it.role || it.title;
  let rl: string[]; let lift = 0;
  ctx.font = `500 ${14 + e}px ${SANS}`;
  if (ctx.measureText(role).width <= tw) rl = [role];
  else { ctx.font = `500 ${12.5 + 2.5 * e}px ${SANS}`; rl = wrapAll(ctx, role, tw, 2) ?? [fit(ctx, role, tw)]; lift = 7 * (1 - e); }
  ctx.fillStyle = ink; ctx.font = `800 ${22 + 8 * e}px ${DISP}`; ctx.fillText(it.short, tx, 39 + 13 * e - lift);
  ctx.fillStyle = ink2; ctx.font = rl.length > 1 ? `500 ${12.5 + 2.5 * e}px ${SANS}` : `500 ${14 + e}px ${SANS}`;
  rl.forEach((l, i) => ctx.fillText(l, tx, 61 + 17 * e - lift * 1.6 + i * (15 + 4 * e)));
  if (!e) return;
  // open: dates, a hairline, the numbers or tags, then the work itself
  const range = `${my(it.start)} – ${my(it.end)}`; const d = dur(it);
  ctx.fillStyle = ink3; ctx.font = `500 13px ${SANS}`;
  ctx.fillText(range + (d ? `  ·  ${d}` : ''), tx, 78 + 19 * (rl.length - 1) + 22);
  const lx = x0 + 16; const lw = cw - 32;
  ctx.fillStyle = mix(lk.on, lk.c, 0.7); ctx.fillRect(lx, 130, lw, 1);
  let x = lx;
  for (const p of it.proofs || []) {
    if (p[0] === 'num') {
      ctx.font = `800 24px ${DISP}`; const vw = ctx.measureText(p[1]).width;
      ctx.font = `500 12px ${SANS}`; const lw2 = ctx.measureText(p[2] || '').width;
      if (x + vw + 6 + lw2 > lx + lw) break;
      ctx.fillStyle = lk.num; ctx.font = `800 24px ${DISP}`; ctx.fillText(p[1], x, 166);
      ctx.fillStyle = ink2; ctx.font = `500 12px ${SANS}`; ctx.fillText(p[2] || '', x + vw + 6, 165);
      x += vw + 6 + lw2 + 20;
    } else {
      ctx.font = `600 12px ${SANS}`; const tw2 = ctx.measureText(p[1]).width + 20;
      if (x + tw2 > lx + lw) break;
      rr(ctx, x, 146, tw2, 26, 13); ctx.strokeStyle = mix(lk.on, lk.c, 0.55); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = ink; ctx.fillText(p[1], x + 10, 163.5);
      x += tw2 + 8;
    }
  }
  const works = it.works || [];
  if (works.length) {
    const colW = lw / Math.max(2, works.length);
    works.slice(0, 3).forEach((wk, i) => {
      const wx = lx + i * colW; const wy = 186;
      ctx.save(); rr(ctx, wx, wy, 72, 48, 6); ctx.clip();
      const im = wk.img ? pics.get(wk.img) : undefined;
      if (im) cover(ctx, im, wx, wy, 72, 48, wk.pos);
      else {
        ctx.fillStyle = mix(lk.on, lk.c, 0.88); ctx.fillRect(wx, wy, 72, 48);
        ctx.fillStyle = ink; ctx.font = `800 11px ${DISP}`; const t = wk.big || ''; ctx.fillText(t, wx + 36 - ctx.measureText(t).width / 2, wy + 28);
      }
      ctx.restore();
      // its name and what he did there, wrapped, never cut (the smaller line is left off if it cannot fit whole)
      const tw2 = colW - 86; let y = wy + 13;
      let tl: string[] | null = null;
      for (let fs = 12; fs >= 10.5 && !tl; fs -= 0.5) { ctx.font = `650 ${fs}px ${SANS}`; tl = wrapAll(ctx, wk.t, tw2, 2); }
      ctx.fillStyle = ink; (tl || [wk.t]).forEach((l) => { ctx.fillText(l, wx + 80, y); y += 14; });
      let rl2: string[] | null = null;
      for (let f2 = 11.5; f2 >= 10.5 && !rl2; f2 -= 0.5) { ctx.font = `500 ${f2}px ${SANS}`; rl2 = wrapAll(ctx, wk.r, tw2, 3 - (tl ? tl.length : 1)); }
      if (rl2) { ctx.fillStyle = ink2; rl2.forEach((l) => { ctx.fillText(l, wx + 80, y + 1); y += 13.5; }); }
    });
  } else if (it.notes && it.notes.length) {
    ctx.font = `500 12.5px ${SANS}`; ctx.fillStyle = ink;
    let y = 200;
    for (const n of it.notes.slice(0, 3)) {
      ctx.beginPath(); ctx.arc(lx + 3, y - 4, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(fit(ctx, n, lw - 14), lx + 12, y); y += 19;
    }
  }
}

/** Where Tinker Verse's prints lie on its card (mat pixels from its top left), for drawing and for their links. */
export function thumbRects(stop: MatStop): { x: number; y: number; w: number; h: number }[] {
  const thumbs = stop.thumbs || [];
  const tabW = 66; const x0 = tabW; const cw = stop.restW - tabW; const pad = 14; const cols = 3; const gap = 10;
  const tw = (cw - pad * 2 - gap * (cols - 1)) / cols;
  const rows = Math.ceil(thumbs.length / cols);
  const top = 70; const room = stop.restH - top - 12; const rowH = room / rows; const ph = Math.min(tw * 0.74, rowH - 22);
  return thumbs.map((_, i) => ({ x: x0 + pad + (i % cols) * (tw + gap), y: top + Math.floor(i / cols) * rowH, w: tw, h: ph }));
}

/**
 * Tinker Verse, already open: cream like the other side builds (it has no brand colour in TL), its year tab, its name
 * and line, and small prints of what he built there, each with a word.
 */
function drawTinker(ctx: CanvasRenderingContext2D, stop: MatStop, pics: Pictures) {
  const w = stop.restW; const h = stop.restH; const it = stop.item;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
  const tabW = 66;
  ctx.fillStyle = PAPER2; ctx.fillRect(0, 0, tabW, h);
  const [y1, y2] = yearTab(it);
  ctx.fillStyle = NAVY; ctx.font = `800 17px ${DISP}`;
  const ax = (t: string): number => tabW - 11 - ctx.measureText(t).width;
  ctx.fillText(y1, ax(y1), 27);
  if (y2) { ctx.globalAlpha = 0.82; ctx.font = `650 14px ${SANS}`; ctx.fillText(y2, ax(y2), 45); ctx.globalAlpha = 1; }
  ctx.fillStyle = NAVY; ctx.font = `800 22px ${DISP}`; ctx.fillText(it.short, tabW + 14, 34);
  ctx.fillStyle = INK2; ctx.font = `500 14px ${SANS}`; ctx.fillText(it.pin || '', tabW + 14, 54);
  thumbRects(stop).forEach((r, i) => {
    const t = stop.thumbs![i];
    const im = pics.get(t.src);
    ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, 8); ctx.clip();
    ctx.fillStyle = EDGE; ctx.fillRect(r.x, r.y, r.w, r.h);
    if (im) {
      const iw = im.naturalWidth; const ih = im.naturalHeight;
      const [cx, cy, cw2, ch] = t.crop; let sx = cx * iw; let sy = cy * ih; let sw = cw2 * iw; let sh = ch * ih;
      // cover the print's shape from inside the crop
      const want = r.w / r.h;
      if (sw / sh > want) { const nw = sh * want; sx += (sw - nw) / 2; sw = nw; } else { const nh = sw / want; sy += (sh - nh) / 2; sh = nh; }
      ctx.drawImage(im, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
    }
    ctx.restore();
    ctx.fillStyle = NAVY; ctx.font = `650 12.5px ${SANS}`; ctx.fillText(t.cap, r.x + 2, r.y + r.h + 16);
  });
}

/* ---------- the tape ---------- */

/** A stable hash for the torn edges. */
function rnd(seed: number): () => number { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function tornEdge(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, dir: 1 | -1, r: () => number, depth: number) {
  const n = Math.max(6, Math.round((x1 - x0) / 3));
  for (let i = 0; i <= n; i += 1) ctx.lineTo(x0 + ((x1 - x0) * i) / n, y + dir * (r() * depth + (i % 3 === 0 ? r() * depth * 0.8 : 0)));
}

/**
 * The masking tape, lengthwise down the canvas: cream, torn at both ends, faint crinkles, its long edges a shade darker,
 * and the years printed in navy as a ruler (a tick where each year starts, quarter ticks, the year in its band).
 * `years` gives each year's distance down the strip in mat pixels.
 */
export function drawTape(w: number, len: number, years: { y: number; label: string }[]): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = Math.round(w * FACE_SCALE); c.height = Math.round(len * FACE_SCALE);
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  ctx.scale(FACE_SCALE, FACE_SCALE);
  const r = rnd(3);
  ctx.beginPath(); ctx.moveTo(0, 6);
  tornEdge(ctx, 0, w, 6, -1, r, 5);
  ctx.lineTo(w, len - 6);
  tornEdge(ctx, w, 0, len - 6, 1, r, 5);
  ctx.closePath(); ctx.save(); ctx.clip();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, len);
  for (let y = 0; y < len; y += 2.2) { ctx.fillStyle = `rgba(150,130,90,${0.025 + r() * 0.035})`; ctx.fillRect(0, y, w, 0.8); }
  ctx.fillStyle = EDGE; ctx.fillRect(0, 0, 1.1, len); ctx.fillRect(w - 1.1, 0, 1.1, len);
  ctx.strokeStyle = NAVY; ctx.fillStyle = NAVY;
  years.forEach(({ y, label }, i) => {
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(11, y); ctx.moveTo(w - 11, y); ctx.lineTo(w, y); ctx.stroke();
    const next = years[i + 1]?.y;
    if (next === undefined) return;
    for (let q = 1; q < 4; q += 1) {
      const yy = y + ((next - y) * q) / 4; const l = q === 2 ? 7 : 4.5;
      ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(l, yy); ctx.moveTo(w - l, yy); ctx.lineTo(w, yy); ctx.stroke();
    }
    ctx.font = `650 10.5px ${SANS}`; const tw = ctx.measureText(label).width;
    ctx.fillText(label, w / 2 - tw / 2, (y + next) / 2 + 3.8);
  });
  ctx.restore();
  return c;
}
