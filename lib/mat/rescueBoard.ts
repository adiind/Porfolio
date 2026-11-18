/**
 * Food Rescue: the paper. Draws the order-log board and the "My part" sheet onto canvases (rescueDesk.ts lays them on the mat).
 *
 * Every word comes from rescueJourney.ts. Nothing here rewrites the story.
 * The wide board is an order-tracking log (a line down the left, seven numbered stops). The narrow board is a phone
 * version: seven tappable chips and the current event, large. Every row keeps its space from the first frame, so
 * nothing moves when a row gets printed.
 */
import { journeySteps, header, result, gains, myPart, type Tone } from './rescueJourney';
import { BOARD_PX } from './rescueLayout';

export interface BoardState {
  /** the event showing now, 0-based (0..6) */
  step: number;
  /** seconds since that event began (for a row's arrival) */
  sinceStep: number;
  /** the journey is over: the result block (and on a phone, "My part") is showing */
  done: boolean;
  /** seconds since `done` became true */
  sinceDone: number;
}

export interface RescueSheet {
  readonly canvas: HTMLCanvasElement;
  /** Repaint for this moment. Returns true when the picture changed (the caller then re-uploads the texture). */
  draw(state: BoardState): boolean;
  /** Which event's row is at this point of the sheet (u, v from 0 to 1, origin at the top-left), or null. */
  rowAt(u: number, v: number): number | null;
}

export interface BoardArt { offer: CanvasImageSource | null }

// ---------- look (the same paper family as lib/mat/foodRescueCards.ts, white inks) ----------
const RED = '#e23744';
const INK = '#231a1a';
const BODY = '#4a3f3f';
const NOTE = 'rgba(35,26,26,0.55)';
const RULE = 'rgba(35,26,26,0.14)';
const GROUND = '#fffdfa';
const TONE: Record<Tone, string> = { go: '#1f8a4c', stop: RED, pay: '#b97a10' };
const TONE_TINT: Record<Tone, string> = { go: 'rgba(31,138,76,0.09)', stop: 'rgba(226,55,68,0.09)', pay: 'rgba(185,122,16,0.11)' };
const BRICO = `'FB Bricolage', 'FB Geist', system-ui, sans-serif`;
const SANS = `'FB Geist', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`;
const RADIUS = 40;
const ARRIVE = 0.3;
const RESULT_IN = 0.45;
const SLIDE = 16;

type G = CanvasRenderingContext2D;
const font = (g: G, weight: number, px: number, fam: string) => { g.font = `${weight} ${px}px ${fam}`; };
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

function roundRect(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** The sheet of white paper: transparent outside the rounded corners, the soft light in the top-left. */
function paintPaper(g: G, w: number, h: number) {
  g.clearRect(0, 0, w, h);
  g.save();
  roundRect(g, 0, 0, w, h, RADIUS); g.clip();
  g.fillStyle = GROUND; g.fillRect(0, 0, w, h);
  const lift = g.createRadialGradient(w * 0.1, 0, 0, w * 0.1, 0, h * 1.02);
  lift.addColorStop(0, 'rgba(255,255,255,1)'); lift.addColorStop(1, 'rgba(244,236,230,0.9)');
  g.fillStyle = lift; g.fillRect(0, 0, w, h);
  g.restore();
}

// ---------- text helpers ----------
interface Word { t: string; bold: boolean }
interface Run { t: string; bold: boolean; x: number }

/** A why line: "Rule:" and any figure in it are set bold. */
function whyWords(s: string): Word[] {
  return s.split(/\s+/).map((t) => ({ t, bold: t === 'Rule:' || /\d/.test(t) }));
}

function measureWord(g: G, wd: Word, px: number) { font(g, wd.bold ? 800 : 400, px, SANS); return g.measureText(wd.t).width; }

/** Greedy wrap of mixed-weight words into lines of runs. Returns the lines (each a list of word runs). */
function wrapWords(g: G, words: Word[], px: number, maxW: number): Run[][] {
  font(g, 400, px, SANS);
  const space = g.measureText(' ').width;
  const lines: Run[][] = [[]]; let x = 0;
  for (const wd of words) {
    const w = measureWord(g, wd, px);
    const cur = lines[lines.length - 1];
    if (cur.length && x + space + w > maxW) { lines.push([]); x = 0; }
    const line = lines[lines.length - 1];
    if (line.length) x += space;
    line.push({ t: wd.t, bold: wd.bold, x }); x += w;
  }
  return lines;
}

/** Wrap, then if the last line is a lone word, narrow the width until it is not (same number of lines). */
function wrapNice(g: G, words: Word[], px: number, maxW: number): Run[][] {
  let lines = wrapWords(g, words, px, maxW);
  if (lines.length < 2 || lines[lines.length - 1].length > 1) return lines;
  const n = lines.length;
  for (let w = maxW - 12; w > maxW * 0.6; w -= 12) {
    const trial = wrapWords(g, words, px, w);
    if (trial.length !== n) break;
    if (trial[trial.length - 1].length > 1) { lines = trial; break; }
  }
  return lines;
}

const plain = (s: string): Word[] => s.split(/\s+/).map((t) => ({ t, bold: false }));

function drawRuns(g: G, lines: Run[][], px: number, x: number, y: number, lh: number, col: string) {
  g.textBaseline = 'alphabetic'; g.fillStyle = col; g.textAlign = 'left';
  lines.forEach((line, i) => {
    for (const r of line) { font(g, r.bold ? 800 : 400, px, SANS); g.fillText(r.t, x + r.x, y + i * lh + px * 0.82); }
  });
  void lh;
}

function fillTextAt(g: G, text: string, x: number, baseline: number, weight: number, px: number, fam: string, col: string, align: CanvasTextAlign = 'left') {
  font(g, weight, px, fam); g.fillStyle = col; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(text, x, baseline);
  g.textAlign = 'left';
}

/** Largest bricolage size up to startPx where one line fits maxW. */
function fitOne(g: G, text: string, weight: number, fam: string, maxW: number, startPx: number, minPx: number) {
  let px = startPx; font(g, weight, px, fam);
  while (g.measureText(text).width > maxW && px > minPx) { px -= 2; font(g, weight, px, fam); }
  return px;
}

const fontsKey = () => {
  try { return document.fonts.check(`800 20px 'FB Bricolage'`) && document.fonts.check(`400 20px 'FB Geist'`) && document.fonts.check(`800 20px 'FB Geist'`) ? 'f1' : 'f0'; } catch { return 'f0'; }
};

// =====================================================================================================================
// WIDE BOARD (1100 x 2000)
// =====================================================================================================================
const WW = BOARD_PX.wide.w, WH = BOARD_PX.wide.h;
const PADX = 66;
const NODE_R = 32;
const NODE_CX = PADX + NODE_R + 6;
const TEXT_X = 176;
const TEXT_R = WW - PADX;
const LINE_PX = 36;
const LINE_LH = 46;
const TITLE_PX = 48;
const HEAD_H = 64;

interface WideRow { y: number; h: number; cy: number; lineLines: Run[][]; whyLines: Run[][] | null; whyPx: number; whyH: number; lineY: number; whyY: number }
interface WideLayout {
  rows: WideRow[];
  rule1: number;
  result: { y: number; figY: number; figPx: number; capX: number; capLines: Run[][]; capPx: number; capY: number; gainRows: { y: number; lines: Run[][] }[]; whoW: number; pressY: number; pressLines: Run[][] };
}

function layoutWide(g: G): WideLayout {
  // ----- result block (measured first: the log gets what is left) -----
  const resultInner = WW - PADX * 2;
  const figPx = 128;
  font(g, 800, figPx, BRICO);
  const figW = g.measureText(result.figure).width;
  const capX = PADX + figW + 34;
  const capPx = 40;
  const capLines = wrapNice(g, plain(result.caption), capPx, WW - PADX - capX);
  const figH = 112;
  font(g, 800, 36, SANS);
  const whoW = Math.max(...gains.map((x) => g.measureText(x.who).width)) + 28;
  const gainRows: { y: number; lines: Run[][] }[] = [];
  const GAIN_LH = 44;
  let gy = 0;
  for (const gn of gains) {
    const lines = wrapNice(g, plain(gn.text), 36, resultInner - whoW);
    gainRows.push({ y: gy, lines }); gy += lines.length * GAIN_LH + 8;
  }
  const gainsH = gy - 8;
  const pressPx = 32;
  const pressLines = wrapNice(g, plain(result.press), pressPx, resultInner);
  const pressH = pressLines.length * 40;
  const resultH = 30 + figH + 24 + gainsH + 18 + pressH + 38;
  const resultY = WH - resultH;

  // ----- log rows -----
  const top = 290;
  const logBottom = resultY - 30;
  const trials: { whyPx: number; pad: number; gap: number }[] = [];
  for (const whyPx of [36, 34]) for (const pad of [16, 12]) for (const gap of [26, 20, 14, 10]) trials.push({ whyPx, pad, gap });
  let chosen: { rows: WideRow[]; end: number } | null = null;
  for (let ti = 0; ti < trials.length + 1; ti++) {
    const t = trials[Math.min(ti, trials.length - 1)];
    const rows: WideRow[] = []; let y = top;
    const lineW = TEXT_R - TEXT_X;
    const whyW = lineW - 8 - 20 - 20;
    for (const s of journeySteps) {
      const lineLines = wrapNice(g, plain(s.line), LINE_PX, lineW);
      const lineY = y + HEAD_H + 6;
      let h = HEAD_H + 6 + lineLines.length * LINE_LH;
      let whyLines: Run[][] | null = null; let whyH = 0; let whyY = 0;
      if (s.why) {
        whyLines = wrapNice(g, whyWords(s.why), t.whyPx, whyW);
        const lh = Math.round(t.whyPx * 1.22);
        whyH = t.pad * 2 + whyLines.length * lh;
        whyY = y + h + 10; h += 10 + whyH;
      }
      rows.push({ y, h, cy: y + HEAD_H / 2, lineLines, whyLines, whyPx: t.whyPx, whyH, lineY, whyY });
      y += h + t.gap;
    }
    const end = y - t.gap;
    chosen = { rows, end };
    if (end <= logBottom) break;
  }
  const rows = chosen!.rows;
  // spread leftover room into the gaps (never more than 18 px extra each)
  const slack = logBottom - chosen!.end;
  if (slack > 0) {
    const extra = Math.min(18, Math.floor(slack / (rows.length - 1)));
    rows.forEach((r, i) => { const dy = extra * i; r.y += dy; r.cy += dy; r.lineY += dy; r.whyY += dy; });
  }
  const res = {
    y: resultY, figY: resultY + 30 + figH, figPx, capX, capLines, capPx,
    capY: resultY + 30 + (figH - capLines.length * capPx * 1.15) / 2 + 2,
    gainRows: gainRows.map((r) => ({ y: resultY + 30 + figH + 24 + r.y, lines: r.lines })), whoW,
    pressY: resultY + 30 + figH + 24 + gainsH + 18, pressLines,
  };
  return { rows, rule1: 262, result: res };
}

function drawWide(g: G, st: BoardState, L: WideLayout, resultAlpha: number) {
  paintPaper(g, WW, WH);
  g.save(); roundRect(g, 0, 0, WW, WH, RADIUS); g.clip();

  // header
  fillTextAt(g, header.project, PADX, 132, 800, 92, BRICO, INK);
  fillTextAt(g, `${header.company} · ${header.role} · ${header.years}`, PADX, 184, 400, 34, SANS, BODY);
  const kick = fitOne(g, header.kicker, 400, SANS, 640, 36, 32);
  fillTextAt(g, header.kicker, PADX, 238, 400, kick, SANS, INK);
  // the "example" label
  font(g, 800, 32, SANS);
  const exW = g.measureText(header.example).width + 40;
  const exX = WW - PADX - exW;
  roundRect(g, exX, 238 - 38, exW, 52, 26); g.fillStyle = 'rgba(35,26,26,0.05)'; g.fill();
  g.strokeStyle = 'rgba(35,26,26,0.28)'; g.lineWidth = 2; g.stroke();
  fillTextAt(g, header.example, exX + exW / 2, 238 - 38 + 36, 800, 32, SANS, NOTE, 'center');
  g.fillStyle = RULE; g.fillRect(PADX, L.rule1, WW - PADX * 2, 3);

  // tracking line segments first (nodes sit on top)
  const p = st.done ? 1 : ease(st.sinceStep / ARRIVE);
  const reached = (i: number) => (st.done ? true : i <= st.step);
  journeySteps.forEach((s, i) => {
    if (i === 0) return;
    const a = L.rows[i - 1], b = L.rows[i];
    const y0 = a.cy + NODE_R + (i - 1 === st.step && !st.done ? 14 : 8);
    const y1 = b.cy - NODE_R - 8;
    g.lineCap = 'round';
    let solidTo = y0;
    if (reached(i) && !(i === st.step && !st.done)) solidTo = y1;
    else if (i === st.step && !st.done) solidTo = y0 + (y1 - y0) * p;
    if (solidTo > y0 + 0.5) {
      g.setLineDash([]); g.strokeStyle = TONE[s.tone]; g.lineWidth = 7;
      g.beginPath(); g.moveTo(NODE_CX, y0); g.lineTo(NODE_CX, solidTo); g.stroke();
    }
    if (solidTo < y1 - 0.5) {
      g.setLineDash([0.1, 16]); g.strokeStyle = 'rgba(35,26,26,0.26)'; g.lineWidth = 6;
      g.beginPath(); g.moveTo(NODE_CX, Math.max(solidTo + 10, y0)); g.lineTo(NODE_CX, y1); g.stroke();
      g.setLineDash([]);
    }
  });

  // rows
  journeySteps.forEach((s, i) => {
    const r = L.rows[i];
    const isCur = !st.done && i === st.step;
    const printed = st.done || i <= st.step;
    const tone = TONE[s.tone];
    const pp = isCur ? p : 1;
    // node
    g.setLineDash([]);
    if (isCur) {
      g.globalAlpha = 0.38 * pp; g.strokeStyle = tone; g.lineWidth = 5;
      g.beginPath(); g.arc(NODE_CX, r.cy, NODE_R + 10, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
    }
    g.beginPath(); g.arc(NODE_CX, r.cy, NODE_R, 0, Math.PI * 2);
    g.fillStyle = GROUND; g.fill();
    if (printed) {
      g.globalAlpha = pp; g.fillStyle = tone; g.fill(); g.globalAlpha = 1;
      if (pp < 1) { g.strokeStyle = 'rgba(35,26,26,0.3)'; g.lineWidth = 3.5; g.globalAlpha = 1 - pp; g.stroke(); g.globalAlpha = 1; }
    } else { g.strokeStyle = 'rgba(35,26,26,0.28)'; g.lineWidth = 3.5; g.stroke(); }
    const numCol = printed ? `rgba(255,255,255,${0.35 + 0.65 * pp})` : 'rgba(35,26,26,0.32)';
    fillTextAt(g, s.n, NODE_CX, r.cy + 11, 800, 32, BRICO, numCol, 'center');
    // title and clock
    const inkA = printed ? 0.28 + 0.72 * pp : 0.28;
    g.globalAlpha = inkA;
    fillTextAt(g, s.title, TEXT_X, r.cy + 17, 800, TITLE_PX, BRICO, INK);
    g.globalAlpha = printed ? 0.45 + 0.55 * pp : 0.4;
    fillTextAt(g, s.clock, TEXT_R, r.cy + 11, 600, 32, SANS, NOTE, 'right');
    g.globalAlpha = 1;
    if (!printed) return;
    // line and why: fade in and rise on arrival
    const dy = (1 - pp) * SLIDE;
    g.globalAlpha = pp;
    drawRuns(g, r.lineLines, LINE_PX, TEXT_X, r.lineY + dy, LINE_LH, BODY);
    if (r.whyLines) {
      const bx = TEXT_X, bw = TEXT_R - TEXT_X, by = r.whyY + dy;
      roundRect(g, bx, by, bw, r.whyH, 14); g.fillStyle = TONE_TINT[s.tone]; g.fill();
      g.save(); roundRect(g, bx, by, bw, r.whyH, 14); g.clip();
      g.fillStyle = tone; g.fillRect(bx, by, 8, r.whyH); g.restore();
      const lh = Math.round(r.whyPx * 1.22);
      const pad = (r.whyH - r.whyLines.length * lh) / 2;
      drawRuns(g, r.whyLines, r.whyPx, bx + 8 + 20, by + pad, lh, INK);
    }
    g.globalAlpha = 1;
  });

  // result
  const R = L.result;
  g.fillStyle = RULE; g.fillRect(PADX, R.y, WW - PADX * 2, 3);
  if (resultAlpha > 0) {
    const dy = (1 - resultAlpha) * SLIDE;
    g.globalAlpha = resultAlpha;
    fillTextAt(g, result.figure, PADX, R.figY + dy, 800, R.figPx, BRICO, RED);
    drawRuns(g, R.capLines, R.capPx, R.capX, R.capY + dy, Math.round(R.capPx * 1.15), INK);
    gains.forEach((gn, i) => {
      const row = R.gainRows[i];
      fillTextAt(g, gn.who, PADX, row.y + dy + 36 * 0.82 + 2, 800, 36, SANS, INK);
      drawRuns(g, row.lines, 36, PADX + R.whoW, row.y + dy + 2, 44, BODY);
    });
    drawRuns(g, R.pressLines, 32, PADX, R.pressY + dy, 40, NOTE);
    g.globalAlpha = 1;
  }
  g.restore();
}

// =====================================================================================================================
// NARROW BOARD (1170 x 1440), shown at one third size
// =====================================================================================================================
const NW = BOARD_PX.narrow.w, NH = BOARD_PX.narrow.h;
const NPAD = 60;
const CHIP_CELL = (NW - NPAD * 2) / 7;
const CHIP_CY = 346;
const CHIP_HIT_Y0 = CHIP_CY - 72, CHIP_HIT_Y1 = CHIP_CY + 72;
const AREA_Y = 446;

const LOG_ROW = 84;

function drawNarrow(g: G, st: BoardState, art: BoardArt, resultAlpha: number, hits: { y0: number; y1: number; i: number }[]) {
  hits.length = 0;
  paintPaper(g, NW, NH);
  g.save(); roundRect(g, 0, 0, NW, NH, RADIUS); g.clip();

  // header (compact)
  fillTextAt(g, header.project, NPAD, 148, 800, 88, BRICO, INK);
  fillTextAt(g, `${header.company} · ${header.role}`, NPAD, 212, 400, 42, SANS, BODY);
  font(g, 800, 39, SANS);
  const exW = g.measureText(header.example).width + 44;
  const exX = NW - NPAD - exW, exY = 80;
  roundRect(g, exX, exY, exW, 62, 31); g.fillStyle = 'rgba(35,26,26,0.05)'; g.fill();
  g.strokeStyle = 'rgba(35,26,26,0.28)'; g.lineWidth = 3; g.stroke();
  fillTextAt(g, header.example, exX + exW / 2, exY + 43, 800, 39, SANS, NOTE, 'center');

  // chips
  const p = st.done ? 1 : ease(st.sinceStep / ARRIVE);
  const cx = (i: number) => NPAD + CHIP_CELL * (i + 0.5);
  const radius = (i: number) => (!st.done && i === st.step ? 52 : 44);
  journeySteps.forEach((s, i) => {
    if (i === 0) return;
    const x0 = cx(i - 1) + radius(i - 1) + 10, x1 = cx(i) - radius(i) - 10;
    const reached = st.done || i <= st.step;
    g.lineCap = 'round';
    let solidTo = x0;
    if (reached && !(i === st.step && !st.done)) solidTo = x1;
    else if (i === st.step && !st.done) solidTo = x0 + (x1 - x0) * p;
    if (solidTo > x0 + 0.5) { g.setLineDash([]); g.strokeStyle = TONE[s.tone]; g.lineWidth = 8; g.beginPath(); g.moveTo(x0, CHIP_CY); g.lineTo(solidTo, CHIP_CY); g.stroke(); }
    if (solidTo < x1 - 0.5) {
      g.setLineDash([0.1, 16]); g.strokeStyle = 'rgba(35,26,26,0.28)'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(Math.max(solidTo + 10, x0), CHIP_CY); g.lineTo(x1, CHIP_CY); g.stroke(); g.setLineDash([]);
    }
  });
  journeySteps.forEach((s, i) => {
    const isCur = !st.done && i === st.step;
    const printed = st.done || i <= st.step;
    const tone = TONE[s.tone];
    const r = radius(i);
    g.setLineDash([]);
    if (isCur) {
      g.globalAlpha = 0.4; g.strokeStyle = tone; g.lineWidth = 6;
      g.beginPath(); g.arc(cx(i), CHIP_CY, r + 13, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
    }
    g.beginPath(); g.arc(cx(i), CHIP_CY, r, 0, Math.PI * 2);
    g.fillStyle = GROUND; g.fill();
    if (printed) { g.globalAlpha = isCur ? p : 1; g.fillStyle = tone; g.fill(); g.globalAlpha = 1; if (isCur && p < 1) { g.strokeStyle = 'rgba(35,26,26,0.3)'; g.lineWidth = 4; g.globalAlpha = 1 - p; g.stroke(); g.globalAlpha = 1; } }
    else { g.strokeStyle = 'rgba(35,26,26,0.3)'; g.lineWidth = 4; g.stroke(); }
    fillTextAt(g, s.n, cx(i), CHIP_CY + 15, 800, isCur ? 46 : 42, BRICO, printed ? '#ffffff' : 'rgba(35,26,26,0.38)', 'center');
  });
  g.fillStyle = RULE; g.fillRect(NPAD, AREA_Y - 28, NW - NPAD * 2, 3);

  const W = NW - NPAD * 2;
  if (!st.done) {
    const s = journeySteps[st.step];
    const tone = TONE[s.tone];
    const dy = (1 - p) * SLIDE;
    g.globalAlpha = p;
    // number, clock
    fillTextAt(g, s.n, NPAD, AREA_Y + 56 + dy, 800, 64, BRICO, tone);
    fillTextAt(g, s.clock, NW - NPAD, AREA_Y + 54 + dy, 600, 42, SANS, NOTE, 'right');
    // title
    let y = AREA_Y + 78;
    const tpx = fitOne(g, s.title, 800, BRICO, W, 68, 60);
    font(g, 800, tpx, BRICO);
    const tl = wrapNice(g, plain(s.title), tpx, W);
    tl.forEach((ln, i) => { fillTextAt(g, ln.map((r) => r.t).join(' '), NPAD, y + dy + tpx * 0.95 + i * tpx * 1.1, 800, tpx, BRICO, INK); });
    y += tl.length * tpx * 1.1 + 30;
    const ll = wrapNice(g, plain(s.line), 44, W);
    drawRuns(g, ll, 44, NPAD, y + dy, 58, BODY);
    y += ll.length * 58 + 28;
    if (s.why) {
      const wl = wrapNice(g, whyWords(s.why), 42, W - 8 - 24 - 24);
      const lh = 56, pad = 24, bh = pad * 2 + wl.length * lh;
      roundRect(g, NPAD, y + dy, W, bh, 18); g.fillStyle = TONE_TINT[s.tone]; g.fill();
      g.save(); roundRect(g, NPAD, y + dy, W, bh, 18); g.clip(); g.fillStyle = tone; g.fillRect(NPAD, y + dy, 10, bh); g.restore();
      drawRuns(g, wl, 42, NPAD + 10 + 24, y + dy + pad, lh, INK);
      y += bh + 28;
    }
    // the real app screen at event 05, only if it fits uncropped
    const logged = st.step; // events 0..step-1, newest first
    const listH = logged * LOG_ROW;
    if (st.step === 4 && art.offer) {
      const room = NH - 60 - y - listH - (logged ? 20 : 0);
      const o = art.offer as unknown as { width: number; height: number };
      const iw = o.width, ih = o.height;
      if (iw && ih) {
        const tw = Math.min(W, room * (iw / ih));
        const th = tw * (ih / iw);
        if (th >= 170) {
          const tx = NPAD + (W - tw) / 2;
          g.save(); g.shadowColor = 'rgba(70,30,30,0.28)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
          roundRect(g, tx, y + dy, tw, th, 20); g.fillStyle = '#ffffff'; g.fill(); g.restore();
          g.save(); roundRect(g, tx, y + dy, tw, th, 20); g.clip(); g.drawImage(art.offer, tx, y + dy, tw, th); g.restore();
          y += th + 20;
        }
      }
    }
    g.globalAlpha = 1;
    // the events already logged, newest first, one line each
    let ly = y;
    const maxRows = Math.max(0, Math.floor((NH - 60 - ly) / LOG_ROW));
    const rowsShown = Math.min(logged, maxRows);
    g.save(); g.beginPath(); g.rect(0, ly - 2, NW, NH - ly); g.clip();
    for (let k = 0; k < rowsShown; k++) {
      const i = logged - 1 - k;
      const e = journeySteps[i];
      const isNew = k === 0;
      const ry = ly + k * LOG_ROW - (isNew ? 0 : (1 - p) * LOG_ROW);
      g.globalAlpha = isNew ? p : 1;
      if (k > 0 || !isNew) { g.fillStyle = RULE; g.fillRect(NPAD, ry, W, 2); }
      const cy = ry + LOG_ROW / 2;
      g.beginPath(); g.arc(NPAD + 33, cy, 33, 0, Math.PI * 2); g.fillStyle = TONE[e.tone]; g.fill();
      fillTextAt(g, e.n, NPAD + 33, cy + 13, 800, 39, BRICO, '#ffffff', 'center');
      font(g, 800, 44, BRICO);
      const clockW = 170;
      const tpx2 = fitOne(g, e.title, 800, BRICO, W - 66 - 26 - clockW, 44, 39);
      fillTextAt(g, e.title, NPAD + 66 + 26, cy + 15, 800, tpx2, BRICO, INK);
      fillTextAt(g, e.clock, NW - NPAD, cy + 14, 600, 39, SANS, NOTE, 'right');
      hits.push({ y0: ry, y1: ry + LOG_ROW, i });
    }
    g.restore();
    g.globalAlpha = 1;
  } else {
    g.globalAlpha = resultAlpha;
    const dy = (1 - resultAlpha) * SLIDE;
    let y = AREA_Y + 4 + dy;
    // result
    const figPx = 132;
    font(g, 800, figPx, BRICO);
    const figW = g.measureText(result.figure).width;
    fillTextAt(g, result.figure, NPAD, y + figPx * 0.82, 800, figPx, BRICO, RED);
    const capX = NPAD + figW + 36;
    const cl = wrapNice(g, plain(result.caption), 44, NW - NPAD - capX);
    const ch = cl.length * 56;
    drawRuns(g, cl, 44, capX, y + (figPx * 0.95 - ch) / 2 + 4, 56, INK);
    y += figPx * 0.95 + 26;
    // gains (short form: the long text does not fit beside the other two blocks at 39 px or more)
    font(g, 800, 42, SANS);
    const whoW = Math.max(...gains.map((x) => g.measureText(x.who).width)) + 26;
    for (const gn of gains) {
      fillTextAt(g, gn.who, NPAD, y + 42 * 0.82, 800, 42, SANS, INK);
      const l = wrapNice(g, plain(gn.short), 42, W - whoW);
      drawRuns(g, l, 42, NPAD + whoW, y, 54, BODY);
      y += l.length * 54 + 8;
    }
    y += 14;
    // My part
    g.fillStyle = RULE; g.fillRect(NPAD, y, W, 3); y += 28;
    fillTextAt(g, myPart.title, NPAD, y + 60, 800, 70, BRICO, INK);
    if (!myPart.confirmed) {
      font(g, 800, 39, SANS);
      const dw = g.measureText('Draft').width + 44;
      const dx = NW - NPAD - dw;
      roundRect(g, dx, y + 10, dw, 62, 31); g.fillStyle = 'rgba(185,122,16,0.12)'; g.fill();
      g.strokeStyle = 'rgba(185,122,16,0.7)'; g.lineWidth = 3; g.stroke();
      fillTextAt(g, 'Draft', dx + dw / 2, y + 10 + 43, 800, 39, SANS, '#8a5a08', 'center');
    }
    y += 82;
    fillTextAt(g, myPart.role, NPAD, y + 42 * 0.82, 400, 42, SANS, NOTE);
    y += 60;
    for (const ln of myPart.lines) {
      const l = wrapNice(g, plain(ln), 40, W - 44);
      g.fillStyle = RED; g.beginPath(); g.arc(NPAD + 10, y + 27, 8, 0, Math.PI * 2); g.fill();
      drawRuns(g, l, 40, NPAD + 44, y, 50, BODY);
      y += l.length * 50 + 10;
    }
    if (result.press) {
      const pl = wrapNice(g, plain(result.press), 39, W);
      y += 8; drawRuns(g, pl, 39, NPAD, y, 48, NOTE); y += pl.length * 48;
    }
    g.globalAlpha = 1;
    narrowEnd = y;
  }
  g.restore();
}
let narrowEnd = 0;

// =====================================================================================================================
// API
// =====================================================================================================================
export function createRescueBoard(kind: 'wide' | 'narrow', art: BoardArt): RescueSheet {
  const { w, h } = BOARD_PX[kind];
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d')!;
  let last = '';
  const narrowHits: { y0: number; y1: number; i: number }[] = [];
  let layout: WideLayout | null = null;
  let layoutFonts = '';
  const wideLayout = () => {
    const fk = fontsKey();
    if (!layout || layoutFonts !== fk) { layout = layoutWide(g); layoutFonts = fk; }
    return layout;
  };
  return {
    canvas,
    draw(state) {
      const inArrive = !state.done && state.sinceStep < ARRIVE + 0.02;
      const inResult = state.done && state.sinceDone < RESULT_IN + 0.02;
      const key = `${state.step}|${state.done}|${fontsKey()}|${art.offer ? 1 : 0}`;
      if (!inArrive && !inResult && key === last) return false;
      last = inArrive || inResult ? '' : key;
      const resultAlpha = state.done ? ease(state.sinceDone / RESULT_IN) : 0;
      if (kind === 'wide') drawWide(g, state, wideLayout(), resultAlpha);
      else drawNarrow(g, state, art, resultAlpha, narrowHits);
      return true;
    },
    rowAt(u, v) {
      const x = u * w, y = v * h;
      if (x < 0 || x > w || y < 0 || y > h) return null;
      if (kind === 'wide') {
        const L = wideLayout();
        for (let i = 0; i < L.rows.length; i++) {
          const top = i === 0 ? L.rows[0].y : (L.rows[i - 1].y + L.rows[i - 1].h + L.rows[i].y) / 2;
          const bot = i === L.rows.length - 1 ? L.rows[i].y + L.rows[i].h + 8 : (L.rows[i].y + L.rows[i].h + L.rows[i + 1].y) / 2;
          if (y >= top && y < bot) return i;
        }
        return null;
      }
      for (const hr of narrowHits) if (y >= hr.y0 && y < hr.y1) return hr.i;
      if (y < CHIP_HIT_Y0 || y > CHIP_HIT_Y1 || x < NPAD || x >= NW - NPAD) return null;
      return Math.min(6, Math.floor((x - NPAD) / CHIP_CELL));
    },
  };
}

/** For checking only: where the narrow board's last content ended (px). */
let partPx = 0;
export function partFontPx() { return partPx; }
export function narrowContentEnd() { return narrowEnd; }

// =====================================================================================================================
// "MY PART" SHEET (1500 x 543)
// =====================================================================================================================
/** The "My part" sheet for wide screens (BOARD_PX.part). Static: draw() paints once. */
export function createPartSheet(): RescueSheet {
  const { w, h } = BOARD_PX.part;
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d')!;
  let painted = '';
  return {
    canvas,
    draw() {
      const key = fontsKey();
      if (painted === key) return false; painted = key;
      paintPaper(g, w, h);
      g.save(); roundRect(g, 0, 0, w, h, RADIUS); g.clip();
      const PX = 72;
      // top line: title left, role right (quiet)
      fillTextAt(g, myPart.title, PX, 130, 800, 84, BRICO, INK);
      let titleRight = w - PX;
      if (!myPart.confirmed) {
        font(g, 800, 34, SANS);
        const dw = g.measureText('Draft').width + 48, dh = 56;
        const dx = w - PX - dw, dy = 76;
        roundRect(g, dx, dy, dw, dh, dh / 2); g.fillStyle = 'rgba(185,122,16,0.12)'; g.fill();
        g.strokeStyle = 'rgba(185,122,16,0.7)'; g.lineWidth = 3; g.stroke();
        fillTextAt(g, 'Draft', dx + dw / 2, dy + 39, 800, 34, SANS, '#8a5a08', 'center');
        titleRight = dx - 30;
      }
      const rpx = fitOne(g, myPart.role, 400, SANS, titleRight - (PX + 480), 42, 36);
      fillTextAt(g, myPart.role, titleRight, 128, 400, rpx, SANS, NOTE, 'right');
      g.fillStyle = RULE; g.fillRect(PX, 164, w - PX * 2, 3);
      // the three lines across the full width, as large as they fit
      const top = 190, bottom = h - 52, lw = w - PX * 2 - 70;
      let px = 50, blocks: Run[][][] = [], lh = 0, gap = 0, total = 0;
      for (; px >= 44; px -= 2) {
        blocks = myPart.lines.map((l) => wrapNice(g, plain(l), px, lw));
        lh = Math.round(px * 1.2); gap = 18;
        total = blocks.reduce((t, b) => t + b.length * lh, 0) + gap * (blocks.length - 1);
        if (total <= bottom - top) break;
      }
      let y = top + (bottom - top - total) / 2;
      blocks.forEach((b, i) => {
        fillTextAt(g, String(i + 1), PX, y + px * 0.82 + 1, 800, px, BRICO, RED);
        drawRuns(g, b, px, PX + 70, y, lh, INK);
        y += b.length * lh + gap;
      });
      partPx = px;
      g.restore();
      return true;
    },
    rowAt() { return null; },
  };
}
