/**
 * The three human-centered design case studies (Northwestern EDI) as cards dealt from the "design" poster on the mat, the
 * way Food Rescue, Self and Snapdeal deal theirs. One card per project: its picture, its partner, its name, one line on what
 * it is, and "Open the case study". Clicking a card opens it.
 *
 * Words: only what the live site already says (branch main): data/projects/<id>.json hero titles and one-liners,
 * data/timeline.ts subtitles, and for P&G only the public words of its card and page ("P&G sponsored", the one-liner,
 * its skill labels). No new numbers or claims. Pictures: the ones the live site uses (data/timeline.ts imageUrl for
 * FamilySync and Squad Up; for P&G the illustrated room from its public story page, never pg-design-project.jpg).
 */

/** The pictures the cards draw with, fetched once the room is lit (never before: none of them is seen until the poster is picked up). */
export const DESIGN_PICTURES = ['/images/familysync_jpmorgan_chase.webp', '/images/mcdonalds_order.webp', '/images/pg/rooms/room-hero.webp'] as const;
export const DESIGN_PG_MARK = '/images/pg/pg-logo-official.svg';

export interface DesignCard {
  /** the case study's id: its page is /work/<id> */
  id: string;
  href: string;
  title: string;
  partner: string;
  line: string;
  kind: string;
  picture: string;
  /** the project's own colour on the site (its themeColor), for the band along the card's foot */
  band: string;
}

export const DESIGN_CARDS: DesignCard[] = [
  {
    id: 'familysync-jpmorgan', href: '/work/familysync-jpmorgan', title: 'FamilySync', partner: 'with JPMorgan Chase',
    line: 'An agent that coordinates a family when a child’s day changes.', kind: 'Human-centered service design',
    picture: '/images/familysync_jpmorgan_chase.webp', band: '#059669',
  },
  {
    id: 'mcdonalds-interaction-design', href: '/work/mcdonalds-interaction-design', title: 'Squad Up', partner: 'with McDonald’s',
    line: 'One shared cart for the whole group, with visible ownership.', kind: 'Human-centered interaction design',
    picture: '/images/mcdonalds_order.webp', band: '#d97706',
  },
  {
    id: 'pg-haircare', href: '/work/pg-haircare', title: 'Hair Care Product Packaging', partner: 'P&G sponsored',
    line: 'Rethinking the bottle, and the routine around it.', kind: 'Consumer research · Packaging design',
    picture: '/images/pg/rooms/room-hero.webp', band: '#4f46e5',
  },
];

/** The cards are the poster's size, in page pixels (data/matStage.json's design poster), drawn at 3 canvas pixels each. */
const S = 3;
const PAPER = '#fbf6ea';
const EDGE = '#e3d9c0';
const NAVY = '#18204f';
const SANS = "'FB Geist', Geist, system-ui, sans-serif";
const DISPLAY = "'FB Bricolage', 'FB Geist', system-ui, sans-serif";

type Ctx = CanvasRenderingContext2D;

function wrap(ctx: Ctx, text: string, width: number): string[] {
  const out: string[] = []; let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

/** The picture, cut to fill a box (its middle kept), with round corners. */
function cover(ctx: Ctx, image: HTMLImageElement, x: number, y: number, w: number, h: number, r: number, focusY = 0.5) {
  const iw = image.naturalWidth || 1; const ih = image.naturalHeight || 1;
  const k = Math.max(w / iw, h / ih);
  const sw = w / k; const sh = h / k;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
  ctx.drawImage(image, (iw - sw) / 2, Math.max(0, Math.min(ih - sh, (ih - sh) * focusY)), sw, sh, x, y, w, h);
  ctx.restore();
}

/**
 * One case-study card, w by h page pixels: cream card paper, the picture across its top, the partner on a small cream tab
 * over the picture's foot, the name, its line, what kind of work it was, "Open the case study" in navy, and the project's
 * colour along its foot (the edge that shows when the cards lie under the poster).
 */
export function drawDesignCard(index: number, picture: HTMLImageElement | null, pgLogo: HTMLImageElement | null, w: number, h: number, radius: number): HTMLCanvasElement {
  const card = DESIGN_CARDS[index];
  if (!card) throw new Error('Unknown design card');
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * S); canvas.height = Math.round(h * S);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(S, S);
  ctx.save();
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, radius); ctx.clip();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
  const light = ctx.createLinearGradient(w, 0, 0, h);
  light.addColorStop(0, 'rgba(255,255,255,.35)'); light.addColorStop(1, 'rgba(120,100,60,.06)');
  ctx.fillStyle = light; ctx.fillRect(0, 0, w, h);
  // the project's colour along the foot
  ctx.fillStyle = card.band; ctx.fillRect(0, h - 6, w, 6);
  ctx.restore();
  ctx.strokeStyle = EDGE; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(0.5, 0.5, w - 1, h - 1, radius - 0.5); ctx.stroke();
  // the picture
  const pad = 10;
  const ph = Math.round(h * 0.47);
  // (until its picture has come in: the picture's place in the project's colour, softened; drawn again once it has)
  if (picture) cover(ctx, picture, pad, pad, w - pad * 2, ph, radius * 0.62, index === 2 ? 0.55 : 0.45);
  else {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(pad, pad, w - pad * 2, ph, radius * 0.62); ctx.clip();
    ctx.fillStyle = card.band; ctx.fillRect(pad, pad, w - pad * 2, ph);
    ctx.fillStyle = 'rgba(251,246,234,.55)'; ctx.fillRect(pad, pad, w - pad * 2, ph);
    ctx.restore();
  }
  // the partner, on a small cream tab over the picture's foot
  ctx.font = `700 10.5px ${SANS}`;
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = '0.6px';   // (measured as drawn, spacing and all)
  const logo = index === 2 && pgLogo ? 15 : 0;
  const tw = ctx.measureText(card.partner.toUpperCase()).width + 16 + (logo ? logo + 4 : 0);
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = '0px';
  const tx = pad + 8; const ty = pad + ph - 11;
  ctx.fillStyle = PAPER; ctx.beginPath(); ctx.roundRect(tx, ty, tw, 21, 10.5); ctx.fill();
  ctx.strokeStyle = 'rgba(24,32,79,.12)'; ctx.stroke();
  if (logo && pgLogo) ctx.drawImage(pgLogo, tx + 4, ty + 3, logo, logo);
  ctx.fillStyle = NAVY; ctx.textBaseline = 'middle';
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = '0.6px';
  ctx.fillText(card.partner.toUpperCase(), tx + 8 + (logo ? logo + 3 : 0), ty + 11);
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = '0px';
  ctx.textBaseline = 'alphabetic';
  // the name (it shrinks to fit one line)
  const inner = w - 2 * (pad + 4);
  let size = 26;
  do { ctx.font = `800 ${size}px ${DISPLAY}`; if (ctx.measureText(card.title).width <= inner) break; size -= 1; } while (size > 15);
  let y = pad + ph + 20 + size * 0.82;
  ctx.fillStyle = NAVY; ctx.fillText(card.title, pad + 4, y);
  // what it is, in a line or two
  ctx.font = `450 13px ${SANS}`; ctx.fillStyle = 'rgba(24,32,79,.86)';
  y += 19;
  wrap(ctx, card.line, inner).slice(0, 2).forEach((line) => { ctx.fillText(line, pad + 4, y); y += 16; });
  // the kind of work, small
  ctx.fillStyle = 'rgba(24,32,79,.6)';
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = '0.8px';
  // (it shrinks to fit one line)
  let kindSize = 10;
  do { ctx.font = `600 ${kindSize}px ${SANS}`; if (ctx.measureText(card.kind.toUpperCase()).width <= inner) break; kindSize -= 0.25; } while (kindSize > 8);
  ctx.fillText(card.kind.toUpperCase(), pad + 4, Math.min(y + 6, h - 50));
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = '0px';
  // the way in: a navy tab with an arrow
  const by = h - 42; const bh = 26;
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.roundRect(pad, by, w - pad * 2, bh, 13); ctx.fill();
  ctx.font = `650 12.5px ${SANS}`; ctx.fillStyle = PAPER; ctx.textBaseline = 'middle';
  ctx.fillText('Open the case study', pad + 14, by + bh / 2 + 0.5);
  const ax = w - pad - 18; const ay = by + bh / 2;
  ctx.strokeStyle = PAPER; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(ax - 6, ay); ctx.lineTo(ax + 5, ay); ctx.moveTo(ax + 1, ay - 4); ctx.lineTo(ax + 5, ay); ctx.lineTo(ax + 1, ay + 4); ctx.stroke();
  ctx.textBaseline = 'alphabetic';
  return canvas;
}

/** Where the three cards lie under the poster at rest, from the poster's place: a little lower each, a little turned. */
export const DESIGN_UNDER = [
  { dx: -1, dy: 23, turn: -0.6 },
  { dx: 4, dy: 15, turn: 1.3 },
  { dx: -3, dy: 8, turn: -1.5 },
] as const;

/**
 * A card as it lies under the poster: the card itself, with the poster's shadow painted across it just below the
 * poster's foot (shadows on the mat are drawn under every card, so a card cannot take another's shadow by itself).
 * `dy`: how much lower than the poster it lies, in page pixels.
 */
export function drawDesignUnder(card: HTMLCanvasElement, w: number, h: number, dy: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = card.width; canvas.height = card.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(card, 0, 0);
  ctx.save();
  ctx.scale(canvas.width / w, canvas.height / h);
  ctx.globalCompositeOperation = 'source-atop';
  const edge = h - dy;
  const shade = ctx.createLinearGradient(0, edge - 2, 0, edge + 16);
  shade.addColorStop(0, 'rgba(2,10,44,.42)'); shade.addColorStop(0.35, 'rgba(2,10,44,.2)'); shade.addColorStop(1, 'rgba(2,10,44,0)');
  ctx.fillStyle = shade; ctx.fillRect(0, edge - 2, w, 18);
  ctx.restore();
  return canvas;
}
