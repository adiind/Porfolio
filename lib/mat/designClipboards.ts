/**
 * The three human-centered design case studies as three clipboards lying side by side on the mat (Adi, 2026-11-18: "it's
 * human-centered design. So I want to represent it as clipboard ... three clipboards stacked side by side, kinda, so that
 * people just click on them and they just get into that page"). They took the place of the design poster and the cards
 * it dealt: one click on a clipboard opens its case study, with no step in between.
 *
 * Each is a thing, not a tile: a hardboard with a worn edge, a sprung steel clip with its hanging hole, two sheets of
 * paper under the clip. The sheet carries the project's own picture, who it was with, its name, a stroke of highlighter
 * in the project's colour, and one line. Everything written keeps clear of the part the next clipboard lies over. Words and pictures are the cards' (lib/mat/designCards.ts): only what the live
 * site already says.
 */
import { DESIGN_CARDS } from './designCards';

/** A clipboard's size on the home page, in page pixels (the stage's 1440 by 900 frame). */
export const CLIPBOARD = { w: 158, h: 226 } as const;

/**
 * Where the three lie, by their middles, in page pixels, and how each is turned (degrees clockwise). Left to right, each
 * a little over the one before (the later ones are drawn on top), none square to the grid: put down by hand.
 */
export const CLIPBOARD_LAY = [
  { x: 1034, y: 334, turn: -3.2 },
  { x: 1156, y: 362, turn: 1.6 },
  { x: 1277, y: 338, turn: 3.6 },
] as const;

/** Drawn at 4 canvas pixels to the page pixel: sharp on a 2x screen, and when it lifts under the pointer. */
const S = 4;
/** Clear room kept in the picture above the board, for the clip's handle. */
const TOP = 9;
const RIGHT = 0;
const NAVY = '#18204f';
const SANS = "'FB Geist', Geist, system-ui, sans-serif";
const DISPLAY = "'FB Bricolage', 'FB Geist', system-ui, sans-serif";

type Ctx = CanvasRenderingContext2D;
type Spaced = Ctx & { letterSpacing?: string };

/** The same speckle every time (a board must not change its grain when it is drawn again). */
function grain(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wrap(ctx: Ctx, text: string, width: number): string[] {
  const out: string[] = []; let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/** The picture, cut to fill a box (its middle kept). */
function cover(ctx: Ctx, image: HTMLImageElement, x: number, y: number, w: number, h: number, r: number, focusY = 0.5) {
  const iw = image.naturalWidth || 1; const ih = image.naturalHeight || 1;
  const k = Math.max(w / iw, h / ih);
  const sw = w / k; const sh = h / k;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
  ctx.drawImage(image, (iw - sw) / 2, Math.max(0, Math.min(ih - sh, (ih - sh) * focusY)), sw, sh, x, y, w, h);
  ctx.restore();
}

/** Brushed steel, lit from above: bright at the top, a dark band below the middle, a pale foot. */
function steel(ctx: Ctx, y: number, h: number): CanvasGradient {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#fbfcfd'); g.addColorStop(0.22, '#d8dde3'); g.addColorStop(0.5, '#a3abb5');
  g.addColorStop(0.68, '#7d8691'); g.addColorStop(0.86, '#c3c9d0'); g.addColorStop(1, '#e9ecef');
  return g;
}

/**
 * One clipboard, CLIPBOARD.w by CLIPBOARD.h page pixels, its outline its own (the corners and the clip's handle are cut
 * out of a clear picture). `shade`: where the next clipboard lies over this one (page pixels from this
 * picture's left and top), so its shadow can be painted here: shadows on the mat are drawn under every card, and a card
 * cannot take another's shadow by itself.
 */
export function drawClipboard(index: number, picture: HTMLImageElement | null, pgLogo: HTMLImageElement | null, shade?: { from: number; top: number; bottom: number }): HTMLCanvasElement {
  const card = DESIGN_CARDS[index];
  if (!card) throw new Error('Unknown design clipboard');
  const { w, h } = CLIPBOARD;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * S); canvas.height = Math.round(h * S);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(S, S);
  const random = grain(977 + index * 131);

  // ---- the board: pressed hardboard, its edge worn pale, darker where the light does not reach (the light is upper right)
  const bx = 0; const by = TOP; const bw = w - RIGHT; const bh = h - TOP; const br = 6.5;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, br); ctx.clip();
  const wood = ctx.createLinearGradient(bx + bw, by, bx, by + bh);
  wood.addColorStop(0, '#c08a55'); wood.addColorStop(0.55, '#a8733f'); wood.addColorStop(1, '#8f5e30');
  ctx.fillStyle = wood; ctx.fillRect(bx, by, bw, bh);
  // the pressed fibres: short pale and dark flecks, all lying the same way
  for (let i = 0; i < 1500; i += 1) {
    const x = bx + random() * bw; const y = by + random() * bh; const len = 0.6 + random() * 2.4;
    ctx.strokeStyle = random() > 0.5 ? `rgba(255,232,196,${0.05 + random() * 0.09})` : `rgba(64,36,12,${0.05 + random() * 0.1})`;
    ctx.lineWidth = 0.35 + random() * 0.3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y + (random() - 0.5) * 0.5); ctx.stroke();
  }
  // the board's thickness: its far edges catch the light, its near edges (bottom and left) are in shade
  ctx.lineWidth = 2.6; ctx.strokeStyle = 'rgba(62,35,12,.55)';
  ctx.beginPath(); ctx.roundRect(bx + 0.2, by - 1.4, bw + 1.4, bh + 1.2, br); ctx.stroke();
  ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,228,188,.6)';
  ctx.beginPath(); ctx.roundRect(bx - 1.2, by + 0.7, bw + 0.6, bh + 2, br); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(58,32,10,.5)'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.roundRect(bx + 0.3, by + 0.3, bw - 0.6, bh - 0.6, br - 0.3); ctx.stroke();

  // ---- the paper: a sheet behind, a hair askew, and the sheet on top
  const px = bx + 9; const py = by + 19; const pw = bw - 18; const ph = bh - 19 - 10;
  ctx.save();
  ctx.shadowColor = 'rgba(40,20,4,.5)'; ctx.shadowBlur = 5 * S; ctx.shadowOffsetX = -1.6 * S; ctx.shadowOffsetY = 2.2 * S;
  ctx.translate(px + pw / 2, py + ph / 2); ctx.rotate((index === 1 ? -1.1 : 1.2) * Math.PI / 180);
  ctx.fillStyle = '#ece5d3'; ctx.fillRect(-pw / 2, -ph / 2 + 1.5, pw, ph);
  ctx.restore();
  ctx.save();
  ctx.shadowColor = 'rgba(40,20,4,.3)'; ctx.shadowBlur = 2.2 * S; ctx.shadowOffsetX = -0.7 * S; ctx.shadowOffsetY = 1 * S;
  ctx.fillStyle = '#fcfaf3'; ctx.fillRect(px, py, pw, ph);
  ctx.restore();
  const sheet = ctx.createLinearGradient(px + pw, py, px, py + ph);
  sheet.addColorStop(0, 'rgba(255,255,255,.55)'); sheet.addColorStop(1, 'rgba(150,128,84,.09)');
  ctx.fillStyle = sheet; ctx.fillRect(px, py, pw, ph);

  // ---- what the sheet says (the words keep to the part of the sheet the next clipboard does not cover)
  const pad = 8;
  const ix = px + pad; const iw = pw - pad * 2;
  const tw = shade ? Math.min(iw, shade.from - ix - 9) : iw;
  const picY = py + 21; const picH = Math.round(iw * 0.54);
  if (picture) cover(ctx, picture, ix, picY, iw, picH, 2.5, index === 2 ? 0.55 : 0.45);
  else { ctx.fillStyle = card.band; ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.roundRect(ix, picY, iw, picH, 2.5); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.strokeStyle = 'rgba(24,32,79,.16)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.roundRect(ix, picY, iw, picH, 2.5); ctx.stroke();
  // who it was with, small capitals (P&G's with its mark)
  let y = picY + picH + 13;
  const logo = index === 2 && pgLogo ? 10 : 0;
  if (logo && pgLogo) ctx.drawImage(pgLogo, ix, y - 8.6, logo, logo);
  ctx.font = `700 7.4px ${SANS}`; ctx.fillStyle = 'rgba(24,32,79,.78)'; ctx.textBaseline = 'alphabetic';
  (ctx as Spaced).letterSpacing = '0.5px';
  ctx.fillText(card.partner.toUpperCase(), ix + (logo ? logo + 3 : 0), y);
  (ctx as Spaced).letterSpacing = '0px';
  // the name, in the display face: as large as fits, whole (a short name on one line, a long one on two)
  const most = card.title.split(' ').length > 2 ? 2 : 1;
  let size = 19;
  let name: string[] = [];
  for (; size >= 11; size -= 0.5) {
    ctx.font = `800 ${size}px ${DISPLAY}`;
    name = wrap(ctx, card.title, tw);
    if (name.length <= most && name.every((line) => ctx.measureText(line).width <= tw)) break;
  }
  ctx.fillStyle = NAVY;
  y += size * 0.98 + 3;
  name.forEach((line) => { ctx.fillText(line, ix, y); y += size * 1.04; });
  y -= size * 1.04;
  // a stroke of highlighter in the project's colour under the name
  ctx.fillStyle = card.band; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.roundRect(ix, y + 4.5, 26, 2.8, 1.4); ctx.fill(); ctx.globalAlpha = 1;
  // one line on what it is: whole, in as many lines as it needs, smaller only if it would run into the sheet's foot
  y += 17;
  const foot = py + ph - 8;
  let small = 8.4;
  let lines: string[] = [];
  for (; small >= 7; small -= 0.2) {
    ctx.font = `450 ${small}px ${SANS}`;
    lines = wrap(ctx, card.line, tw);
    if (y + (lines.length - 1) * small * 1.26 <= foot - 11) break;
  }
  ctx.fillStyle = 'rgba(24,32,79,.88)';
  lines.forEach((line) => { ctx.fillText(line, ix, y); y += small * 1.26; });
  // the way in, at the sheet's foot
  ctx.font = `700 7.2px ${SANS}`; ctx.fillStyle = NAVY;
  (ctx as Spaced).letterSpacing = '0.6px';
  const open = 'OPEN CASE STUDY';
  ctx.fillText(open, ix, foot);
  const ax = ix + ctx.measureText(open).width + 4; const ay = foot - 2.6;
  (ctx as Spaced).letterSpacing = '0px';
  ctx.strokeStyle = NAVY; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 7, ay); ctx.moveTo(ax + 4.2, ay - 2.6); ctx.lineTo(ax + 7, ay); ctx.lineTo(ax + 4.2, ay + 2.6); ctx.stroke();

  // ---- the clip: a steel plate riveted to the board, its handle with the hanging hole, its jaw across the paper
  const cx = bx + bw / 2;
  // the handle, rising past the board's top edge
  ctx.save();
  ctx.shadowColor = 'rgba(20,10,2,.4)'; ctx.shadowBlur = 1.5 * S; ctx.shadowOffsetX = -0.5 * S; ctx.shadowOffsetY = 0.8 * S;
  ctx.fillStyle = steel(ctx, 0.5, 13);
  ctx.beginPath(); ctx.roundRect(cx - 15, 0.5, 30, 14, [6.5, 6.5, 0, 0]); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,46,56,.55)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.roundRect(cx - 15, 0.5, 30, 14, [6.5, 6.5, 0, 0]); ctx.stroke();
  // (the hole goes right through: the mat shows in it)
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(cx, 5, 2.7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,46,56,.6)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(cx, 5, 2.9, 0, Math.PI * 2); ctx.stroke();
  // the plate
  const plateY = by + 4; const plateH = 14; const plateW = 66;
  ctx.save();
  ctx.shadowColor = 'rgba(20,10,2,.5)'; ctx.shadowBlur = 2.2 * S; ctx.shadowOffsetX = -0.8 * S; ctx.shadowOffsetY = 1.4 * S;
  ctx.fillStyle = steel(ctx, plateY, plateH);
  ctx.beginPath(); ctx.roundRect(cx - plateW / 2, plateY, plateW, plateH, 3); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,46,56,.5)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.roundRect(cx - plateW / 2, plateY, plateW, plateH, 3); ctx.stroke();
  // its rivets
  for (const rx of [cx - plateW / 2 + 7, cx + plateW / 2 - 7]) {
    const rivet = ctx.createRadialGradient(rx + 0.7, plateY + plateH / 2 - 0.7, 0.2, rx, plateY + plateH / 2, 2.4);
    rivet.addColorStop(0, '#ffffff'); rivet.addColorStop(0.5, '#aab1ba'); rivet.addColorStop(1, '#5d6570');
    ctx.fillStyle = rivet; ctx.beginPath(); ctx.arc(rx, plateY + plateH / 2, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  // the jaw: a rolled steel bar, wider than the plate, pressing the sheets down (its shadow falls on the paper)
  const jawY = plateY + plateH - 1.5; const jawH = 7; const jawW = 88;
  ctx.save();
  ctx.shadowColor = 'rgba(20,10,2,.55)'; ctx.shadowBlur = 2.6 * S; ctx.shadowOffsetX = -0.9 * S; ctx.shadowOffsetY = 1.8 * S;
  ctx.fillStyle = steel(ctx, jawY, jawH);
  ctx.beginPath(); ctx.roundRect(cx - jawW / 2, jawY, jawW, jawH, 3.5); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(40,46,56,.5)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.roundRect(cx - jawW / 2, jawY, jawW, jawH, 3.5); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 0.7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - jawW / 2 + 5, jawY + 1.6); ctx.lineTo(cx + jawW / 2 - 5, jawY + 1.6); ctx.stroke();

  // ---- the next clipboard's shadow, where it lies over this one
  if (shade) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    const reach = 15;
    const across = ctx.createLinearGradient(shade.from - reach, 0, shade.from, 0);
    across.addColorStop(0, 'rgba(8,12,40,0)'); across.addColorStop(0.6, 'rgba(8,12,40,.16)'); across.addColorStop(1, 'rgba(8,12,40,.42)');
    ctx.fillStyle = across;
    ctx.fillRect(shade.from - reach, shade.top + 5, reach, shade.bottom - shade.top);
    ctx.fillStyle = 'rgba(8,12,40,.42)';
    ctx.fillRect(shade.from, shade.top + 5, w - shade.from, shade.bottom - shade.top);
    ctx.restore();
  }
  return canvas;
}

/**
 * Where the clipboard after this one lies over it, for its shadow (page pixels from this one's left and top; the turns
 * are small enough to leave out). Nothing for the last: nothing lies over it.
 */
export function clipboardShade(index: number): { from: number; top: number; bottom: number } | undefined {
  const here = CLIPBOARD_LAY[index]; const next = CLIPBOARD_LAY[index + 1];
  if (!next) return undefined;
  const from = next.x - CLIPBOARD.w / 2 - (here.x - CLIPBOARD.w / 2);
  if (from >= CLIPBOARD.w) return undefined;
  const top = Math.max(0, next.y - here.y + TOP);
  const bottom = Math.min(CLIPBOARD.h, next.y - here.y + CLIPBOARD.h);
  return { from, top, bottom };
}
