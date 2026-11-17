/**
 * Line drawings of Surya's real parts, for the story pages.
 *
 * Nothing here is invented geometry: the mandala's cut lines and engraving
 * come from Adi's laser file, the back layer's outline and the buttons'
 * places from his photo of the piece on his wall, and the flower from the
 * STL parts he printed (see scripts/flipbook/make-surya-parts.py). The
 * numbers of lights, motors and buttons come from the firmware.
 *
 * Flat parts (the wood layers, the display, the acrylic sheet) are drawn as
 * plates seen from one side, so a page can pull the stack apart along its
 * depth and push it back together.
 */

import { clamp, lerp, rgba, type Rgb } from './motion';
import { SURYA_PARTS } from './sprites/suryaParts';

export const LASER = SURYA_PARTS.laser;
/** How far the back layer reaches from the centre, in laser units; the front layer reaches about 191. */
export const BACK_HALF: number = SURYA_PARTS.backHalf;
/** From the firmware: a 32 by 8 matrix, 68 lights on the rim in three runs, three motors, three buttons. */
export const MATRIX = { cols: 32, rows: 8 };
export const RIM_LIGHTS = 68;
/** Where the three push buttons sit (laser units from the centre), measured on the photo of the piece. */
export const BUTTONS: ReadonlyArray<readonly [number, number]> = SURYA_PARTS.buttons.map(([x, y]) => [x, y] as const);
/** The flower holes, in laser units from the centre: top, lower right, lower left. */
export const FLOWERS: ReadonlyArray<readonly [number, number]> = SURYA_PARTS.laser.holes.map(([x, y]) => [x - SURYA_PARTS.laser.centre[0], y - SURYA_PARTS.laser.centre[1]] as const);

/**
 * The photograph of the real piece (cut from the wall it hangs on), drawn so
 * that its centre lands on (x, y) and one laser unit is `scale` canvas pixels:
 * the same ruler the line drawings use, so a drawing can turn into the photo.
 */
export function drawProduct(ctx: CanvasRenderingContext2D, photo: CanvasImageSource, x: number, y: number, scale: number, alpha = 1): void {
  if (alpha <= 0.01) return;
  const { size, centre, scale: photoScale } = SURYA_PARTS.photo;
  const f = scale / photoScale;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(photo, x - centre[0] * f, y - centre[1] * f, size * f, size * f);
  ctx.restore();
}

let cut: Path2D | null = null;
let back: Path2D | null = null;
let openings: Path2D | null = null;

/** The front layer's cut outline, the back layer's outline, and the window and flower holes both share. */
export const cutPath = (): Path2D => (cut ??= new Path2D(LASER.cut));
export const backPath = (): Path2D => {
  if (!back) {
    back = new Path2D();
    SURYA_PARTS.back.forEach(([x, y], i) => (i ? back!.lineTo(x, y) : back!.moveTo(x, y)));
    back.closePath();
  }
  return back;
};
export const openingsPath = (): Path2D => {
  if (!openings) {
    openings = new Path2D();
    const [x, y, w, h] = LASER.window;
    openings.rect(x, y, w, h);
    LASER.holes.forEach(([hx, hy, r]) => { openings!.moveTo(hx + r, hy); openings!.arc(hx, hy, r, 0, Math.PI * 2); });
  }
  return openings;
};

/**
 * How the wall piece is looked at: turned about its upright axis (`turn`,
 * radians; 0 is straight on) and tipped forward (`tip`). `scale` is canvas
 * pixels per laser unit and (x, y) is where the piece's centre lands.
 */
export interface View { turn: number; tip: number; scale: number; x: number; y: number }

/** Set the canvas so that drawing in laser-file units lands on a plate `z` units out from the wall. */
export function onPlate(ctx: CanvasRenderingContext2D, view: View, z: number): void {
  const cosT = Math.cos(view.turn);
  const sinT = Math.sin(view.turn);
  const cosP = Math.cos(view.tip);
  const sinP = Math.sin(view.tip);
  const s = view.scale;
  ctx.setTransform(cosT * s, -sinT * sinP * s, 0, cosP * s, view.x + z * sinT * s, view.y + z * cosT * sinP * s);
  ctx.translate(-LASER.centre[0], -LASER.centre[1]);
}

/** Where a point on a plate lands on the canvas. (px, py) are laser units from the centre. */
export function plotOnPlate(view: View, px: number, py: number, z: number): { x: number; y: number } {
  const cosT = Math.cos(view.turn);
  const sinT = Math.sin(view.turn);
  const sinP = Math.sin(view.tip);
  return {
    x: view.x + (px * cosT + z * sinT) * view.scale,
    y: view.y + (py * Math.cos(view.tip) + (-px * sinT + z * cosT) * sinP) * view.scale,
  };
}

export interface PlateStyle {
  /** Body colour: hides whatever lies behind the plate. Null leaves it open. */
  fill: Rgb | null;
  line: Rgb;
  /** Line width in canvas pixels. */
  width: number;
  /** How thick the plate is, in laser units: its rear edge is drawn this far behind. */
  thick?: number;
  alpha?: number;
  /** Draw only this much of the outline (0..1), for a line that draws itself. */
  drawn?: number;
}

/** One wood layer: its body, its window and holes cut through, and its outline. */
export function drawLayer(ctx: CanvasRenderingContext2D, view: View, z: number, which: 'front' | 'back', style: PlateStyle): void {
  const outline = which === 'front' ? cutPath() : backPath();
  const alpha = style.alpha ?? 1;
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineJoin = 'round';
  const body = new Path2D();
  body.addPath(outline);
  body.addPath(openingsPath());
  const thick = style.thick ?? 0;
  if (thick > 0) {
    onPlate(ctx, view, z - thick);
    ctx.lineWidth = style.width / view.scale;
    if (style.fill) { ctx.fillStyle = rgba(style.fill); ctx.fill(body, 'evenodd'); }
    ctx.strokeStyle = rgba(style.line, 0.55);
    ctx.stroke(outline);
  }
  onPlate(ctx, view, z);
  ctx.lineWidth = style.width / view.scale;
  if (style.fill) { ctx.fillStyle = rgba(style.fill); ctx.fill(body, 'evenodd'); }
  ctx.strokeStyle = rgba(style.line);
  if (style.drawn !== undefined && style.drawn < 1) {
    const length = which === 'front' ? 5200 : 1900;
    ctx.setLineDash([length * clamp(style.drawn), length * 2]);
  }
  ctx.stroke(outline);
  ctx.setLineDash([]);
  ctx.stroke(openingsPath());
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * The engraving on the front layer, from the laser file. `tinted` is the
 * engraving picture already coloured (see tintSheet). `shown` reveals it from
 * the top down, the way the laser lays it in.
 */
export function drawEngraving(ctx: CanvasRenderingContext2D, view: View, z: number, tinted: CanvasImageSource, alpha = 1, shown = 1): void {
  if (alpha <= 0.01 || shown <= 0) return;
  const half = LASER.half;
  ctx.save();
  ctx.globalAlpha *= alpha;
  onPlate(ctx, view, z);
  if (shown < 1) {
    ctx.beginPath();
    ctx.rect(LASER.centre[0] - half, LASER.centre[1] - half, half * 2, half * 2 * shown);
    ctx.clip();
  }
  ctx.drawImage(tinted, LASER.centre[0] - half, LASER.centre[1] - half, half * 2, half * 2);
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** The LED matrix in the window: 32 by 8 lights. `lit(col, row)` gives each one's brightness (0..1). */
export function drawMatrix(
  ctx: CanvasRenderingContext2D, view: View, z: number, line: Rgb, glow: Rgb, width: number,
  lit: (col: number, row: number) => number, alpha = 1,
): void {
  if (alpha <= 0.01) return;
  const [x, y, w, h] = LASER.window;
  const pitch = w / MATRIX.cols;
  const top = y + (h - pitch * MATRIX.rows) / 2;
  ctx.save();
  ctx.globalAlpha *= alpha;
  onPlate(ctx, view, z);
  ctx.lineWidth = width / view.scale;
  ctx.strokeStyle = rgba(line);
  ctx.strokeRect(x, y, w, h);
  for (let col = 0; col < MATRIX.cols; col += 1) {
    for (let row = 0; row < MATRIX.rows; row += 1) {
      const on = clamp(lit(col, row));
      const cx = x + (col + 0.5) * pitch;
      const cy = top + (row + 0.5) * pitch;
      if (on > 0.02) {
        ctx.fillStyle = rgba(glow, on);
        ctx.beginPath(); ctx.arc(cx, cy, pitch * 0.36, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = rgba(line, 0.42);
        ctx.beginPath(); ctx.arc(cx, cy, pitch * 0.13, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** The frosted acrylic sheet that sits over the matrix. */
export function drawSheet(ctx: CanvasRenderingContext2D, view: View, z: number, line: Rgb, body: Rgb, width: number, alpha = 1, bodyAlpha = 0.5): void {
  if (alpha <= 0.01) return;
  const [x, y, w, h] = LASER.window;
  const m = 7;
  ctx.save();
  ctx.globalAlpha *= alpha;
  onPlate(ctx, view, z);
  ctx.lineWidth = width / view.scale;
  ctx.fillStyle = rgba(body, bodyAlpha);
  ctx.strokeStyle = rgba(line);
  ctx.beginPath();
  ctx.roundRect(x - m, y - m, w + m * 2, h + m * 2, 5);
  ctx.fill();
  ctx.stroke();
  // frosting: short slanted strokes
  ctx.strokeStyle = rgba(line, 0.32);
  ctx.beginPath();
  for (let i = 0; i < 18; i += 1) {
    const sx = x + (i / 18) * w + 4;
    ctx.moveTo(sx, y + h * 0.78);
    ctx.lineTo(sx + 12, y + h * 0.22);
  }
  ctx.stroke();
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** The lights around the rim: 68 of them, following the back layer's edge. `lit(i)` gives brightness. */
export function drawRim(ctx: CanvasRenderingContext2D, view: View, z: number, line: Rgb, glow: Rgb, lit: (i: number) => number, alpha = 1): void {
  if (alpha <= 0.01) return;
  const points = SURYA_PARTS.back;
  // walk the outline and drop a light at equal steps, a little inside the edge
  const lengths: number[] = [0];
  for (let i = 1; i <= points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i % points.length];
    lengths.push(lengths[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = lengths[lengths.length - 1];
  ctx.save();
  ctx.globalAlpha *= alpha;
  onPlate(ctx, view, z);
  let seg = 1;
  for (let i = 0; i < RIM_LIGHTS; i += 1) {
    const at = ((i + 0.5) / RIM_LIGHTS) * total;
    while (seg < lengths.length - 1 && lengths[seg] < at) seg += 1;
    const a = points[seg - 1];
    const b = points[seg % points.length];
    const u = (at - lengths[seg - 1]) / Math.max(1e-6, lengths[seg] - lengths[seg - 1]);
    const px = LASER.centre[0] + (lerp(a[0], b[0], u) - LASER.centre[0]) * 0.86;
    const py = LASER.centre[1] + (lerp(a[1], b[1], u) - LASER.centre[1]) * 0.86;
    const on = clamp(lit(i));
    ctx.fillStyle = on > 0.02 ? rgba(glow, 0.35 + 0.65 * on) : rgba(line, 0.5);
    ctx.beginPath(); ctx.arc(px, py, on > 0.02 ? 3.4 : 2.1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A round part standing off the wall (a motor behind a flower, a push button): two rings and the lines joining them. */
export function drawDrum(ctx: CanvasRenderingContext2D, view: View, px: number, py: number, z0: number, z1: number, radius: number, line: Rgb, fill: Rgb | null, width: number, alpha = 1): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineWidth = width;
  ctx.strokeStyle = rgba(line);
  const ring = (z: number, paint: boolean): void => {
    onPlate(ctx, view, z);
    ctx.lineWidth = width / view.scale;
    ctx.beginPath();
    ctx.arc(LASER.centre[0] + px, LASER.centre[1] + py, radius, 0, Math.PI * 2);
    if (paint && fill) { ctx.fillStyle = rgba(fill); ctx.fill(); }
    ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
  ring(z0, true);
  // the two edge lines of the cylinder, as seen from this side
  const side = Math.cos(view.turn) >= 0 ? 1 : -1;
  ctx.lineWidth = width;
  [[0, -radius], [0, radius]].forEach(([dx, dy]) => {
    const a = plotOnPlate(view, px + dx * side, py + dy, z0);
    const b = plotOnPlate(view, px + dx * side, py + dy, z1);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  });
  ring(z1, true);
  ctx.restore();
}

/** The controller board (an ESP32), as a small board with its two rows of pins and its radio can. */
export function drawBoard(ctx: CanvasRenderingContext2D, view: View, px: number, py: number, z: number, line: Rgb, fill: Rgb | null, width: number, alpha = 1): void {
  if (alpha <= 0.01) return;
  const w = 64;
  const h = 30;
  ctx.save();
  ctx.globalAlpha *= alpha;
  onPlate(ctx, view, z);
  ctx.lineWidth = width / view.scale;
  ctx.strokeStyle = rgba(line);
  const x = LASER.centre[0] + px - w / 2;
  const y = LASER.centre[1] + py - h / 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 2);
  if (fill) { ctx.fillStyle = rgba(fill); ctx.fill(); }
  ctx.stroke();
  ctx.strokeRect(x + 3, y + 7, 22, 16); // radio can
  ctx.strokeRect(x + w - 8, y + 10, 8, 10); // usb
  ctx.fillStyle = rgba(line);
  for (let i = 0; i < 15; i += 1) {
    ctx.fillRect(x + 4 + i * 3.9, y + 1.6, 1.6, 1.6);
    ctx.fillRect(x + 4 + i * 3.9, y + h - 3.2, 1.6, 1.6);
  }
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/* ---------- the printed flower ---------- */

type FlowerPart = { readonly outline: readonly (readonly (readonly number[])[])[]; readonly lines: readonly (readonly (readonly number[])[])[]; readonly depth: number; readonly apart?: readonly number[] };

export interface FlowerStyle { paper: Rgb; line: Rgb; width: number }

/**
 * The flower drawn from its printed parts. `open` runs from 0 (a shut bud) to
 * 1 (fully open); `apart` from 0 (assembled) to 1 (every part pulled clear).
 * (x, y) is where the foot of the screw stands; `scale` is canvas pixels per millimetre.
 */
export function drawFlowerParts(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, open: number, apart: number, style: FlowerStyle, alpha = 1): void {
  if (alpha <= 0.01) return;
  const flower = SURYA_PARTS.flower;
  const steps = flower.steps;
  const degrees = clamp(open) * steps[steps.length - 1];
  let index = 0;
  for (let i = 0; i < steps.length; i += 1) if (Math.abs(steps[i] - degrees) < Math.abs(steps[index] - degrees)) index = i;
  const frame = flower.frames[index];
  const pull = clamp(apart);
  const parts: Array<{ part: FlowerPart; dx: number; dy: number }> = [
    { part: flower.screw as FlowerPart, dx: flower.screwApart[0] * pull, dy: flower.screwApart[1] * pull },
    ...frame.petals.map((part) => ({ part: part as FlowerPart, dx: part.apart[0] * pull, dy: part.apart[1] * pull })),
    ...frame.links.map((part) => ({ part: part as FlowerPart, dx: part.apart[0] * pull, dy: part.apart[1] * pull })),
  ];
  parts.sort((a, b) => b.part.depth - a.part.depth);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = style.width;
  parts.forEach(({ part, dx, dy }) => {
    const ox = x + dx * scale;
    const oy = y + dy * scale;
    ctx.fillStyle = rgba(style.paper);
    part.outline.forEach((poly) => {
      ctx.beginPath();
      poly.forEach(([px, py], i) => (i ? ctx.lineTo(ox + px * scale, oy + py * scale) : ctx.moveTo(ox + px * scale, oy + py * scale)));
      ctx.closePath();
      ctx.fill();
    });
    ctx.strokeStyle = rgba(style.line);
    ctx.beginPath();
    part.lines.forEach((line) => {
      line.forEach(([px, py], i) => (i ? ctx.lineTo(ox + px * scale, oy + py * scale) : ctx.moveTo(ox + px * scale, oy + py * scale)));
    });
    ctx.stroke();
  });
  ctx.restore();
}

/** A flower seen straight on, as it sits on the wall piece: four outer petals, four inner ones and its hub. */
export function drawFlowerFace(ctx: CanvasRenderingContext2D, view: View, z: number, px: number, py: number, radius: number, open: number, line: Rgb, fill: Rgb | null, width: number, alpha = 1): void {
  if (alpha <= 0.01) return;
  const o = clamp(open);
  ctx.save();
  ctx.globalAlpha *= alpha;
  onPlate(ctx, view, z);
  ctx.translate(LASER.centre[0] + px, LASER.centre[1] + py);
  ctx.lineWidth = width / view.scale;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = rgba(line);
  const ring = (count: number, length: number, half: number, twist: number): void => {
    for (let i = 0; i < count; i += 1) {
      ctx.save();
      ctx.rotate((i / count) * Math.PI * 2 + twist);
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.2);
      ctx.bezierCurveTo(half, -length * 0.3, half * 1.1, -length * 0.95, 0, -length);
      ctx.bezierCurveTo(-half * 1.1, -length * 0.95, -half, -length * 0.3, 0, -radius * 0.2);
      if (fill) { ctx.fillStyle = rgba(fill); ctx.fill(); }
      ctx.stroke();
      ctx.restore();
    }
  };
  ring(4, radius * lerp(0.62, 1.5, o), radius * lerp(0.34, 0.62, o), Math.PI / 4 + (1 - o) * 0.5);
  ring(4, radius * lerp(0.44, 0.92, o), radius * lerp(0.24, 0.36, o), (1 - o) * 0.9);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = rgba(fill); ctx.fill(); }
  ctx.stroke();
  ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
