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
import { EXPERIENCE_STORIES, type ExperienceId } from '../../components/mat/experienceStories';
import { DESIGN_CARDS } from './designCards';

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
  look: { c: string; tab: string; tc: string; on: string; ton: string; num: string; dp?: string };
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
      ? { c: L.c, tab: L.tab, tc: L.tc, on: L.on, ton: L.ton, num: L.num, dp: L.dp }
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
    return { ...base, lane: it.lane === 0 ? 0 : 1, restW: 440, restH: 84, openW: 560, openH: 280 } as MatStop;
  });
}

/** Every picture the cards need. */
export function stopPictures(stops: MatStop[]): string[] {
  const set = new Set<string>();
  stops.forEach((s) => {
    if (s.item.pic) set.add(s.item.pic);
    const pr = PRINTS[s.id]; if (pr?.rest) set.add(pr.rest); if (pr?.open) set.add(pr.open);
    (s.item.works || []).forEach((w) => { const wp = workPic(w); if (wp) set.add(wp.img); });
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

/**
 * The pictures each stop shows (the pen timeline, review/home-mat-pen, 2026-11-17). Every one is his own photograph or a screen of his own
 * work, already on the site. `rest` is the small print on the resting card (3:2), `open` the big print on the open card
 * (4:3); `pos` is the focus of the crop. Changed from the real cards:
 * - Udaan: his Udaan ID card in his hand (the old home's picture, /images/udaan_id.jpg), in place of a screenshot of
 *   the Percept Insights page, whose words were cut ("uild Bette") at print size.
 * - Snapdeal: the same photo of the Snapdeal sign, but cropped wide so the whole word shows (it read "snapdea").
 * - Zomato: him on the "only the paranoid survive" stage (LOOK.pic) for both prints.
 * - Schmooze: the old home's team photo (/images/schmooze_team.jpg) for the big print, whole.
 */
export const PRINTS: Record<string, { rest?: string; open?: string; pos?: string; posRest?: string }> = {
  udaan: { rest: '/images/udaan_id.jpg', open: '/images/udaan_id.jpg', pos: '52% 48%', posRest: '52% 50%' },
  snapdeal: { pos: '50% 45%', posRest: '50% 42%' },
  zomato: { pos: '72% 50%', posRest: '78% 50%' },
  // Schmooze: the old home's team photo, whole (it is 4:3, the open print's shape), so no one is cut at the edge
  schmooze: { open: '/images/schmooze_team.jpg', pos: '50% 50%', posRest: '50% 35%' },
  bits: { pos: '50% 60%', posRest: '50% 62%' },
  'ms-edi': { pos: '50% 55%', posRest: '50% 55%' },
};
/** Work pictures cut afresh from the old home's own picture where the 2:1 cut cropped its words (Wondermart's header). */
const WORK_PICS: Record<string, { img: string; pos: string }> = {
  Wondermart: { img: '/images/udaan_wondermart.png', pos: '50% 0%' },
};
const workPic = (w: { t: string; img?: string; pos?: string }) => WORK_PICS[w.t] ?? (w.img ? { img: w.img, pos: w.pos } : undefined);
const restPic = (stop: MatStop): string | undefined => PRINTS[stop.id]?.rest ?? stop.item.pic;
const openPic = (stop: MatStop): string | undefined => PRINTS[stop.id]?.open ?? stop.item.pic;

/** The largest size (down to `min`) at which the words wrap into `lines` lines without cutting a word. */
function wrapFit(ctx: CanvasRenderingContext2D, text: string, max: number, lines: number, weight: number, size: number, min: number): { lines: string[]; size: number } {
  for (let fs = size; fs >= min; fs -= 0.5) {
    ctx.font = `${weight} ${fs}px ${SANS}`;
    const out = wrapAll(ctx, text, max, lines);
    if (out) return { lines: out, size: fs };
  }
  ctx.font = `${weight} ${min}px ${SANS}`;
  return { lines: wrapAll(ctx, text, max, 9) ?? [text], size: min };
}

/** A print: the picture covering a rounded box, or a logo on the stop's colour. */
function print(ctx: CanvasRenderingContext2D, stop: MatStop, src: string | undefined, x: number, y: number, w: number, h: number, r: number, pos: string | undefined, pics: Pictures, logoBg?: string) {
  const img = src ? pics.get(src) : undefined;
  ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip();
  if (stop.item.logo) {
    ctx.fillStyle = logoBg ?? stop.look.c; ctx.fillRect(x, y, w, h);
    if (img) { const s = Math.min(w, h) * (logoBg ? 0.5 : 0.62); ctx.drawImage(img, x + (w - s) / 2, y + (h - s) / 2, s, s); }
  } else if (img) cover(ctx, img, x, y, w, h, pos);
  else { ctx.fillStyle = mix(stop.look.on, stop.look.c, 0.88); ctx.fillRect(x, y, w, h); }
  ctx.restore();
  // a hairline round the print, as a photo lying on the card
  ctx.save(); rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r); ctx.strokeStyle = 'rgba(24,32,79,0.12)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
}

function drawStop(ctx: CanvasRenderingContext2D, stop: MatStop, e: 0 | 1, x0: number, cw: number, pics: Pictures, fl: number) {
  const it = stop.item; const lk = stop.look;
  const ink = mix(NAVY, lk.on, fl); const ink2 = mix(INK2, lk.on, fl); const ink3 = mix(INK3, lk.on, fl);
  const P = PRINTS[stop.id] ?? {};
  const role = it.role || it.title;
  if (!e) {
    // at rest: a small print (3:2), the name, the role (never cut: on two lines, a little smaller, if it must)
    const pw = 96; const ph = 64; const pp = 10;
    print(ctx, stop, restPic(stop), x0 + pp, pp, pw, ph, 7, P.posRest ?? it.pos, pics);
    const tx = x0 + pp + pw + 14; const tw = x0 + cw - tx - 12;
    ctx.font = `500 14px ${SANS}`;
    let rl: string[]; let fs = 14; let lift = 0;
    if (ctx.measureText(role).width <= tw) rl = [role];
    else { const f = wrapFit(ctx, role, tw, 2, 500, 12.5, 11); rl = f.lines; fs = f.size; lift = 7; }
    ctx.fillStyle = ink; ctx.font = `800 22px ${DISP}`; ctx.fillText(it.short, tx, 39 - lift);
    ctx.fillStyle = ink2; ctx.font = `500 ${fs}px ${SANS}`;
    rl.forEach((l, i) => ctx.fillText(l, tx, 61 - lift * 1.6 + i * (fs + 2.5)));
    return;
  }
  // open: a big print (4:3) on the outer side, the name, role, dates and numbers beside it, then the work itself
  const pp = 16; const pw = 160; const ph = 120;
  print(ctx, stop, openPic(stop), x0 + pp, pp, pw, ph, 9, P.pos ?? it.pos, pics);
  const tx = x0 + pp + pw + 16; const tw = x0 + cw - tx - 14;
  ctx.fillStyle = ink; ctx.font = `800 28px ${DISP}`; ctx.fillText(it.short, tx, 44);
  const rf = wrapFit(ctx, role, tw, 2, 500, 14.5, 12);
  ctx.fillStyle = ink2; ctx.font = `500 ${rf.size}px ${SANS}`;
  let y = 66;
  rf.lines.forEach((l) => { ctx.fillText(l, tx, y); y += rf.size + 4; });
  const range = `${my(it.start)} – ${my(it.end)}`; const d = dur(it);
  ctx.fillStyle = ink3; ctx.font = `500 12.5px ${SANS}`;
  ctx.fillText(range + (d ? `  ·  ${d}` : ''), tx, y + 2);
  // the numbers or tags that fit whole in the text column, under the dates, level with the foot of the print
  let x = tx; const nums = (it.proofs || []).filter((p) => p[0] === 'num'); const tags = (it.proofs || []).filter((p) => p[0] !== 'num');
  if (nums.length) {
    for (const p of nums) {
      ctx.font = `800 23px ${DISP}`; const vw = ctx.measureText(p[1]).width;
      ctx.font = `500 11.5px ${SANS}`; const lw2 = ctx.measureText(p[2] || '').width;
      if (x + vw + 5 + lw2 > tx + tw) break;
      ctx.fillStyle = lk.num; ctx.font = `800 23px ${DISP}`; ctx.fillText(p[1], x, pp + ph - 2);
      ctx.fillStyle = ink2; ctx.font = `500 11.5px ${SANS}`; ctx.fillText(p[2] || '', x + vw + 5, pp + ph - 3);
      x += vw + 5 + lw2 + 16;
    }
  } else {
    const ty = pp + ph - 22;
    for (const p of tags) {
      ctx.font = `600 11.5px ${SANS}`; const w2 = ctx.measureText(p[1]).width + 18;
      if (x + w2 > tx + tw) continue;
      rr(ctx, x, ty, w2, 23, 11.5); ctx.strokeStyle = mix(lk.on, lk.c, 0.5); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = ink; ctx.fillText(p[1], x + 9, ty + 15.5);
      x += w2 + 6;
    }
  }
  const lx = x0 + pp; const lw = cw - pp * 2;
  ctx.fillStyle = mix(lk.on, lk.c, 0.72); ctx.fillRect(lx, 150, lw, 1);
  const works = it.works || [];
  if (works.length) {
    // the work, in three slots: its picture, its name, what he did there (each wrapped, never cut)
    // (the work pictures are 2:1, as they were cut for the old timeline: shown whole, never cropped further)
    const gap = 12; const sw = (lw - gap * 2) / 3; const th = Math.round(sw / 2); const wy = 160;
    works.slice(0, 3).forEach((wk, i) => {
      const wx = lx + i * (sw + gap);
      ctx.save(); rr(ctx, wx, wy, sw, th, 6); ctx.clip();
      const wp = workPic(wk); const im = wp ? pics.get(wp.img) : undefined;
      if (im) cover(ctx, im, wx, wy, sw, th, wp!.pos);
      else {
        ctx.fillStyle = mix(lk.on, lk.c, 0.86); ctx.fillRect(wx, wy, sw, th);
        ctx.fillStyle = ink; ctx.font = `800 15px ${DISP}`; const t = wk.big || ''; ctx.fillText(t, wx + sw / 2 - ctx.measureText(t).width / 2, wy + th / 2 + 5);
      }
      ctx.restore();
      const tl = wrapFit(ctx, wk.t, sw, 2, 650, 12, 10.5);
      let yy = wy + th + 14;
      ctx.fillStyle = ink; ctx.font = `650 ${tl.size}px ${SANS}`;
      tl.lines.forEach((l) => { ctx.fillText(l, wx, yy); yy += tl.size + 2.5; });
      if (tl.lines.length < 2) {
        const r2 = wrapFit(ctx, wk.r, sw, 1, 500, 11.5, 10.5);
        if (r2.lines.length === 1) { ctx.fillStyle = ink2; ctx.font = `500 ${r2.size}px ${SANS}`; ctx.fillText(r2.lines[0], wx, yy); }
      }
    });
  } else if (it.notes && it.notes.length) {
    let ny = 176;
    for (const n of it.notes.slice(0, 3)) {
      const f = wrapFit(ctx, n, lw - 14, 2, 500, 12.5, 11.5);
      if (ny + (f.lines.length - 1) * (f.size + 4) > 262) break;
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(lx + 3, ny - 4, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.font = `500 ${f.size}px ${SANS}`;
      f.lines.forEach((l) => { ctx.fillText(l, lx + 12, ny); ny += f.size + 4; });
      ny += 6;
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


/* ---------- the back of a stop, turned over when it is clicked ---------- */

/** The sheet's largest size, mat pixels: it lands in the middle of the timeline's window. */
export const SHEET = { w: 1040, h: 660 } as const;
const ROW_H = 101;
/** One stop's sheet: as tall as its story and its numbers need, never more than SHEET.h. */
export function sheetSize(stop: MatStop): { w: number; h: number } {
  const n = Math.min(4, stopBeats(stop).length);
  const right = 236 + n * ROW_H + 8;
  const nums = (stop.item.proofs || []).filter((p) => p[0] === 'num').length; const tags = (stop.item.proofs || []).length - nums;
  const left = 26 + Math.round((380 - 52) * 0.75) + 30 + Math.min(3, nums) * 62 + tags * 44 + 10;
  return { w: SHEET.w, h: Math.min(SHEET.h, Math.max(right, left, 520)) };
}

interface Beat { kicker: string; title: string; lines: string[]; img?: string; pos?: string; href?: string; big?: string }
/** Which work picture goes with which story card (the same piece of work, by its place in TL's works). */
const BEAT_WORK: Record<string, Record<string, number>> = {
  zomato: { home: 0, friends: 1, rescue: 2 },
  udaan: { supply: 0, wondermart: 1, percept: 2 },
  snapdeal: { ads: 0, warehouse: 1 },
};
/** BITS's two projects, in the old home's words (data/timeline.ts). */
const BITS_LINES: Record<string, string> = {
  'Modular Water Closet': 'Designed a modular water closet system adaptable to multiple settings, with a focus on efficiency and sustainability.',
  Rightbiotic: 'Collaborated on a low-cost antimicrobial resistance testing system, to cut test turnaround from days to hours.',
};

/** What the back of a stop tells: its story on the mat (experienceStories), or for the two schools, their work. */
export function stopBeats(stop: MatStop): Beat[] {
  const it = stop.item;
  if (stop.story) {
    const story = EXPERIENCE_STORIES[stop.story as ExperienceId];
    const map = BEAT_WORK[stop.story] ?? {};
    return story.cards.map((c) => {
      const w = map[c.id] !== undefined ? (it.works || [])[map[c.id]] : undefined;
      const wp = w ? workPic(w) : undefined;
      return { kicker: c.kicker.replace(/^\d+ of \d+ · /, ''), title: c.title, lines: c.lines, img: wp?.img, pos: wp?.pos };
    });
  }
  if (stop.id === 'ms-edi') {
    // the three studio projects, each a case study already on the site (the design poster's own words, lib/mat/designCards.ts)
    const pics = (it.works || []).map((w) => w.img);
    return DESIGN_CARDS.map((d, i) => ({ kicker: d.partner, title: d.title, lines: [d.line], img: pics[i], href: d.href }));
  }
  return (it.works || []).map((w) => ({ kicker: w.r, title: w.t, lines: [BITS_LINES[w.t] ?? ''], img: w.img, big: w.big }));
}

/** Where each beat lies on the sheet (mat pixels from its top left): for drawing and for the links over them. */
export function beatRects(stop: MatStop): { x: number; y: number; w: number; h: number }[] {
  const n = Math.min(4, stopBeats(stop).length);
  const x = 412; const w = SHEET.w - x - 30; const top = 236;
  return Array.from({ length: n }, (_, i) => ({ x, y: top + i * ROW_H, w, h: ROW_H - 10 }));
}

/** The back of a stop: a big print of the stop, its name, role and dates, the numbers, and its story in a few rows. */
export function drawSheet(stop: MatStop, pics: Pictures): HTMLCanvasElement {
  const c = document.createElement('canvas');
  const S = sheetSize(stop);
  c.width = S.w * FACE_SCALE; c.height = S.h * FACE_SCALE;
  const ctx = c.getContext('2d')!;
  ctx.scale(FACE_SCALE, FACE_SCALE);
  const it = stop.item; const lk = stop.look; const deep = lk.dp ?? NAVY;
  const SH = S.h;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, SHEET.w, SH);
  // a band of the stop's colour: the big print (4:3, whole), and under it the numbers or tags, large
  const band = 380;
  ctx.fillStyle = lk.c; ctx.fillRect(0, 0, band, SH);
  if (lk.c.toLowerCase() === '#ffffff') { ctx.fillStyle = EDGE; ctx.fillRect(band - 1, 0, 1, SH); }
  const P = PRINTS[stop.id] ?? {};
  print(ctx, stop, openPic(stop), 26, 26, band - 52, Math.round((band - 52) * 0.75), 12, P.pos ?? it.pos, pics, PAPER);
  let by = 26 + Math.round((band - 52) * 0.75) + 30;
  const nums = (it.proofs || []).filter((p) => p[0] === 'num'); const tags = (it.proofs || []).filter((p) => p[0] !== 'num');
  nums.slice(0, 3).forEach((p) => {
    ctx.fillStyle = lk.num; ctx.font = `800 40px ${DISP}`; ctx.fillText(p[1], 28, by + 34);
    const vw = ctx.measureText(p[1]).width;
    const lf = wrapFit(ctx, p[3] || p[2] || '', band - 56 - vw - 14, 2, 550, 15, 13);
    ctx.fillStyle = lk.on; ctx.font = `550 ${lf.size}px ${SANS}`;
    lf.lines.forEach((l, i) => ctx.fillText(l, 28 + vw + 14, by + (lf.lines.length > 1 ? 16 + i * (lf.size + 3) : 30)));
    by += 62;
  });
  ctx.font = `600 14px ${SANS}`;
  tags.forEach((p) => {
    const w2 = ctx.measureText(p[1]).width + 26;
    if (by + 34 > SH - 8 || w2 > band - 56) return;
    rr(ctx, 28, by, w2, 34, 17); ctx.strokeStyle = mix(lk.on, lk.c, 0.4); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = lk.on; ctx.fillText(p[1], 28 + 13, by + 22);
    by += 44;
  });
  // the year tab and the name
  const [y1, y2] = yearTab(it);
  ctx.font = `800 20px ${DISP}`; const yw = ctx.measureText(y1 + (y2 ? ` ${y2}` : '')).width + 26;
  rr(ctx, 412, 30, yw, 34, 17); ctx.fillStyle = lk.tab; ctx.fill();
  ctx.fillStyle = lk.ton; ctx.fillText(y1 + (y2 ? ` ${y2}` : ''), 425, 54);
  ctx.fillStyle = NAVY; ctx.font = `800 48px ${DISP}`; ctx.fillText(it.short, 410, 116);
  const role = it.role || it.title;
  const rf = wrapFit(ctx, role, SHEET.w - 442, 2, 550, 17, 14);
  ctx.fillStyle = INK2; ctx.font = `550 ${rf.size}px ${SANS}`;
  let y = 146; rf.lines.forEach((l) => { ctx.fillText(l, 412, y); y += rf.size + 5; });
  const d = dur(it);
  ctx.fillStyle = INK3; ctx.font = `500 14px ${SANS}`; ctx.fillText(`${my(it.start)} – ${my(it.end)}${d ? `  ·  ${d}` : ''}`, 412, y + 2);
  ctx.fillStyle = EDGE; ctx.fillRect(412, 218, SHEET.w - 442, 1.5);
  // the story, a row each: a small picture of that work when there is one, then what it was and what he did
  const beats = stopBeats(stop).slice(0, 4);
  beatRects(stop).forEach((r, i) => {
    const b = beats[i];
    let tx = r.x;
    const ph = 58; const pw = 116;
    if (b.img || b.big) {
      ctx.save(); rr(ctx, r.x, r.y + 8, pw, ph, 7); ctx.clip();
      const im = b.img ? pics.get(b.img) : undefined;
      if (im) cover(ctx, im, r.x, r.y + 8, pw, ph, b.pos);
      else { ctx.fillStyle = mix(deep, PAPER, 0.86); ctx.fillRect(r.x, r.y + 8, pw, ph); ctx.fillStyle = NAVY; ctx.font = `800 14px ${DISP}`; const t = b.big || ''; ctx.fillText(t, r.x + pw / 2 - ctx.measureText(t).width / 2, r.y + 8 + ph / 2 + 5); }
      ctx.restore();
      tx = r.x + pw + 14;
    } else {
      ctx.fillStyle = mix(deep, PAPER, 0.25); ctx.font = `800 30px ${DISP}`; ctx.fillText(String(i + 1).padStart(2, '0'), r.x, r.y + 36);
      tx = r.x + 56;
    }
    const tw = r.x + r.w - tx;
    ctx.fillStyle = deep; ctx.font = `700 11px ${SANS}`; ctx.fillText(b.kicker.toUpperCase(), tx, r.y + 13);
    const title = b.title + (b.href ? '  ↗' : '');
    ctx.fillStyle = NAVY; ctx.font = `800 19px ${DISP}`; ctx.fillText(title, tx, r.y + 34);
    const room = Math.floor((r.h - 52) / 16.5) + 1;
    const lf = wrapFit(ctx, b.lines.join(' '), tw, room, 500, 13.5, 12);
    if (lf.lines.length > room) console.warn(`sheet ${stop.id}: beat ${i} needs ${lf.lines.length} lines, has room for ${room}`);
    ctx.fillStyle = INK2; ctx.font = `500 ${lf.size}px ${SANS}`;
    let ly = r.y + 53; lf.lines.forEach((l) => { ctx.fillText(l, tx, ly); ly += lf.size + 3.5; });
  });
  return c;
}
