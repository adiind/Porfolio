/**
 * Things laid on the home mat that used to be flat HTML over it (Adi, 2026-11-16: the résumé "should be like a document on
 * the mat as well"; the same for "whatever is not 3D"). Each is drawn on a canvas in the page's own materials (the cards'
 * cream paper and its cut edge, navy ink, black) and handed to the stage as a prop, like the poster cards.
 *
 * Sizes are in pixels of the 1440 by 900 drawing of the home page (data/matStage.json's frame). Where a piece stands in for
 * a link that is still real text (the GitHub pill, "See my work"), hero-overlay.css sizes that link's box the same, in
 * container units, so the piece can lie exactly under it at every window size.
 */

export const PAPER = '#fbf6ea';
export const PAPER_EDGE = '#e3d9c0';
export const NAVY = '#18204f';
const SANS = "'FB Geist', Geist, system-ui, sans-serif";
const DISPLAY = "'FB Bricolage', 'FB Geist', system-ui, sans-serif";

/*
 * The GitHub numbers come from the build, as the old home's (components/GitHubActivity.tsx): vite.config.ts counts this
 * site's commits (GitHub, else the local git history, else data/portfolio-source-history.json) and hands them over through
 * `define`. Nothing is asked of GitHub from the browser. When the build has no number or no 12-week history (the JSON
 * fallback has none), the values typed here stand in, each on its own.
 */
type GitActivityDay = { date: string; count: number };
declare const __PORTFOLIO_COMMIT_COUNT__: number | null;
declare const __PORTFOLIO_GIT_ACTIVITY__: GitActivityDay[] | null;
const BUILT_COUNT = typeof __PORTFOLIO_COMMIT_COUNT__ === 'number' && Number.isFinite(__PORTFOLIO_COMMIT_COUNT__) ? __PORTFOLIO_COMMIT_COUNT__ : null;
const BUILT_DAYS = typeof __PORTFOLIO_GIT_ACTIVITY__ !== 'undefined' && Array.isArray(__PORTFOLIO_GIT_ACTIVITY__) && __PORTFOLIO_GIT_ACTIVITY__.length === 84
  ? __PORTFOLIO_GIT_ACTIVITY__ : null;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-10-27" as "27 Oct 2026" */
const dayName = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1] ?? ''} ${y}`; };
/** The 12 weeks as levels 0 to 4, oldest first, 7 days to a column: the old home's own scale (its ContributionChart). */
const levelsOf = (days: GitActivityDay[]) => {
  const max = Math.max(1, ...days.map((day) => day.count));
  return days.map((day) => (day.count === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((day.count / max) * 4))))).join('');
};
const titleOf = (days: GitActivityDay[]) => {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const active = days.filter((day) => day.count > 0).length;
  return `${total} commit${total === 1 ? '' : 's'} on ${active} active day${active === 1 ? '' : 's'} in the 12 weeks ending ${dayName(days[days.length - 1].date)}`;
};

/** The GitHub numbers, one place for the sticker and the real link (HeroOverlay). */
export const GITHUB = {
  href: 'https://github.com/adiind/Porfolio',
  /** (typed fallback: 306, the count on 16 Nov 2026) */
  commits: BUILT_COUNT ?? 306,
  /** Contribution levels (0 to 4) for the last 12 weeks, 7 days per column (typed fallback: copied from the prototype's pill). */
  levels: BUILT_DAYS ? levelsOf(BUILT_DAYS) : '111111114411111100000000100300000000000000000000011000001000020000020230120000030101',
  title: BUILT_DAYS ? titleOf(BUILT_DAYS) : '117 commits on 30 active days in the 12 weeks ending 27 Oct 2026',
} as const;

/** The pieces' sizes in page pixels. */
export const PIECE_SIZE = {
  github: { w: 340, h: 40 },
  work: { w: 170, h: 50 },
} as const;

/** The résumé page that lies on the mat: page 1 of the PDF, rasterised to WebP (1240 by 1754). */
export const RESUME_PAGE = '/images/mat/resume-p1.webp';
export const RESUME_PDF = '/Adi_Agarwal_Resume_2026.pdf';

/** A piece to lay on the stage: its picture and its size in page pixels. */
export interface MatPiece { image: HTMLCanvasElement; w: number; h: number }

type Ctx = CanvasRenderingContext2D;
/** canvas pixels per page pixel: sharp when the camera comes down to it */
const S = 3;

function canvasFor(w: number, h: number, scale = S): [HTMLCanvasElement, Ctx | null] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  ctx?.scale(scale, scale);
  return [canvas, ctx];
}

function text(ctx: Ctx, s: string, x: number, y: number, font: string, color: string, spacing = 0) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = `${spacing}px`;
  ctx.fillText(s, x, y);
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = '0px';
}

/** A seeded scatter, so the paper's tooth is the same on every visit. */
function tooth(ctx: Ctx, w: number, h: number, density = 0.06) {
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < w * h * density; i += 1) {
    ctx.fillStyle = rnd() < 0.5 ? 'rgba(120,100,60,.05)' : 'rgba(255,255,255,.18)';
    ctx.fillRect(rnd() * w, rnd() * h, 0.5, 0.5);
  }
}

const GITHUB_PATH = 'M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z';
const LEVEL_COLOURS = ['rgba(24,32,79,.13)', '#7bd88f', '#40c463', '#30a14e', '#216e39'];

/**
 * The tools this site was built with, in the order the old home's GitHub card and the phone page show them: Google Antigravity,
 * OpenAI Codex, Anthropic Claude, Cursor, Grok bot, Muse. One strip picture (public/images/mat/tool-marks.webp), six cells of 64 by 64,
 * each the mark as the phone page draws it (Cursor's white mark on its navy tile; Codex and Muse on their own white squares).
 */
export const TOOL_MARK_COUNT = 6;
export const TOOL_MARKS_LABEL = 'Google Antigravity, OpenAI Codex, Anthropic Claude, Cursor, Grok bot and Muse';

/** The GitHub pill as a paper sticker: cream, navy print, the tools it was built with, the 12-week grid in GitHub's greens, its far end catching the light. `scale`: drawn larger, for narrow windows. `marks`: the strip of tool marks (left out, the sticker is the plain pill). */
export function drawGithubSticker(scale = 1, marks?: HTMLImageElement): MatPiece {
  const { w, h } = PIECE_SIZE.github;
  const [canvas, ctx] = canvasFor(w * scale, h * scale);
  if (!ctx) return { image: canvas, w: w * scale, h: h * scale };
  ctx.scale(scale, scale);
  ctx.save();
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, h / 2); ctx.clip();
  ctx.fillStyle = '#fbf8f0'; ctx.fillRect(0, 0, w, h);
  const light = ctx.createLinearGradient(w, 0, 0, h);
  light.addColorStop(0, 'rgba(255,255,255,.35)'); light.addColorStop(1, 'rgba(120,100,60,.06)');
  ctx.fillStyle = light; ctx.fillRect(0, 0, w, h);
  tooth(ctx, w, h);
  // the sticker's far end lifts a hair off the mat: a bright rim there
  const rim = ctx.createLinearGradient(w - 26, 0, w, 0);
  rim.addColorStop(0, 'rgba(255,255,255,0)'); rim.addColorStop(1, 'rgba(255,255,255,.75)');
  ctx.fillStyle = rim; ctx.fillRect(w - 26, 0, 26, h);
  ctx.restore();
  ctx.strokeStyle = PAPER_EDGE; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(0.5, 0.5, w - 1, h - 1, h / 2 - 0.5); ctx.stroke();
  ctx.save(); ctx.translate(13, h / 2 - 9); ctx.scale(18 / 24, 18 / 24); ctx.fillStyle = NAVY; ctx.fill(new Path2D(GITHUB_PATH)); ctx.restore();
  const count = String(GITHUB.commits);
  text(ctx, count, 39, h / 2 + 5.6, `800 16px ${DISPLAY}`, NAVY, -0.3);
  ctx.font = `800 16px ${DISPLAY}`;
  const cw = ctx.measureText(count).width;
  text(ctx, 'commits', 39 + cw + 4, h / 2 + 5, `500 13px ${SANS}`, NAVY);
  if (marks && marks.naturalWidth > 0) {
    ctx.font = `500 13px ${SANS}`;
    const textEnd = 39 + cw + 4 + ctx.measureText('commits').width;
    const rule = (x: number) => { ctx.fillStyle = 'rgba(24,32,79,.16)'; ctx.fillRect(Math.round(x), h / 2 - 8, 1, 16); };
    rule(textEnd + 11);
    const size = 16; const step = 20; const x0 = textEnd + 23;
    for (let i = 0; i < TOOL_MARK_COUNT; i++) {
      ctx.drawImage(marks, i * 64, 0, 64, 64, x0 + i * step, h / 2 - size / 2, size, size);
    }
    rule(x0 + TOOL_MARK_COUNT * step - 4 + 11);
  }
  const cell = 3.05; const gap = 0.8;
  const gx = w - 16 - 12 * (cell + gap); const gy = h / 2 - (7 * (cell + gap) - gap) / 2;
  GITHUB.levels.split('').forEach((level, i) => {
    ctx.fillStyle = LEVEL_COLOURS[Number(level)];
    ctx.beginPath(); ctx.roundRect(gx + Math.floor(i / 7) * (cell + gap), gy + (i % 7) * (cell + gap), cell, cell, 0.8); ctx.fill();
  });
  return { image: canvas, w: w * scale, h: h * scale };
}

/** "See my work" as a stiff black tag: clipped corners at its left end, a punched hole, the arrow down. Still a button. */
export function drawWorkTag(scale = 1): MatPiece {
  const { w, h } = PIECE_SIZE.work;
  const [canvas, ctx] = canvasFor(w * scale, h * scale);
  if (!ctx) return { image: canvas, w: w * scale, h: h * scale };
  ctx.scale(scale, scale);
  const r = 9; const cut = 13;
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(cut, 0); ctx.lineTo(w - r, 0); ctx.arcTo(w, 0, w, r, r); ctx.lineTo(w, h - r); ctx.arcTo(w, h, w - r, h, r);
    ctx.lineTo(cut, h); ctx.lineTo(0, h - cut); ctx.lineTo(0, cut); ctx.closePath();
  };
  outline(); ctx.fillStyle = '#0b0c10'; ctx.fill();
  ctx.save(); outline(); ctx.clip();
  const sheen = ctx.createLinearGradient(w, 0, 0, h);
  sheen.addColorStop(0, 'rgba(255,255,255,.12)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen; ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // the punched hole: the mat shows through it, its cut edge catching a little light
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(16, h / 2, 3.3, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(16, h / 2, 3.7, -Math.PI * 0.9, Math.PI * 0.1); ctx.stroke();
  text(ctx, 'See my work', 33, h / 2 + 5.8, `600 16.5px ${SANS}`, '#ffffff', -0.2);
  const ax = w - 22; const ay = h / 2;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay - 6.5); ctx.lineTo(ax, ay + 6.5); ctx.moveTo(ax - 5, ay + 1.5); ctx.lineTo(ax, ay + 6.5); ctx.lineTo(ax + 5, ay + 1.5); ctx.stroke();
  return { image: canvas, w: w * scale, h: h * scale };
}

/**
 * The résumé: page 1 of the real PDF on an A4 sheet of slightly warm office paper, its near right corner lifting (the
 * bend is the engine's: StageProp.curl; the light on the bend is painted here), held to the mat by a torn strip of cream
 * tape that carries its label. Drawn at the page picture's own resolution, so the close-up stays sharp.
 * `sheetW`: the paper's width in page pixels. The piece is a little larger than the paper: the tape stands off its top.
 */
export function drawResumeSheet(page: HTMLImageElement, sheetW: number, label = 'Résumé', labelPx = 13): MatPiece & { paperH: number } {
  const sw = sheetW; const sh = (sw * 297) / 210;
  // (the tape stands almost all above the paper, over its top edge by 4 px: it never covers the page's heading)
  const th = Math.round(labelPx * 1.65);
  const top = th - 2; const side = 5;
  const w = sw + side * 2; const h = sh + top + side;
  const [canvas, ctx] = canvasFor(w, h, Math.max(3, page.naturalWidth / sw));
  if (!ctx) return { image: canvas, w, h, paperH: sh };
  ctx.fillStyle = '#fffdf8'; ctx.fillRect(side, top, sw, sh);
  ctx.drawImage(page, side, top, sw, sh);
  // the lifted corner: a soft fold line, then brighter where it turns toward the window
  const cx = side + sw; const cy = top + sh;
  ctx.save();
  ctx.beginPath(); ctx.rect(side, top, sw, sh); ctx.clip();
  const fold = ctx.createLinearGradient(cx - sw * 0.33, cy - sw * 0.23, cx, cy);
  fold.addColorStop(0, 'rgba(255,255,255,0)'); fold.addColorStop(0.55, 'rgba(255,255,255,0)'); fold.addColorStop(0.62, 'rgba(24,32,79,.07)');
  fold.addColorStop(0.7, 'rgba(255,255,255,.22)'); fold.addColorStop(1, 'rgba(255,255,255,.5)');
  ctx.fillStyle = fold; ctx.fillRect(cx - sw * 0.42, cy - sw * 0.37, sw * 0.42, sw * 0.37);
  ctx.restore();
  ctx.strokeStyle = 'rgba(160,150,120,.45)'; ctx.lineWidth = 0.3; ctx.strokeRect(side + 0.15, top + 0.15, sw - 0.3, sh - 0.3);
  // the tape: cream, a little see-through, torn ends, turned a few degrees, its label in navy
  ctx.save();
  ctx.translate(side + sw * 0.5, top + 4 - th / 2);
  ctx.rotate((-3 * Math.PI) / 180);
  ctx.font = `650 ${labelPx}px ${SANS}`;
  const tw = Math.max(sw * 0.5, ctx.measureText(label).width + labelPx * 1.9);
  const teeth = 6;
  ctx.beginPath();
  ctx.moveTo(-tw / 2, -th / 2); ctx.lineTo(tw / 2, -th / 2);
  for (let i = 1; i <= teeth; i += 1) ctx.lineTo(tw / 2 + (i % 2 ? 1.3 : 0), -th / 2 + (th * i) / teeth);
  ctx.lineTo(-tw / 2, th / 2);
  for (let i = 1; i <= teeth; i += 1) ctx.lineTo(-tw / 2 - (i % 2 ? 1.3 : 0), th / 2 - (th * i) / teeth);
  ctx.closePath();
  ctx.fillStyle = 'rgba(251,246,234,.94)'; ctx.fill();
  ctx.strokeStyle = 'rgba(227,217,192,.9)'; ctx.lineWidth = 0.45; ctx.stroke();
  ctx.fillStyle = NAVY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 0.5);
  ctx.restore();
  return { image: canvas, w, h, paperH: sh };
}
