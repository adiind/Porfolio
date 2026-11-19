/**
 * The timeline's stops as paper cards on the mat (prototype G, review/home-mat-tape/?c=7). Every word, date and picture
 * comes from TimelineSection.tsx's TL and LOOK (copied into ./timelineData.json; its test fails if they drift apart).
 *
 * The stops, as Adi asked on 2026-11-16: Self, Northwestern, Zomato, Udaan, Schmooze, Snapdeal, BITS Pilani, and
 * Tinker Verse. Bambu Lab, Portfolio V2 and the Jarvis competition are not on it.
 *
 * Each card has two faces, drawn once: at rest (cream, a colour year tab, photo, name, role) and open (its own colour
 * all over, with dates, facts and small pictures). Both are drawn into a canvas of the open size, laid from the card's
 * inner top corner (the corner by the tape), so the card can grow from that corner while one face gives way to the
 * other.
 *
 * Tinker Verse (2026-11-17) is not a card but a small pile of instant prints of his builds, held by a strip of the
 * same masking tape, beside a paper label with its year tab. Like every stop it is picked up and turned over; its back
 * is a contact sheet of the prints, each going to that build's page on the site, and a row that opens his Instagram.
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
 * Tinker Verse's prints: his latest builds, as he posted them on Instagram (@tinker_verse). Adi, 2026-11-18: "I have so
 * much recent data, recent reels that I've posted that people might be interested in". Each picture is the post's own
 * cover, read from its public embed page and cut to the instant print's picture shape (46 by 62, the 3:4 his profile
 * grid shows) with the subject whole (public/images/mat/timeline/ig-<shortcode>.webp, 640 px, no camera data).
 * `name` and `line` are taken from his own caption on that post; `date` is the post's date. Each print opens the post
 * on Instagram, in a new tab. Newest first.
 */
export type PrintFormat = 'mini' | 'square' | 'wide';
export interface TinkerPrint { id: string; src: string; format: PrintFormat; name: string; line: string; date: string; href: string }
const IG = (code: string) => `https://www.instagram.com/p/${code}/`;
const igPic = (code: string) => `/images/mat/timeline/ig-${code}.webp`;
export const TINKER_PRINTS: TinkerPrint[] = [
  // "Lesssgoo first of many things today! The AR print pipeline works properly now."
  { id: 'DfdHtmsC1SO', src: igPic('DfdHtmsC1SO'), format: 'mini', name: 'AR print pipeline', line: 'It works properly now', date: 'Nov 7, 2026', href: IG('DfdHtmsC1SO') },
  // "He lives again! #jarvis"
  { id: 'DfT98QLidK7', src: igPic('DfT98QLidK7'), format: 'mini', name: 'Jarvis', line: 'He lives again', date: 'Nov 3, 2026', href: IG('DfT98QLidK7') },
  // "Before I update helios I needed a pipeline to review it, here's a glimpse of what was cooked!"
  { id: 'DfOyiOeiY4m', src: igPic('DfOyiOeiY4m'), format: 'mini', name: 'Helios, taken apart', line: 'A pipeline to review it', date: 'Nov 1, 2026', href: IG('DfOyiOeiY4m') },
  // "Helios v1.6 is done!"
  { id: 'DfNXpR6GKfb', src: igPic('DfNXpR6GKfb'), format: 'mini', name: 'Helios v1.6', line: 'Done', date: 'Nov 1, 2026', href: IG('DfNXpR6GKfb') },
  // "Finally a PCB of my own, printed in a cave with a box of scraps!!"
  { id: 'DeqQjqUgasE', src: igPic('DeqQjqUgasE'), format: 'mini', name: 'A PCB of my own', line: 'Made from a box of scraps', date: 'Oct 18, 2026', href: IG('DeqQjqUgasE') },
  // "In mere 24 hours we have a PCB"
  { id: 'DeYDKmVM2MJ', src: igPic('DeYDKmVM2MJ'), format: 'mini', name: 'A PCB in 24 hours', line: 'Milled on the desktop CNC', date: 'Oct 11, 2026', href: IG('DeYDKmVM2MJ') },
  // "Okay yes I bought a desktop CNC, it was an inevitability."
  { id: 'DeQoU4jgnzN', src: igPic('DeQoU4jgnzN'), format: 'mini', name: 'Desktop CNC', line: 'It was an inevitability', date: 'Oct 8, 2026', href: IG('DeQoU4jgnzN') },
  // "Exploring more of AR in my home lab!"
  { id: 'Day4gskiAWH', src: igPic('Day4gskiAWH'), format: 'mini', name: 'AR in my home lab', line: 'Exploring more of it', date: 'Jul 14, 2026', href: IG('Day4gskiAWH') },
];
/** His Instagram, and his followers as his profile showed them on 2026-11-18. */
export const TINKER_INSTAGRAM = 'https://www.instagram.com/tinker_verse/';
export const TINKER_HANDLE = '@tinker_verse';
export const TINKER_FOLLOWERS = '2,000';

/** One stop as a card on the mat. Sizes are mat pixels. */
export interface MatStop {
  id: string; item: TLItem;
  /** 0 Work, left of the tape; 1 School, right of it (Tinker Verse is "on the side" and lies in the School lane). */
  lane: 0 | 1;
  start: string; end: string; today: number;
  look: { c: string; tab: string; tc: string; on: string; ton: string; num: string; dp?: string };
  restW: number; restH: number; openW: number; openH: number;
  /** Tinker Verse: a pile of prints that never grows; it fills its lane between the card above and the card below
   *  (set by the layout). It is picked up and turned over like every stop, but is not a scroll step. */
  fill?: boolean;
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
      const words = `${it.short}: ${it.pin}, ${my(it.start)} to now, ${TINKER_HANDLE} on Instagram. Turns over to show its prints.`;
      return { ...base, lane: 1, restW: 440, restH: 300, openW: 440, openH: 300, fill: true, label: words } as MatStop;
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
    if (s.fill) TINKER_PRINTS.forEach((p) => set.add(p.src));
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
  if (stop.fill) { drawPile(ctx, stop, pics); return; }
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

/* ---------- Tinker Verse: a pile of instant prints lying on the mat ---------- */

/** An instant print's paper, in mm: 86 tall, its picture 62 tall and 6.5 from the top; the three shapes differ in width. */
const PRINT_MM: Record<PrintFormat, { w: number; pw: number }> = { mini: { w: 54, pw: 46 }, square: { w: 72, pw: 62 }, wide: { w: 108, pw: 99 } };
/** A print `h` mat pixels tall: its width, and where its picture lies on it. */
export function printBox(format: PrintFormat, h: number): { w: number; h: number; px: number; py: number; pw: number; ph: number } {
  const k = h / 86; const f = PRINT_MM[format];
  return { w: f.w * k, h, px: ((f.w - f.pw) / 2) * k, py: 6.5 * k, pw: f.pw * k, ph: 62 * k };
}

/** One instant print, its top left corner at the current origin: the paper, the picture (whole), its gloss. */
function drawInstant(ctx: CanvasRenderingContext2D, p: TinkerPrint, h: number, pics: Pictures) {
  const b = printBox(p.format, h);
  // the paper: warm white, a shade brighter toward the window (top right)
  const g = ctx.createLinearGradient(0, b.h, b.w, 0);
  g.addColorStop(0, '#ebe7dd'); g.addColorStop(1, '#fcfbf7');
  rr(ctx, 0, 0, b.w, b.h, 1.8); ctx.fillStyle = g; ctx.fill();
  // the picture (its file is cut to the picture's shape, so nothing of it is lost)
  const img = pics.get(p.src);
  ctx.save(); ctx.beginPath(); ctx.rect(b.px, b.py, b.pw, b.ph); ctx.clip();
  if (img) cover(ctx, img, b.px, b.py, b.pw, b.ph);
  else { ctx.fillStyle = '#30344a'; ctx.fillRect(b.px, b.py, b.pw, b.ph); }
  // the glossy film catching the window: a faint wash from the top right
  const s = ctx.createLinearGradient(b.px + b.pw, b.py, b.px, b.py + b.ph);
  s.addColorStop(0, 'rgba(255,255,255,0.15)'); s.addColorStop(0.45, 'rgba(255,255,255,0.03)'); s.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = s; ctx.fillRect(b.px, b.py, b.pw, b.ph);
  ctx.restore();
  // the picture lies a hair under the paper: a fine line round it; and the paper's cut edge
  ctx.strokeStyle = 'rgba(28,24,18,0.3)'; ctx.lineWidth = 0.7; ctx.strokeRect(b.px + 0.35, b.py + 0.35, b.pw - 0.7, b.ph - 0.7);
  rr(ctx, 0.4, 0.4, b.w - 0.8, b.h - 0.8, 1.6); ctx.strokeStyle = 'rgba(70,58,36,0.2)'; ctx.lineWidth = 0.8; ctx.stroke();
}

/** A piece of the pile: its middle (mat px from the stop's top left), its size and its turn (radians), bottom first. */
export interface PilePiece { kind: 'label' | 'print' | 'tape'; x: number; y: number; w: number; h: number; rot: number; r: number; print?: TinkerPrint }
/** The prints on the mat are this tall (mat px); the label is the size of a resting card's words. */
const PILE_PRINT_H = 150;
const deg = (d: number): number => (d * Math.PI) / 180;
const PRINT_BY_ID = new Map(TINKER_PRINTS.map((p) => [p.id, p] as const));

/**
 * The pile, from the bottom up: the paper label at the top of the lane (its year tab on the edge by the tape, in line
 * with the other School cards' tabs and next to 2024 on the tape), the prints spread a little under and beside it so a
 * part of every picture shows, Surya on top, and the strip of tape over the top print's top edge. Nothing lies on the
 * label's words, and the prints keep 30 px from the edge by the tape (the pen lies 13 px into the lane).
 */
export function pileLayout(stop: MatStop): PilePiece[] {
  const H = stop.restH;
  const at = (id: string, x: number, y: number, d: number): PilePiece => {
    const print = PRINT_BY_ID.get(id)!; const b = printBox(print.format, PILE_PRINT_H);
    return { kind: 'print', x, y, w: b.w, h: b.h, rot: deg(d), r: 1.8, print };
  };
  // (y from the foot of the lane, so the prints stay in it whatever its height)
  const pieces: PilePiece[] = [
    { kind: 'label', x: 125, y: 55, w: 250, h: 106, rot: 0, r: 12 },
    at('DeQoU4jgnzN', 318, 84, 4),
    at('DeqQjqUgasE', 90, H - 85, -9),
    at('DfNXpR6GKfb', 172, H - 81, 6),
    at('DfOyiOeiY4m', 376, H - 88, 9),
    at('DfT98QLidK7', 250, H - 96, -6),
    at('DfdHtmsC1SO', 318, H - 146, 3.5),
  ];
  const top = pieces[pieces.length - 1];
  pieces.push({ kind: 'tape', x: top.x + (Math.sin(top.rot) * top.h) / 2 - 3, y: top.y - (Math.cos(top.rot) * top.h) / 2, w: 26, h: 56, rot: deg(-14), r: 0 });
  return pieces;
}
/** The corners of a piece (mat px), for keeping the pile inside its box. */
export function pieceCorners(p: PilePiece): [number, number][] {
  const c = Math.cos(p.rot); const s = Math.sin(p.rot);
  return ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([a, b]) => {
    const x = (a * p.w) / 2; const y = (b * p.h) / 2;
    return [p.x + x * c - y * s, p.y + x * s + y * c];
  });
}

/**
 * The shadow the pieces cast, as one soft shape: the pieces' outlines (shrunk by `shrink`) are drawn far off the
 * canvas and only their shadow, moved back, lands on it. `ox`, `oy` place the stop's box on the canvas (mat px).
 */
function castShadow(ctx: CanvasRenderingContext2D, pieces: PilePiece[], scale: number, ox: number, oy: number,
  o: { dx: number; dy: number; blur: number; alpha: number; shrink: number }) {
  const FAR = 6000;
  ctx.save();
  ctx.beginPath();
  for (const p of pieces) {
    ctx.setTransform(scale, 0, 0, scale, ox * scale - FAR, oy * scale);
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    const k = o.shrink;
    ctx.roundRect(-p.w / 2 + k, -p.h / 2 + k, p.w - k * 2, p.h - k * 2, Math.max(0, p.r - k));
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.shadowColor = `rgba(0,0,0,${o.alpha})`; ctx.shadowBlur = o.blur * scale;
  ctx.shadowOffsetX = FAR + o.dx * scale; ctx.shadowOffsetY = o.dy * scale;
  ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();
}

/** The label: a little cream card with the same year tab as the other cards, the name, its line and his handle. */
function drawPileLabel(ctx: CanvasRenderingContext2D, stop: MatStop, w: number, h: number) {
  const it = stop.item; const tabW = 66;
  ctx.save(); rr(ctx, 0, 0, w, h, 12); ctx.clip();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = stop.look.tc; ctx.fillRect(0, 0, tabW, h);
  const [y1, y2] = yearTab(it);
  ctx.fillStyle = stop.look.ton; ctx.font = `800 17px ${DISP}`;
  const ax = (t: string): number => tabW - 11 - ctx.measureText(t).width;
  ctx.fillText(y1, ax(y1), 27);
  if (y2) { ctx.globalAlpha = 0.82; ctx.font = `650 14px ${SANS}`; ctx.fillText(y2, ax(y2), 45); ctx.globalAlpha = 1; }
  const x = tabW + 14; const tw = w - x - 12;
  ctx.fillStyle = NAVY; ctx.font = `800 22px ${DISP}`; ctx.fillText(it.short, x, 34);
  const f = wrapFit(ctx, it.pin || '', tw, 2, 500, 14, 12.5);
  ctx.fillStyle = INK2; ctx.font = `500 ${f.size}px ${SANS}`;
  let y = 55; f.lines.forEach((l) => { ctx.fillText(l, x, y); y += f.size + 3.5; });
  ctx.fillStyle = NAVY; ctx.font = `650 13.5px ${SANS}`; ctx.fillText(TINKER_HANDLE, x, h - 13);
  ctx.restore();
  // its cut edge catching the light, as the cards' edges do
  rr(ctx, 0.6, 0.6, w - 1.2, h - 1.2, 11.4); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.1; ctx.stroke();
}

/** A short strip of the timeline's masking tape: cream, crinkled across, its long edges a shade darker, torn at both ends. */
function drawTapeStrip(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = rnd(11);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, 3);
  tornEdge(ctx, 0, w, 3, -1, r, 2.4);
  ctx.lineTo(w, h - 3);
  tornEdge(ctx, w, 0, h - 3, 1, r, 2.4);
  ctx.closePath(); ctx.clip();
  // (a little see-through, as the long tape is)
  ctx.fillStyle = 'rgba(251,246,234,0.88)'; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2.2) { ctx.fillStyle = `rgba(150,130,90,${0.03 + r() * 0.04})`; ctx.fillRect(0, y, w, 0.8); }
  ctx.fillStyle = 'rgba(214,200,166,0.7)'; ctx.fillRect(0, 0, 1, h); ctx.fillRect(w - 1, 0, 1, h);
  ctx.restore();
}

/**
 * The pile, drawn with see-through mat round it (the layer shows it as a cut-out). Each piece casts its own small
 * shadow on the paper under it (only where there is paper); its shadow on the mat is drawPileShadow's, a sheet of its own.
 */
function drawPile(ctx: CanvasRenderingContext2D, stop: MatStop, pics: Pictures) {
  const S = FACE_SCALE;
  pileLayout(stop).forEach((p, i) => {
    if (i > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      if (p.kind === 'tape') castShadow(ctx, [p], S, 0, 0, { dx: -0.4, dy: 0.7, blur: 1.4, alpha: 0.16, shrink: 0 });
      else {
        castShadow(ctx, [p], S, 0, 0, { dx: -3, dy: 4, blur: 8, alpha: 0.18, shrink: 1 });
        castShadow(ctx, [p], S, 0, 0, { dx: -0.8, dy: 1.2, blur: 2, alpha: 0.34, shrink: 0 });
      }
      ctx.restore();
    }
    ctx.save();
    ctx.setTransform(S, 0, 0, S, 0, 0); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.translate(-p.w / 2, -p.h / 2);
    if (p.kind === 'label') drawPileLabel(ctx, stop, p.w, p.h);
    else if (p.kind === 'print') drawInstant(ctx, p.print!, p.h, pics);
    else drawTapeStrip(ctx, p.w, p.h);
    ctx.restore();
  });
}

/** Room round the pile's shadow sheet (mat px): the shadows fall down and to the left. */
export const PILE_PAD = { l: 72, r: 16, t: 16, b: 84 } as const;
/**
 * The pile's shadow on the mat, as its own sheet (only its darkness is used): the house's three shadows (tight,
 * middle, long and soft, down and to the left: lib/flipbook/shaders.ts PROP_SHADOW_FRAGMENT) of the label and prints.
 */
export function drawPileShadow(stop: MatStop): HTMLCanvasElement {
  const S = FACE_SCALE; const c = document.createElement('canvas');
  c.width = Math.round((stop.restW + PILE_PAD.l + PILE_PAD.r) * S); c.height = Math.round((stop.restH + PILE_PAD.t + PILE_PAD.b) * S);
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const pieces = pileLayout(stop).filter((p) => p.kind !== 'tape');
  // (a canvas blur of b spreads about as far as the shader's smoothstep over 1.6 b)
  ([[-1.5, 2, 2, 0.42, 0], [-8, 10, 12, 0.36, 2], [-30, 38, 40, 0.55, 10]] as const).forEach(([dx, dy, blur, alpha, shrink]) => {
    castShadow(ctx, pieces, S, PILE_PAD.l, PILE_PAD.t, { dx, dy, blur: blur * 0.62, alpha, shrink });
  });
  return c;
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

/** The sheet's largest size, mat pixels: it lands in the middle of the timeline's window. (Tinker Verse's contact
 *  sheet is the one exception, 696 tall, TV.h below: its foot still ends inside a 1280 x 720 window.) */
export const SHEET = { w: 1040, h: 660 } as const;
const ROW_H = 101;
/** One stop's sheet: as tall as its story and its numbers need, never more than SHEET.h. */
export function sheetSize(stop: MatStop): { w: number; h: number } {
  if (stop.fill) return { w: SHEET.w, h: TV.h };
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
  if (stop.fill) return drawTinkerSheet(stop, pics);
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

/* ---------- Tinker Verse's back: a contact sheet of its prints ---------- */

/**
 * The sheet's measures (mat px): its height, the prints' height, the grid (three across, two down), and where the
 * heading and the Instagram row lie. The words are the other sheets' sizes (names 19 px, lines 13.5 px).
 */
const TV = { h: 696, fh: 166, x0: 40, colW: 222, gap: 24, top: 166, rowH: 166 + 64 + 6 } as const;
/** Each print lies on the sheet a little askew, as prints laid down by hand do (degrees). */
const TV_TILT = [-1.2, 0.9, -0.7, 1, -0.9, 0.6, 1.1, -0.8];
const TV_NAME = `800 18px ${DISP}`;
const TV_LINE = `500 13.5px ${SANS}`;
const TV_DATE = `500 12px ${SANS}`;
const TV_FOOT = ['See all of it on Instagram: ', `${TINKER_HANDLE}  ↗`] as const;
const TV_FOOT_FONTS = [`550 16px ${SANS}`, `750 16px ${SANS}`] as const;

/** Each print in the middle of its column, its words centred under it. */
interface TinkerSlot { print: TinkerPrint; cx: number; frame: { x: number; y: number; w: number; h: number; rot: number }; nameY: number; lineY: number; dateY: number }
function tinkerSlots(): TinkerSlot[] {
  return TINKER_PRINTS.map((print, i) => {
    const cx = TV.x0 + (i % 4) * (TV.colW + TV.gap) + TV.colW / 2; const y = TV.top + Math.floor(i / 4) * TV.rowH;
    const b = printBox(print.format, TV.fh);
    return { print, cx, frame: { x: cx - b.w / 2, y, w: b.w, h: b.h, rot: deg(TV_TILT[i] ?? 0) }, nameY: y + TV.fh + 22, lineY: y + TV.fh + 40, dateY: y + TV.fh + 56 };
  });
}
/** The words under a print: its name with the arrow, its line, and the post's date. */
const tinkerName = (p: TinkerPrint) => `${p.name}  ↗`;
const tinkerLine = (p: TinkerPrint) => p.line;

/** A link lying over the back of a stop (mat px from the sheet's top left). */
export interface SheetLink { x: number; y: number; w: number; h: number; href: string; text: string; newTab: boolean }
let tinkerLinkCache: SheetLink[] | null = null;
/**
 * The links on Tinker Verse's back, in reading order: each print (its picture, name and line) goes to that build's
 * page on this site in the same tab; under it, where the site ties it to a post, "The post on Instagram" opens that
 * post in a new tab; the row at the foot opens his Instagram in a new tab. None of them overlap. (Measured with the
 * sheet's own fonts, so it is asked for only once they are loaded: when a stop is picked.)
 */
export function tinkerLinks(): SheetLink[] {
  if (tinkerLinkCache) return tinkerLinkCache;
  const ctx = document.createElement('canvas').getContext('2d')!;
  const out: SheetLink[] = [];
  tinkerSlots().forEach((s) => {
    const p = s.print;
    ctx.font = TV_NAME; const nw = ctx.measureText(tinkerName(p)).width;
    ctx.font = TV_LINE; const lw = ctx.measureText(tinkerLine(p)).width;
    const wide = Math.min(TV.colW + TV.gap - 4, Math.max(s.frame.w, nw, lw));
    out.push({ x: s.cx - wide / 2 - 6, y: s.frame.y - 6, w: wide + 12, h: s.dateY + 6 - (s.frame.y - 6), href: p.href, text: `${p.name}: ${p.line}, posted ${p.date}. Opens the post on Instagram in a new tab.`, newTab: true });
  });
  ctx.font = TV_FOOT_FONTS[0]; const a = ctx.measureText(TV_FOOT[0]).width;
  ctx.font = TV_FOOT_FONTS[1]; const b = ctx.measureText(TV_FOOT[1]).width;
  out.push({ x: TV.x0 - 6, y: TV.h - 30 - 20, w: a + b + 12, h: 28, href: TINKER_INSTAGRAM, text: `See all of it on Instagram: ${TINKER_HANDLE} (opens in a new tab)`, newTab: true });
  tinkerLinkCache = out;
  return out;
}

/** Where the links lie over a picked stop's back: its rows, or for Tinker Verse its prints and Instagram links. */
export function sheetRects(stop: MatStop): { x: number; y: number; w: number; h: number }[] {
  return stop.fill ? tinkerLinks() : beatRects(stop);
}

/**
 * Tinker Verse's back: cream paper, the name with its year tab, its line, its dates and the number of posts, then the
 * six prints laid out as a contact sheet, each whole, with its name and line under it (and the post where there is
 * one), and at the foot a row to his Instagram.
 */
function drawTinkerSheet(stop: MatStop, pics: Pictures): HTMLCanvasElement {
  const S = sheetSize(stop);
  const c = document.createElement('canvas');
  c.width = S.w * FACE_SCALE; c.height = S.h * FACE_SCALE;
  const ctx = c.getContext('2d')!;
  ctx.scale(FACE_SCALE, FACE_SCALE);
  const it = stop.item; const lk = stop.look;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, S.w, S.h);
  // the name, and its year tab beside it
  ctx.fillStyle = NAVY; ctx.font = `800 48px ${DISP}`; ctx.fillText(it.short, 38, 82);
  const nameW = ctx.measureText(it.short).width;
  const [y1, y2] = yearTab(it); const years = y1 + (y2 ? ` ${y2}` : '');
  ctx.font = `800 20px ${DISP}`; const yw = ctx.measureText(years).width + 26; const px = 38 + nameW + 20;
  rr(ctx, px, 50, yw, 34, 17); ctx.fillStyle = lk.tab; ctx.fill();
  ctx.fillStyle = lk.ton; ctx.fillText(years, px + 13, 74);
  // its line, its dates and how much is on Instagram
  ctx.fillStyle = INK2; ctx.font = `550 17px ${SANS}`; ctx.fillText(it.pin || '', 40, 112);
  ctx.fillStyle = INK3; ctx.font = `500 14px ${SANS}`; ctx.fillText(`${my(it.start)} to now  ·  My latest builds, as I posted them  ·  ${TINKER_FOLLOWERS} followers on Instagram`, 40, 136);
  ctx.fillStyle = EDGE; ctx.fillRect(40, 152, S.w - 80, 1.5);
  // the prints
  tinkerSlots().forEach((s) => {
    const f = s.frame;
    ctx.save();
    ctx.translate(f.x + f.w / 2, f.y + f.h / 2); ctx.rotate(f.rot);
    // lying on the sheet: a soft shadow down and to the left, and a tight one at its edge
    ctx.save();
    ctx.shadowColor = 'rgba(24,32,79,0.2)'; ctx.shadowBlur = 8 * FACE_SCALE; ctx.shadowOffsetX = -2.5 * FACE_SCALE; ctx.shadowOffsetY = 3.5 * FACE_SCALE;
    rr(ctx, -f.w / 2, -f.h / 2, f.w, f.h, 1.8); ctx.fillStyle = '#efece4'; ctx.fill();
    ctx.shadowColor = 'rgba(24,32,79,0.28)'; ctx.shadowBlur = 1.6 * FACE_SCALE; ctx.shadowOffsetX = -0.6 * FACE_SCALE; ctx.shadowOffsetY = 1 * FACE_SCALE;
    ctx.fill();
    ctx.restore();
    ctx.translate(-f.w / 2, -f.h / 2);
    drawInstant(ctx, s.print, f.h, pics);
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.fillStyle = NAVY; ctx.font = TV_NAME; ctx.fillText(tinkerName(s.print), s.cx, s.nameY);
    ctx.fillStyle = INK2; ctx.font = TV_LINE; ctx.fillText(tinkerLine(s.print), s.cx, s.lineY);
    ctx.fillStyle = INK3; ctx.font = TV_DATE; ctx.fillText(s.print.date, s.cx, s.dateY);
    ctx.textAlign = 'left';
  });
  // the row at the foot: his Instagram
  const fy = S.h - 30;
  ctx.fillStyle = EDGE; ctx.fillRect(40, fy - 28, S.w - 80, 1.5);
  ctx.fillStyle = INK2; ctx.font = TV_FOOT_FONTS[0]; ctx.fillText(TV_FOOT[0], 40, fy);
  const aw = ctx.measureText(TV_FOOT[0]).width;
  ctx.fillStyle = NAVY; ctx.font = TV_FOOT_FONTS[1]; ctx.fillText(TV_FOOT[1], 40 + aw, fy);
  return c;
}
