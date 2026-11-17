/**
 * Surya's story pages: the page that faces each picture page.
 *
 * Where the picture page plays the idea, the story page shows the making:
 * a short line on why or how, one real photograph, and a line drawing of the
 * real part that draws itself, comes apart and goes back together. The
 * drawings use Adi's own files (see wire.ts); the words come from his project
 * notes, his firmware and what he has said about the piece.
 */

import type { BookImages } from '../pageArt';
import { clamp, hash, lerp, rgba, smoothstep, type Rgb } from './motion';
import { HOME_SPRITES } from './sprites/home';
import { createStage, drawSprite, loopPage, spriteNamed, tintSheet, type Stage } from './stage';
import { SURYA_PARTS } from './sprites/suryaParts';
import type { LivePage, LiveScene } from './types';
import {
  BACK_HALF, BUTTONS, FLOWERS, LASER, MATRIX, drawBoard, drawDrum, drawEngraving, drawFlowerFace, drawFlowerParts,
  drawLayer, drawMatrix, drawProduct, drawRim, drawSheet, plotOnPlate, type View,
} from './wire';

const PARTS = '/images/flipbook/surya/parts';
/** Adi's own photographs: the piece on his wall, and the making of it in the shop. */
const PHOTO = {
  wall: `${PARTS}/wall.webp`,
  product: `${PARTS}/product.webp`,
  held: `${PARTS}/held.webp`,
  stack: `${PARTS}/stack.webp`,
  window: `${PARTS}/window.webp`,
  sandblaster: `${PARTS}/sandblaster.webp`,
  display: `${PARTS}/display.webp`,
  flowers: `${PARTS}/flowers.webp`,
  button: `${PARTS}/button.webp`,
  /** His own film of walking up to the piece at home, held steady on the piece: a sheet of frames. */
  walkup: `${PARTS}/walkup.webp`,
  radar: `${PARTS}/radar.webp`,
};
export const ENGRAVE = `${PARTS}/engrave.webp`;
const WALKER = '/images/flipbook/surya/home/people.webp';

export const SERIF = '"FB Serif", Georgia, serif';
export const SANS = '"FB Geist", "Geist", system-ui, sans-serif';

export interface StoryTone { paper: Rgb; ink: Rgb; mid: Rgb }

export interface Shot { src: string; focus?: readonly [number, number]; zoom?: number; /** A sheet of film frames, played in a loop. */ film?: boolean }

export interface Copy {
  kicker: string;
  /** Lines of the title, already broken where they should break. */
  title: string[];
  body?: string;
  /** In place of a paragraph: short lines under small headings (what worked, what was hard). */
  points?: Array<{ heading: string; lines: string[] }>;
  /** The note under the drawing: a choice Adi made and what it cost, or a fact from his files. */
  note?: { label: string; head?: string; text: string };
  /** One real photograph, and sometimes a second one beside it (`share` is the second's part of the width). */
  photo?: Shot & { caption: string; whole?: boolean; second?: Shot & { caption: string; share: number } };
}

export interface Kit {
  stage: Stage;
  k: number;
  tone: StoryTone;
  images: BookImages;
  /** The engraving in the page's ink. */
  engraving: HTMLCanvasElement | null;
}

/** Draws the left-hand drawing of a story page. `t` is the story clock, `clock` never wraps. */
export type Drawing = (kit: Kit, ctx: CanvasRenderingContext2D, t: number, clock: number) => void;

/* ---------- small helpers ---------- */

export const wrap = (ctx: CanvasRenderingContext2D, text: string, width: number): string[] => {
  const lines: string[] = [];
  let line = '';
  text.split(/\s+/).forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; } else line = next;
  });
  if (line) lines.push(line);
  return lines;
};

export const tracking = (ctx: CanvasRenderingContext2D, px: number): void => {
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px.toFixed(2)}px`;
};

/** A picture (or one cell of a sheet of pictures) cropped to fill a rounded frame. */
const frame = (
  ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, radius: number,
  focus: readonly [number, number] = [0.5, 0.5], zoom = 1, cell?: readonly [number, number, number, number],
): void => {
  const [left, top, wide, tall] = cell ?? [0, 0, img.naturalWidth, img.naturalHeight];
  const scale = Math.max(w / wide, h / tall) * zoom;
  const sw = w / scale;
  const sh = h / scale;
  const sx = left + clamp(focus[0] * wide - sw / 2, 0, wide - sw);
  const sy = top + clamp(focus[1] * tall - sh / 2, 0, tall - sh);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
};

/** Which frames of the film strip to show at this moment: one, and the next fading in over it. */
const filmAt = (seconds: number): { cells: Array<readonly [number, number, number, number]>; blend: number } => {
  const { cols, count, cell, fps } = SURYA_PARTS.film;
  // play through once, then rest on the last frame until the page's story starts again
  const at = Math.max(0, seconds * fps);
  const index = Math.min(count - 1, Math.floor(at));
  const next = Math.min(count - 1, index + 1);
  const box = (n: number): readonly [number, number, number, number] => [(n % cols) * cell + 1, Math.floor(n / cols) * cell + 1, cell - 2, cell - 2];
  return { cells: [box(index), box(next)], blend: next === index ? 0 : at - index };
};

/** A small label with a leader line from a point on the drawing. */
export const label = (ctx: CanvasRenderingContext2D, k: number, tone: StoryTone, text: string, fromX: number, fromY: number, toX: number, toY: number, alpha = 1): void => {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = rgba(tone.mid);
  ctx.fillStyle = rgba(tone.mid);
  ctx.lineWidth = 2.4 * k;
  ctx.beginPath(); ctx.moveTo(fromX * k, fromY * k); ctx.lineTo(toX * k, toY * k); ctx.stroke();
  ctx.beginPath(); ctx.arc(fromX * k, fromY * k, 6 * k, 0, Math.PI * 2); ctx.fill();
  ctx.font = `600 ${30 * k}px ${SANS}`;
  tracking(ctx, 30 * k * 0.04);
  ctx.textBaseline = 'middle';
  ctx.textAlign = toX >= fromX ? 'left' : 'right';
  ctx.fillStyle = rgba(tone.ink);
  ctx.fillText(text, (toX + (toX >= fromX ? 12 : -12)) * k, toY * k);
  ctx.restore();
};

/** "ETA:18M", the message on the display in the product photo, as lit lights on a 32 by 8 matrix. */
const MESSAGE: ReadonlyArray<readonly string[]> = [
  ['1111', '1000', '1110', '1000', '1000', '1000', '1111'],
  ['111', '010', '010', '010', '010', '010', '010'],
  ['0110', '1001', '1001', '1111', '1001', '1001', '1001'],
  ['0', '0', '1', '0', '1', '0', '0'],
  ['010', '110', '010', '010', '010', '010', '111'],
  ['0110', '1001', '1001', '0110', '1001', '1001', '0110'],
  ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
];
const messageLights = ((): Set<number> => {
  const lit = new Set<number>();
  let col = 1;
  MESSAGE.forEach((glyph) => {
    glyph.forEach((rowBits, row) => {
      [...rowBits].forEach((bit, i) => { if (bit === '1') lit.add((col + i) * 8 + row); });
    });
    col += glyph[0].length + 1;
  });
  return lit;
})();
export const messageLit = (col: number, row: number): number => (messageLights.has(col * 8 + row) ? 1 : 0);

/** "69%", the 3D print's progress, as it stands on the display in his film of walking up to the piece. */
const PERCENT: ReadonlyArray<readonly string[]> = [
  ['0110', '1000', '1000', '1110', '1001', '1001', '0110'],
  ['0110', '1001', '1001', '0111', '0001', '0001', '0110'],
  ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
];
const percentLights = ((): Set<number> => {
  const lit = new Set<number>();
  let col = 8;
  PERCENT.forEach((glyph) => {
    glyph.forEach((rowBits, row) => {
      [...rowBits].forEach((bit, i) => { if (bit === '1') lit.add((col + i) * 8 + row); });
    });
    col += glyph[0].length + 1;
  });
  return lit;
})();
const percentLit = (col: number, row: number): number => (percentLights.has(col * 8 + row) ? 1 : 0);

/** The drawing area of a story page, in scene units; the note sits under it. */
export const AREA = { x: 60, y: 56, w: 1040, h: 860 };
const NOTE_TOP = 944;
/** How wide the piece is, back layer tip to tip, in laser units. */
const ACROSS = BACK_HALF * 2;
/** A view of the piece in the drawing area: `size` is how wide it is drawn, in scene units. */
const areaView = (k: number, turn: number, tip: number, size: number, dx = 0, dy = 0): View => ({
  turn, tip, scale: (size / ACROSS) * k, x: (AREA.x + AREA.w / 2 + dx) * k, y: (AREA.y + AREA.h / 2 + dy) * k,
});

/* ---------- the drawings ---------- */

/** Why: the real piece, and the one idea in it. */
const drawWhy: Drawing = ({ k, tone, images }, ctx, _t, clock) => {
  const product = images.get(PHOTO.product);
  if (!product) return;
  const view = areaView(k, 0, 0, 760, 40, 0);
  // a soft light behind it, breathing
  const reach = 520 * k;
  const glow = ctx.createRadialGradient(view.x, view.y, reach * 0.3, view.x, view.y, reach);
  glow.addColorStop(0, rgba(tone.mid, 0.3 + 0.06 * Math.sin(clock * 1.4)));
  glow.addColorStop(1, rgba(tone.mid, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(view.x - reach, view.y - reach, reach * 2, reach * 2);
  drawProduct(ctx, product, view.x, view.y, view.scale);
  // a ring around each flower, one after the other
  const beat = (clock * 0.5) % 3;
  const order = [0, 2, 1];
  order.forEach((hole, i) => {
    const [fx, fy] = FLOWERS[hole];
    const on = 0.5 + 0.5 * clamp(1 - Math.abs(beat - i - 0.5) * 2);
    ctx.strokeStyle = rgba([255, 250, 240], on);
    ctx.lineWidth = 4 * k;
    ctx.beginPath(); ctx.arc(view.x + fx * view.scale, view.y + fy * view.scale, 34 * view.scale, 0, Math.PI * 2); ctx.stroke();
  });
  const top = { x: (view.x + FLOWERS[0][0] * view.scale) / k, y: (view.y + FLOWERS[0][1] * view.scale) / k };
  label(ctx, k, tone, 'one flower, one person', top.x - 44, top.y - 44, top.x - 190, top.y - 150);
};

/** Form: the laser file drawing itself, cut line first, then the engraving laid in line by line. */
const drawForm: Drawing = ({ k, tone, engraving }, ctx, t) => {
  const view = areaView(k, 0, 0, 860);
  const outline = smoothstep(0.2, 2.6, t);
  const laid = smoothstep(2.4, 7.4, t);
  const fade = 1 - smoothstep(10.4, 11.2, t);
  ctx.save();
  ctx.globalAlpha = fade;
  drawLayer(ctx, view, 0, 'front', { fill: null, line: tone.ink, width: 3.2 * k, drawn: outline });
  if (engraving) drawEngraving(ctx, view, 0, engraving, 0.92, laid);
  ctx.restore();
  if (laid > 0 && laid < 1) {
    // the laser head: a bright point running along the line it is burning
    const y = view.y + (-LASER.half + LASER.half * 2 * laid) * view.scale;
    const sweep = (Math.sin(t * 9) * 0.5 + 0.5);
    const x = view.x + (-190 + 380 * sweep) * view.scale;
    ctx.strokeStyle = rgba(tone.mid, 0.5);
    ctx.lineWidth = 2 * k;
    ctx.beginPath(); ctx.moveTo(view.x - 200 * view.scale, y); ctx.lineTo(view.x + 200 * view.scale, y); ctx.stroke();
    const spark = ctx.createRadialGradient(x, y, 0, x, y, 46 * k);
    spark.addColorStop(0, rgba([255, 244, 214], 1));
    spark.addColorStop(0.3, rgba(tone.mid, 0.8));
    spark.addColorStop(1, rgba(tone.mid, 0));
    ctx.fillStyle = spark;
    ctx.fillRect(x - 46 * k, y - 46 * k, 92 * k, 92 * k);
  }
};

/** Body: the two wood layers, pulled apart and pushed back, with the rim lights between them. */
const drawBody: Drawing = ({ k, tone, engraving }, ctx, t, clock) => {
  const apart = smoothstep(0.8, 2.6, t) * (1 - smoothstep(6.2, 8, t));
  const gap = lerp(7, 170, apart);
  const turn = 0.86 + Math.sin(clock * 0.4) * 0.04;
  const size = 640;
  // the back layer swings out to the left as the gap opens: slide the pair right to keep it centred
  const view = areaView(k, turn, 0.2, size, (gap * Math.sin(turn) * (size / ACROSS)) / 2 + 20, 30);
  drawLayer(ctx, view, -gap, 'back', { fill: tone.paper, line: tone.ink, width: 3 * k, thick: 5 });
  drawRim(ctx, view, -gap / 2, tone.ink, tone.mid, (i) => apart * (0.5 + 0.5 * Math.sin(clock * 3 - i * 0.35)), clamp(apart * 2));
  drawLayer(ctx, view, 0, 'front', { fill: tone.paper, line: tone.ink, width: 3 * k, thick: 5 });
  if (engraving) drawEngraving(ctx, view, 0, engraving, 0.85);
  const shown = clamp(apart * 2 - 0.6);
  const front = plotOnPlate(view, 60, -168, 0);
  const rear = plotOnPlate(view, -120, -196, -gap);
  const lights = plotOnPlate(view, 150, 150, -gap / 2);
  label(ctx, k, tone, 'front layer, engraved', front.x / k, front.y / k, front.x / k + 40, front.y / k - 96, shown);
  label(ctx, k, tone, 'back layer', rear.x / k, rear.y / k, rear.x / k + 30, rear.y / k - 90, shown);
  label(ctx, k, tone, '68 lights between', lights.x / k, lights.y / k, lights.x / k + 30, lights.y / k + 150, shown);
};

/** Light: the matrix in its window, and the frosted sheet sliding in front of it. */
const drawLight: Drawing = ({ k, tone }, ctx, t, clock) => {
  const cover = smoothstep(2.2, 4.4, t) * (1 - smoothstep(8.6, 9.8, t));
  const view = areaView(k, 0.62, 0.16, 1560, 30, -30);
  const twinkle = (col: number, row: number): number => messageLit(col, row) * (0.82 + 0.18 * Math.sin(clock * 5 + col * 0.7 + row));
  // the lights on their own are hard points...
  drawMatrix(ctx, view, -34, tone.ink, tone.mid, 3 * k, twinkle);
  // ... seen through the sheet they spread into each other
  const sheetZ = lerp(250, 34, cover);
  if (cover > 0.5) {
    const [x, y, w, h] = LASER.window;
    const pitch = w / MATRIX.cols;
    const soft = clamp((cover - 0.5) * 2);
    for (let col = 0; col < MATRIX.cols; col += 1) {
      for (let row = 0; row < MATRIX.rows; row += 1) {
        if (!messageLit(col, row)) continue;
        const p = plotOnPlate(view, x + (col + 0.5) * pitch - LASER.centre[0], y + (h - pitch * MATRIX.rows) / 2 + (row + 0.5) * pitch - LASER.centre[1], sheetZ);
        const r = pitch * 1.25 * view.scale;
        const blob = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        blob.addColorStop(0, rgba(tone.mid, 0.5 * soft));
        blob.addColorStop(1, rgba(tone.mid, 0));
        ctx.fillStyle = blob;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      }
    }
  }
  drawSheet(ctx, view, sheetZ, tone.ink, tone.paper, 3 * k, 1, 0.42);
  const lights = plotOnPlate(view, -90, 36, -34);
  const sheet = plotOnPlate(view, 96, -36, sheetZ);
  label(ctx, k, tone, '32 × 8 lights', lights.x / k, lights.y / k, lights.x / k + 40, lights.y / k + 230);
  label(ctx, k, tone, 'frosted acrylic', sheet.x / k, sheet.y / k, sheet.x / k - 250, sheet.y / k - 200);
};

/** Flowers: the printed flower, drawn from its real parts, opening, closing and coming apart. */
const drawFlowers: Drawing = ({ k, tone }, ctx, t) => {
  const open = smoothstep(0.6, 2.8, t) * (1 - smoothstep(4.2, 5.8, t));
  const apart = smoothstep(6.4, 7.8, t) * (1 - smoothstep(10.2, 11.4, t));
  const cx = AREA.x + AREA.w / 2;
  const foot = AREA.y + 560 + 60 * apart;
  drawFlowerParts(ctx, cx * k, foot * k, 8.4 * k, open, apart, { paper: tone.paper, line: tone.ink, width: 3 * k });
  const named = clamp(apart * 2 - 0.8);
  label(ctx, k, tone, 'petal, 3D printed', cx + 289, foot - 359, cx + 150, foot - 500, named);
  label(ctx, k, tone, 'link', cx - 166, foot - 315, cx - 262, foot - 394, named);
  label(ctx, k, tone, 'screw, turned by a motor', cx + 34, foot + 100, cx + 120, foot + 160, named);
};

/**
 * Brain: the board and everything it runs, and the night it would not run.
 * For the first few seconds one wire sits loose: the motors twitch and the
 * signals stutter. Then the pin goes home and everything moves smoothly.
 * (Adi's own account: jerky petals, frozen code, and one loose ground pin.)
 */
const drawBrain: Drawing = ({ k, tone }, ctx, t, clock) => {
  const loose = Math.max(1 - smoothstep(3.6, 4.1, t), smoothstep(9.3, 9.9, t));
  const view = areaView(k, 0.5, 0.14, 860, 10, -10);
  const z = -60;
  drawLayer(ctx, view, z - 40, 'back', { fill: null, line: tone.ink, width: 2 * k, alpha: 0.4 });
  drawRim(ctx, view, z, tone.ink, tone.mid, (i) => (loose > 0.5 ? (hash(Math.floor(clock * 9) * 7 + i) > 0.6 ? 1 : 0) : 0.5 + 0.5 * Math.sin(clock * 2.4 - i * 0.28)));
  drawMatrix(ctx, view, z, tone.ink, tone.mid, 2.4 * k, (col, row) => messageLit(col, row) * (loose > 0.5 ? (hash(Math.floor(clock * 7) + col) > 0.35 ? 0.9 : 0.15) : 0.9));
  const board: [number, number] = [0, 92];
  // wires from the board to each thing it drives, with a pulse running along each
  const ends: Array<[number, number]> = [
    ...FLOWERS.map(([fx, fy]) => [fx, fy] as [number, number]),
    ...BUTTONS.map(([bx, by]) => [bx, by] as [number, number]),
    [0, 30],
    [150, 150],
  ];
  ends.forEach(([ex, ey], i) => {
    const a = plotOnPlate(view, board[0], board[1], z);
    const b = plotOnPlate(view, ex, ey, z);
    ctx.strokeStyle = rgba(tone.ink, 0.6);
    ctx.lineWidth = 2.2 * k;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x, b.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    // while the pin is loose the signals arrive in fits and starts
    const smooth = (clock * 0.55 + hash(i) * 3) % 1;
    const fits = Math.floor(smooth * 4) / 4 + (hash(Math.floor(clock * 11) + i) > 0.5 ? 0.06 : 0);
    const u = loose > 0.5 ? fits % 1 : smooth;
    const total = Math.abs(b.y - a.y) + Math.abs(b.x - a.x);
    const run = u * total;
    const px = run < Math.abs(b.y - a.y) ? a.x : a.x + Math.sign(b.x - a.x) * (run - Math.abs(b.y - a.y));
    const py = run < Math.abs(b.y - a.y) ? a.y + Math.sign(b.y - a.y) * run : b.y;
    ctx.fillStyle = rgba(tone.mid, loose > 0.5 ? 0.55 : 1);
    ctx.beginPath(); ctx.arc(px, py, 7 * k, 0, Math.PI * 2); ctx.fill();
  });
  // the motors behind the flowers: they twitch while the pin is loose
  FLOWERS.forEach(([fx, fy], i) => {
    const twitch = loose * 3.2;
    const jx = (hash(Math.floor(clock * 13) + i * 31) - 0.5) * twitch;
    const jy = (hash(Math.floor(clock * 13) + i * 57 + 9) - 0.5) * twitch;
    drawDrum(ctx, view, fx + jx, fy + jy, z - 30, z + 4, 15, tone.ink, tone.paper, 2.6 * k);
  });
  BUTTONS.forEach(([bx, by]) => drawDrum(ctx, view, bx, by, z, z + 12, 7.5, tone.ink, tone.paper, 2.4 * k));
  drawBoard(ctx, view, board[0], board[1], z + 4, tone.ink, tone.paper, 2.6 * k);
  // the ground wire: off its pin at first, then pushed home
  const pin = plotOnPlate(view, board[0] - 30, board[1] + 15, z + 4);
  const earth = { x: pin.x - 96 * k, y: pin.y + 150 * k };
  const lift = loose * (16 + 5 * Math.sin(clock * 17)) * k;
  ctx.strokeStyle = rgba(tone.ink);
  ctx.lineWidth = 3 * k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pin.x - lift * 0.5, pin.y + lift);
  ctx.quadraticCurveTo(pin.x - 20 * k, earth.y - 70 * k, earth.x, earth.y);
  ctx.stroke();
  [0, 1, 2].forEach((i) => {
    const half = (26 - i * 9) * k;
    ctx.beginPath(); ctx.moveTo(earth.x - half, earth.y + i * 9 * k); ctx.lineTo(earth.x + half, earth.y + i * 9 * k); ctx.stroke();
  });
  ctx.fillStyle = rgba(tone.ink);
  ctx.beginPath(); ctx.arc(pin.x, pin.y, 5 * k, 0, Math.PI * 2); ctx.fill();
  if (loose > 0.02) {
    ctx.strokeStyle = rgba(tone.mid, loose * (0.55 + 0.45 * Math.sin(clock * 8)));
    ctx.lineWidth = 3.4 * k;
    ctx.beginPath(); ctx.arc(pin.x - lift * 0.25, pin.y + lift * 0.5, 30 * k, 0, Math.PI * 2); ctx.stroke();
  }
  const m = plotOnPlate(view, FLOWERS[0][0], FLOWERS[0][1] - 16, z);
  const btn = plotOnPlate(view, BUTTONS[2][0], BUTTONS[2][1], z + 12);
  label(ctx, k, tone, 'ESP32', pin.x / k + 70, pin.y / k - 26, pin.x / k + 250, pin.y / k + 40);
  label(ctx, k, tone, '3 motors', m.x / k, m.y / k, m.x / k + 150, m.y / k - 90);
  label(ctx, k, tone, '3 buttons', btn.x / k, btn.y / k, btn.x / k + 120, btn.y / k + 60);
  label(ctx, k, tone, 'one loose ground pin', (pin.x - lift * 0.25) / k + 26, (pin.y + lift * 0.5) / k + 16, pin.x / k + 110, pin.y / k + 150, loose);
};

/** House: someone walks up, the radar sees them, the house decides, the display answers. */
const drawHouse: Drawing = ({ k, tone, images }, ctx, t, clock) => {
  const walk = smoothstep(0.4, 3.2, t);
  const seen = smoothstep(3, 3.6, t) * (1 - smoothstep(9.4, 10.2, t));
  const sent = smoothstep(4.2, 5.4, t);
  const shown = smoothstep(5.6, 6.2, t) * (1 - smoothstep(9.4, 10.2, t));
  const ink = rgba(tone.ink);
  ctx.lineWidth = 3.4 * k;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink;
  // the piece on its wall, small, straight on
  const at = { x: 800, y: 300 };
  const view: View = { turn: 0, tip: 0, scale: (410 / ACROSS) * k, x: at.x * k, y: at.y * k };
  drawLayer(ctx, view, 0, 'back', { fill: null, line: tone.ink, width: 2.6 * k });
  drawLayer(ctx, view, 0, 'front', { fill: null, line: tone.ink, width: 2.2 * k, alpha: 0.7 });
  drawMatrix(ctx, view, 0, tone.ink, tone.mid, 2.2 * k, (col, row) => percentLit(col, row) * shown);
  FLOWERS.forEach(([fx, fy]) => drawFlowerFace(ctx, view, 0, fx, fy, 13, 0.4 + 0.6 * shown, tone.ink, tone.paper, 2 * k));
  // the floor, the person walking in, the radar under the piece
  const floor = 880;
  ctx.beginPath(); ctx.moveTo(110 * k, floor * k); ctx.lineTo(1060 * k, floor * k); ctx.stroke();
  const px = lerp(170, 500, walk);
  const sheet = images.get(WALKER);
  if (sheet) {
    const people = HOME_SPRITES.people.sprites;
    const pose = walk < 1 ? (Math.floor(clock * 3.8) % 2 ? 'walk-b' : 'walk-a') : 'wave';
    drawSprite(ctx, sheet, spriteNamed(people, pose), k, { x: px, y: floor + 4, scale: 0.78 });
  }
  const radar = { x: 800, y: 590 };
  ctx.strokeRect((radar.x - 44) * k, (radar.y - 22) * k, 88 * k, 44 * k);
  for (let i = 0; i < 3; i += 1) {
    const u = (clock * 0.7 + i / 3) % 1;
    ctx.strokeStyle = rgba(tone.mid, (1 - u) * (0.35 + 0.65 * seen));
    ctx.beginPath(); ctx.arc(radar.x * k, radar.y * k, (60 + u * 280) * k, Math.PI * 0.62, Math.PI * 1.02); ctx.stroke();
  }
  // the house's own computer, to one side
  ctx.strokeStyle = ink;
  const pi = { x: 300, y: 230 };
  ctx.strokeRect((pi.x - 90) * k, (pi.y - 56) * k, 180 * k, 112 * k);
  ctx.strokeRect((pi.x - 70) * k, (pi.y - 38) * k, 60 * k, 44 * k);
  for (let i = 0; i < 8; i += 1) { ctx.beginPath(); ctx.arc((pi.x - 62 + i * 18) * k, (pi.y + 36) * k, 3 * k, 0, Math.PI * 2); ctx.stroke(); }
  // radar to the computer, computer to the piece
  const link = (ax: number, ay: number, bx: number, by: number, amount: number, seed: number): void => {
    ctx.setLineDash([10 * k, 14 * k]);
    ctx.strokeStyle = rgba(tone.ink, 0.5);
    ctx.beginPath(); ctx.moveTo(ax * k, ay * k); ctx.lineTo(bx * k, by * k); ctx.stroke();
    ctx.setLineDash([]);
    if (amount > 0.02) {
      const u = (clock * 0.9 + seed) % 1;
      ctx.fillStyle = rgba(tone.mid, amount);
      ctx.beginPath(); ctx.arc(lerp(ax, bx, u) * k, lerp(ay, by, u) * k, 9 * k, 0, Math.PI * 2); ctx.fill();
    }
  };
  link(radar.x - 50, radar.y - 10, pi.x + 96, pi.y + 40, seen, 0);
  link(pi.x + 96, pi.y - 20, at.x - 205, at.y - 10, sent * (1 - smoothstep(9.4, 10.2, t)), 0.4);
  label(ctx, k, tone, 'radar', radar.x + 44, radar.y + 10, radar.x + 90, radar.y + 110);
  label(ctx, k, tone, 'Home Assistant', pi.x - 40, pi.y + 60, pi.x - 20, pi.y + 150);
};

/** Learned: the piece where it lives, and the sentence it left behind. This page has no note: the sentence is the note. */
const drawLearned: Drawing = ({ k, tone, images }, ctx, _t, clock) => {
  const wall = images.get(PHOTO.wall);
  const top = 70;
  if (wall) frame(ctx, wall, AREA.x * k, top * k, AREA.w * k, 640 * k, 18 * k, [0.41, 0.5], 1.3);
  ctx.fillStyle = rgba(tone.ink);
  ctx.font = `600 ${62 * k}px ${SERIF}`;
  tracking(ctx, 0);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const quote = 'Slow, steady motion felt calm and alive.';
  wrap(ctx, quote, AREA.w * k).forEach((line, i) => ctx.fillText(line, AREA.x * k, (top + 760 + i * 76) * k));
  ctx.fillStyle = rgba(tone.mid, 0.6 + 0.4 * Math.sin(clock * 1.2));
  ctx.fillRect(AREA.x * k, (top + 688) * k, 90 * k, 6 * k);
};

/* ---------- the page ---------- */

/** A photograph as a print laid on the page: white border, the picture, and room under it for a caption. */
export const print = (
  ctx: CanvasRenderingContext2D, k: number, img: HTMLImageElement, shot: Shot,
  x: number, y: number, w: number, h: number, foot: number, seconds = 0, turn = 0,
): void => {
  const edge = 12;
  ctx.save();
  ctx.translate((x + w / 2) * k, (y + h / 2) * k);
  ctx.rotate(turn);
  ctx.translate(-(w / 2) * k, -(h / 2) * k);
  ctx.shadowColor = 'rgba(30, 18, 10, 0.3)';
  ctx.shadowBlur = 22 * k;
  ctx.shadowOffsetY = 8 * k;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(-edge * k, -edge * k, (w + edge * 2) * k, (h + edge + foot) * k, 10 * k); ctx.fill();
  ctx.shadowColor = 'transparent';
  if (shot.film) {
    const { cells, blend } = filmAt(seconds);
    frame(ctx, img, 0, 0, w * k, h * k, 5 * k, shot.focus, shot.zoom, cells[0]);
    if (blend > 0.02) {
      ctx.globalAlpha = blend;
      frame(ctx, img, 0, 0, w * k, h * k, 5 * k, shot.focus, shot.zoom, cells[1]);
      ctx.globalAlpha = 1;
    }
  } else {
    frame(ctx, img, 0, 0, w * k, h * k, 5 * k, shot.focus, shot.zoom);
  }
  ctx.restore();
};

export function storyScene(id: string, tone: StoryTone, copy: Copy, drawing: Drawing, loop: number, rest: number, extra: string[] = [], once = false): LiveScene {
  const sources = [...new Set([...(copy.photo ? [copy.photo.src] : []), ...(copy.photo?.second ? [copy.photo.second.src] : []), ENGRAVE, ...extra])];
  return {
    id,
    sources,
    create(images: BookImages, width: number, height: number): LivePage {
      const stage = createStage(width, height);
      const { k, base, fg } = stage;
      const engraveImage = images.get(ENGRAVE);
      const engraving = engraveImage ? stage.keep(tintSheet(engraveImage, rgba(tone.ink))) : null;
      const kit: Kit = { stage, k, tone, images, engraving };
      const photo = copy.photo ? images.get(copy.photo.src) : undefined;
      const second = copy.photo?.second ? images.get(copy.photo.second.src) : undefined;
      const column = { x: 1170, w: 760 };
      const dotsTo = copy.note ? AREA.y + AREA.h : 1130;

      return loopPage(stage, {
        loop,
        rest,
        once,
        step() { /* the drawings are pure functions of time */ },
        draw(t, clock) {
          /* the printed sheet: paper, the drawing, the words */
          base.fillStyle = rgba(tone.paper);
          base.fillRect(0, 0, width, height);
          // drafting dots under the drawing
          base.fillStyle = rgba(tone.ink, 0.13);
          for (let gx = AREA.x + 40; gx < AREA.x + AREA.w; gx += 80) {
            for (let gy = AREA.y + 40; gy < dotsTo; gy += 80) {
              base.beginPath(); base.arc(gx * k, gy * k, 2.4 * k, 0, Math.PI * 2); base.fill();
            }
          }
          base.save();
          drawing(kit, base, t, clock);
          base.restore();
          base.setTransform(1, 0, 0, 1, 0, 0);
          base.globalAlpha = 1;
          base.setLineDash([]);

          /* under the drawing: the choice behind this part, or a fact from the files */
          if (copy.note) {
            const nx = AREA.x + 8;
            const nw = AREA.w - 16;
            base.fillStyle = rgba(tone.ink, 0.3);
            base.fillRect(nx * k, NOTE_TOP * k, nw * k, 2.5 * k);
            base.textAlign = 'left';
            base.textBaseline = 'alphabetic';
            base.fillStyle = rgba(tone.mid);
            base.font = `680 ${27 * k}px ${SANS}`;
            tracking(base, 27 * k * 0.16);
            base.fillText(copy.note.label.toUpperCase(), nx * k, (NOTE_TOP + 50) * k);
            let ny = NOTE_TOP + 106;
            tracking(base, 0);
            if (copy.note.head) {
              base.fillStyle = rgba(tone.ink);
              base.font = `640 ${45 * k}px ${SANS}`;
              tracking(base, -45 * k * 0.012);
              base.fillText(copy.note.head, nx * k, ny * k);
              ny += 54;
              tracking(base, 0);
            }
            base.fillStyle = rgba(tone.ink, 0.86);
            base.font = `450 ${37 * k}px ${SANS}`;
            wrap(base, copy.note.text, nw * k).slice(0, 2).forEach((line) => { base.fillText(line, nx * k, ny * k); ny += 49; });
          }

          base.textAlign = 'left';
          base.textBaseline = 'alphabetic';
          base.fillStyle = rgba(tone.mid);
          base.font = `650 ${30 * k}px ${SANS}`;
          tracking(base, 30 * k * 0.16);
          base.fillText(copy.kicker.toUpperCase(), column.x * k, 150 * k);
          base.fillStyle = rgba(tone.ink);
          base.font = `600 ${92 * k}px ${SERIF}`;
          tracking(base, -92 * k * 0.012);
          let y = 264;
          copy.title.forEach((line) => { base.fillText(line, column.x * k, y * k); y += 98; });
          y += 4;
          tracking(base, 0);
          if (copy.body) {
            base.font = `450 ${43 * k}px ${SANS}`;
            base.fillStyle = rgba(tone.ink, 0.86);
            wrap(base, copy.body, column.w * k).forEach((line) => { base.fillText(line, column.x * k, y * k); y += 60; });
          }
          copy.points?.forEach((group) => {
            y += 26;
            base.fillStyle = rgba(tone.mid);
            base.font = `680 ${28 * k}px ${SANS}`;
            tracking(base, 28 * k * 0.16);
            base.fillText(group.heading.toUpperCase(), column.x * k, y * k);
            tracking(base, 0);
            y += 64;
            group.lines.forEach((text) => {
              // a bead in the margin, then the line
              base.fillStyle = rgba(tone.mid);
              base.beginPath(); base.arc((column.x + 12) * k, (y - 15) * k, 9 * k, 0, Math.PI * 2); base.fill();
              base.fillStyle = rgba(tone.ink, 0.9);
              base.font = `450 ${45 * k}px ${SANS}`;
              wrap(base, text, (column.w - 50) * k).forEach((line) => { base.fillText(line, (column.x + 46) * k, y * k); y += 60; });
              y += 14;
            });
          });
          stage.tooth(0.06);

          /* in front: the photographs, like prints laid on the page */
          if (photo && copy.photo) {
            const foot = 62;
            const top = Math.max(y + 4, 560);
            const room = 1078 - top;
            const gap = 36;
            const share = second && copy.photo.second ? copy.photo.second.share : 0;
            // a picture shown whole keeps its own shape; the others fill the room there is
            const shape = photo.naturalHeight / photo.naturalWidth;
            const h = copy.photo.whole ? Math.min(room, column.w * shape) : room;
            const w = copy.photo.whole ? h / shape : share ? column.w * (1 - share) - gap / 2 : column.w;
            print(fg, k, photo, copy.photo, column.x, top, w, h, foot, t);
            fg.fillStyle = rgba([70, 58, 52]);
            fg.font = `500 ${28 * k}px ${SANS}`;
            tracking(fg, 0);
            fg.textAlign = 'left';
            fg.textBaseline = 'middle';
            fg.fillText(copy.photo.caption, (column.x + 6) * k, (top + h + foot / 2 + 2) * k);
            if (second && copy.photo.second) {
              const w2 = column.w * share - gap / 2;
              const x2 = column.x + column.w - w2;
              print(fg, k, second, copy.photo.second, x2, top, w2, h, foot, t);
              fg.fillStyle = rgba([70, 58, 52]);
              fg.fillText(copy.photo.second.caption, (x2 + 6) * k, (top + h + foot / 2 + 2) * k);
            }
          }
        },
      });
    },
  };
}

const TONES: Record<string, StoryTone> = {
  orange: { paper: [255, 240, 220], ink: [107, 41, 6], mid: [232, 114, 28] },
  rose: { paper: [255, 238, 240], ink: [106, 18, 48], mid: [216, 55, 94] },
  green: { paper: [238, 250, 236], ink: [20, 73, 42], mid: [47, 143, 78] },
  blue: { paper: [234, 244, 255], ink: [13, 42, 110], mid: [47, 125, 240] },
  red: { paper: [255, 236, 231], ink: [111, 23, 17], mid: [220, 58, 44] },
  cobalt: { paper: [236, 241, 255], ink: [20, 48, 150], mid: [38, 84, 230] },
  plum: { paper: [246, 236, 253], ink: [58, 26, 85], mid: [142, 85, 196] },
  cream: { paper: [250, 244, 234], ink: [44, 30, 22], mid: [196, 96, 40] },
};

/*
 * Where the words come from. Why, the three choices and the last page: Adi's
 * project notes (data/projects/surya.json). "My first try at laser cutting and
 * sandblasting", the three flowers and what they do: his own post about the
 * build. The loose ground pin: his own account of the night it first ran.
 * Lights, motors, buttons, the board: the firmware. The radar, Home Assistant,
 * 77 inches and "the environment notices me": his write-up of the presence
 * system, and his own film of it (the clock giving way to "69%", the print's
 * progress, as he walks up). Two layers, the mandala from India, frosted
 * acrylic: said to me.
 */
export const SURYA_STORIES: LiveScene[] = [
  storyScene('surya-story-why', TONES.orange, {
    kicker: '01 · Why',
    title: ['I kept missing', 'their calls.'],
    body: 'I moved to the US and never knew if my family was awake. A screen can show their time. It cannot show them.',
    note: {
      label: 'The choice',
      head: 'Movement, not a screen.',
      text: 'It shows someone is there without asking for attention. The cost: more mechanics, slower changes.',
    },
    photo: { src: PHOTO.wall, caption: 'Surya on my wall.', focus: [0.41, 0.5], zoom: 1.35 },
  }, drawWhy, 8, 2, [PHOTO.product]),
  storyScene('surya-story-form', TONES.rose, {
    kicker: '02 · Form',
    title: ['A mandala,', 'cut by laser.'],
    body: 'The mandala comes from my heritage in India. This was my first try at laser cutting and sandblasting.',
    note: {
      label: 'The drawing',
      text: 'This is the real laser file: one cut line, one window for the display, three holes for the flowers, and the engraving.',
    },
    photo: {
      src: PHOTO.held, caption: 'The front layer, just made.', focus: [0.52, 0.5],
      second: { src: PHOTO.sandblaster, caption: 'The sandblaster.', focus: [0.5, 0.4], share: 0.36 },
    },
  }, drawForm, 11.6, 8.6),
  storyScene('surya-story-body', TONES.green, {
    kicker: '03 · Body',
    title: ['Two layers', 'of wood.'],
    body: 'A back layer and an engraved front layer. Stacked, they give the piece depth, and light fills the gap between them.',
    note: {
      label: 'The choice',
      head: 'Wood layers, not a 3D-printed body.',
      text: 'Wood gave it warmth, scale and depth. The cost: little room to change anything once it is cut.',
    },
    photo: { src: PHOTO.stack, caption: 'Both layers on the bench.', focus: [0.46, 0.62], zoom: 1.12 },
  }, drawBody, 9, 4.4),
  storyScene('surya-story-light', TONES.blue, {
    kicker: '04 · Light',
    title: ['256 lights behind', 'frosted acrylic.'],
    body: 'A 32 by 8 grid of lights sits in the window. A frosted sheet in front turns their hard points into a soft glow.',
    note: {
      label: 'The numbers',
      text: '32 by 8 makes 256 lights in the window. 68 more run around the rim, between the two layers of wood.',
    },
    photo: {
      src: PHOTO.display, caption: 'Lights through the sheet.', focus: [0.34, 0.5], zoom: 1.04,
      second: { src: PHOTO.window, caption: 'The sheet in its window.', focus: [0.42, 0.5], share: 0.46 },
    },
  }, drawLight, 10.4, 6.4),
  storyScene('surya-story-flowers', TONES.red, {
    kicker: '05 · Flowers',
    title: ['Three printed', 'flowers that open.'],
    body: 'One for each person in my family. A flower opens when they wake and closes when they sleep.',
    note: {
      label: 'The choice',
      head: 'Small DC motors, not servos.',
      text: 'Smoother motion. The cost: a motor cannot tell where it is, so each flower needs hard stops and tuning.',
    },
    photo: { src: PHOTO.flowers, caption: 'The three flowers on the piece.', whole: true },
  }, drawFlowers, 12, 3.4),
  storyScene('surya-story-brain', TONES.cobalt, {
    kicker: '06 · Brain',
    title: ['One small board', 'runs it all.'],
    body: 'An ESP32 keeps three clocks, drives three motors and 324 lights, and reads three buttons. Press one to see that person’s time.',
    note: {
      label: 'The hard night',
      head: 'One loose ground pin.',
      text: 'The petals jerked, the code froze, a motor went too far. I traced every wire until I found it.',
    },
    photo: { src: PHOTO.button, caption: 'One of the three buttons, above its flower.', focus: [0.5, 0.5] },
  }, drawBrain, 10, 6.4),
  storyScene('surya-story-house', TONES.plum, {
    kicker: '07 · House',
    title: ['Now it knows', 'when I walk up.'],
    body: 'A radar sees me come close. Home Assistant picks what matters, and Surya shows it: how far a 3D print is, or what is next on my calendar.',
    note: {
      label: 'The idea',
      head: 'I do not press anything to ask.',
      text: 'The room notices me and answers. It triggers when I have been closer than 77 inches for 3 seconds.',
    },
    photo: {
      src: PHOTO.walkup, film: true, caption: 'I walk up: my print, 69% done.', focus: [0.5, 0.5], zoom: 1.04,
      second: { src: PHOTO.radar, caption: 'The radar.', focus: [0.55, 0.45], share: 0.42 },
    },
  }, drawHouse, 10.6, 7.4, [WALKER]),
  storyScene('surya-story-learned', TONES.cream, {
    kicker: '08 · Learned',
    title: ['What worked.', 'What was hard.'],
    points: [
      { heading: 'Worked', lines: ['Slow, steady motion felt calm and alive.', 'One flower per person needed no explaining.'] },
      { heading: 'Hard', lines: ['Getting three motors to move in step took far more tries than I expected.'] },
    ],
  }, drawLearned, 8, 2, [PHOTO.wall]),
];

/* ---------- cover and last page ---------- */

/** The cover: the real piece, its name, and one line. */
export const suryaCover: LiveScene = {
  id: 'surya-cover',
  sources: [PHOTO.product],
  create(images, width, height) {
    const stage = createStage(width, height);
    const { k, base, word, fg } = stage;
    const product = images.get(PHOTO.product);
    return loopPage(stage, {
      loop: 6,
      rest: 1.5,
      step() { /* nothing to advance */ },
      draw(_t, clock) {
        const bg = base.createLinearGradient(0, 0, width, height);
        bg.addColorStop(0, '#2a1208');
        bg.addColorStop(1, '#140804');
        base.fillStyle = bg;
        base.fillRect(0, 0, width, height);
        const cx = 1440 * k;
        const cy = 600 * k;
        const glow = base.createRadialGradient(cx, cy, 120 * k, cx, cy, 760 * k);
        glow.addColorStop(0, rgba([255, 80, 150], 0.34 + 0.08 * Math.sin(clock * 1.3)));
        glow.addColorStop(1, rgba([255, 80, 150], 0));
        base.fillStyle = glow;
        base.fillRect(0, 0, width, height);
        stage.tooth(0.07);

        word.textAlign = 'left';
        word.textBaseline = 'alphabetic';
        word.fillStyle = '#fff0dc';
        word.font = `800 ${300 * k}px ${SANS}`;
        tracking(word, -300 * k * 0.05);
        word.fillText('Surya', 110 * k, 640 * k);
        word.font = `450 ${50 * k}px ${SANS}`;
        tracking(word, 0);
        word.fillStyle = rgba([255, 226, 196], 0.92);
        ['A wall piece that shows', 'when my family is awake.'].forEach((line, i) => word.fillText(line, 118 * k, (760 + i * 66) * k));
        word.font = `650 ${28 * k}px ${SANS}`;
        tracking(word, 28 * k * 0.16);
        word.fillStyle = rgba([255, 170, 110], 0.95);
        word.fillText('A FLIP BOOK · TURN THE PAGE', 118 * k, 1010 * k);

        if (product) drawProduct(fg, product, cx, cy, (950 * k) / ACROSS);
      },
    });
  },
};

/** The last page: the piece where it lives. */
export const suryaEnd: LiveScene = {
  id: 'surya-end',
  sources: [PHOTO.wall],
  create(images, width, height) {
    const stage = createStage(width, height);
    const { k, base } = stage;
    const wall = images.get(PHOTO.wall);
    return loopPage(stage, {
      loop: 6,
      rest: 1,
      step() { /* nothing to advance */ },
      draw() {
        base.fillStyle = '#b9b6b0';
        base.fillRect(0, 0, width, height);
        if (wall) frame(base, wall, 0, 0, width, height, 0, [0.5, 0.5], 1);
        // a little weight in the corners, as a print has
        const shade = base.createRadialGradient(width * 0.5, height * 0.5, height * 0.5, width * 0.5, height * 0.5, height * 1.1);
        shade.addColorStop(0, 'rgba(20,14,10,0)');
        shade.addColorStop(1, 'rgba(20,14,10,0.3)');
        base.fillStyle = shade;
        base.fillRect(0, 0, width, height);
        base.textAlign = 'left';
        base.textBaseline = 'alphabetic';
        base.fillStyle = '#2a1c14';
        base.font = `600 ${112 * k}px ${SERIF}`;
        tracking(base, -1 * k);
        ['It hangs', 'on my wall.'].forEach((line, i) => base.fillText(line, 1370 * k, (500 + i * 118) * k));
        base.font = `450 ${40 * k}px ${SANS}`;
        tracking(base, 0);
        base.fillStyle = rgba([42, 28, 20], 0.86);
        ['In step with my family’s days,', 'across three time zones.'].forEach((line, i) => base.fillText(line, 1374 * k, (716 + i * 54) * k));
      },
    });
  },
};
