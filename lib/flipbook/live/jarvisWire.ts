/**
 * Jarvis's sensor head as line art, for the flip book.
 *
 * Every line comes from lib/flipbook/live/sprites/jarvisParts.ts, measured on
 * Adi's own front photograph of the head (sensor.webp) after it was
 * straightened: the plate, the square seat the dome sits in, the dome, the
 * facet centres that could be found, and the four LED lenses. Nothing is
 * filled in by symmetry: only the measured facet centres get a mark.
 *
 * Units are those of JARVIS_PARTS: the plate is 100 wide, origin at its top
 * left, y down. A view places them on the canvas, the same way wire.ts places
 * Surya's laser units, so a page can draw the head at any size, and the
 * photograph can be laid exactly over the drawing (drawSensorPhoto).
 */

import { clamp, mixRgb, rgba, type Rgb } from './motion';
import { JARVIS_PARTS } from './sprites/jarvisParts';

export const SENSOR = JARVIS_PARTS;

/** Where the head is drawn: (x, y) is the plate's top left corner in canvas pixels, `scale` canvas pixels per plate unit. */
export interface SensorView { x: number; y: number; scale: number }

/** A view that puts the plate's top left corner at (x, y) canvas pixels and makes it `width` pixels wide. */
export const sensorView = (x: number, y: number, width: number): SensorView => ({ x, y, scale: width / SENSOR.plate.w });

/** Where a point on the plate (plate units) lands on the canvas. */
export const sensorPoint = (view: SensorView, px: number, py: number): { x: number; y: number } => ({
  x: view.x + px * view.scale,
  y: view.y + py * view.scale,
});

export interface SensorStyle {
  line: Rgb;
  /** Line width in canvas pixels. */
  width: number;
  /** The plate's colour: hides whatever lies behind it. Null leaves it open. */
  fill: Rgb | null;
  /** The seat and the dome, when they are not the plate's colour (a flat illustration rather than line art). */
  seatFill?: Rgb;
  domeFill?: Rgb;
  /** Facet marks: their colour (the line colour by default) and strength (0 leaves them out). */
  facetLine?: Rgb;
  facetAlpha?: number;
  /** LED lenses: their colour when off (the plate's by default) and when lit. */
  ledOff?: Rgb;
  ledOn?: Rgb;
  /** How lit each LED is, 0..1, in the order of SENSOR.leds: top left, top right, bottom left, bottom right. */
  lit?: readonly number[];
  alpha?: number;
  /** How much of the head has drawn itself, 0..1: plate, then seat, dome, facet marks, LEDs, in that order. */
  drawn?: number;
}

/** The share of `drawn` over which each part draws itself. */
const STEPS = {
  plate: [0, 0.38],
  seat: [0.24, 0.56],
  dome: [0.44, 0.76],
  facets: [0.62, 0.9],
  leds: [0.72, 1],
} as const;
const part = (drawn: number, [a, b]: readonly [number, number]): number => clamp((drawn - a) / (b - a));

const roundRectLength = (w: number, h: number, r: number): number => 2 * (w + h) - 8 * r + 2 * Math.PI * r;

/** One closed outline that draws itself: `amount` of its length is stroked, the body fills in with it. */
function outline(ctx: CanvasRenderingContext2D, path: Path2D, length: number, amount: number, fill: Rgb | null | undefined, line: Rgb): void {
  if (amount <= 0) return;
  if (fill) {
    ctx.save();
    ctx.globalAlpha *= clamp(amount * 1.6);
    ctx.fillStyle = rgba(fill);
    ctx.fill(path);
    ctx.restore();
  }
  ctx.strokeStyle = rgba(line);
  if (amount < 1) ctx.setLineDash([length * amount, length * 2]);
  ctx.stroke(path);
  ctx.setLineDash([]);
}

/** A facet mark: a small hexagon round one measured facet centre, smaller than the facet so the marks never claim its edges. */
const hexagon = (cx: number, cy: number, r: number): Path2D => {
  const path = new Path2D();
  for (let i = 0; i < 6; i += 1) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i) path.lineTo(x, y); else path.moveTo(x, y);
  }
  path.closePath();
  return path;
};

/** Just the four LED lenses, lit or not (drawn on their own when they must sit above something drawn after the head). */
export function drawSensorLeds(ctx: CanvasRenderingContext2D, view: SensorView, style: SensorStyle, amount = 1): void {
  const lit = style.lit ?? [];
  const off = style.ledOff ?? style.fill;
  const on = style.ledOn ?? style.line;
  ctx.save();
  ctx.globalAlpha *= style.alpha ?? 1;
  ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
  ctx.lineWidth = style.width / view.scale;
  SENSOR.leds.forEach((led, i) => {
    // one after another as the head draws itself
    const shown = clamp(amount * SENSOR.leds.length - i);
    if (shown <= 0) return;
    const glow = clamp(lit[i] ?? 0);
    const lens = new Path2D();
    lens.arc(led.x, led.y, led.r, -Math.PI / 2, Math.PI * 1.5);
    const colour = off ? mixRgb(off, on, glow) : on;
    outline(ctx, lens, Math.PI * 2 * led.r, shown, off || glow > 0 ? colour : null, style.line);
  });
  ctx.restore();
}

/** The whole head: plate, the dome's square seat, the dome, its facet marks and the four LED lenses. */
export function drawSensorHead(ctx: CanvasRenderingContext2D, view: SensorView, style: SensorStyle): void {
  const alpha = style.alpha ?? 1;
  if (alpha <= 0.01) return;
  const drawn = style.drawn ?? 1;
  const { plate, domeSeat: seat, dome } = SENSOR;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
  ctx.lineWidth = style.width / view.scale;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const platePath = new Path2D();
  platePath.roundRect(0, 0, plate.w, plate.h, plate.corner);
  outline(ctx, platePath, roundRectLength(plate.w, plate.h, plate.corner), part(drawn, STEPS.plate), style.fill, style.line);

  const seatPath = new Path2D();
  seatPath.roundRect(seat.x, seat.y, seat.w, seat.h, seat.corner);
  outline(ctx, seatPath, roundRectLength(seat.w, seat.h, seat.corner), part(drawn, STEPS.seat), style.seatFill ?? style.fill, style.line);

  const domePath = new Path2D();
  domePath.arc(dome.x, dome.y, dome.r, -Math.PI * 0.75, Math.PI * 1.25);
  outline(ctx, domePath, Math.PI * 2 * dome.r, part(drawn, STEPS.dome), style.domeFill ?? style.fill, style.line);

  const facetAlpha = style.facetAlpha ?? 0.7;
  const facets = part(drawn, STEPS.facets);
  if (facetAlpha > 0 && facets > 0) {
    ctx.save();
    ctx.lineWidth = (style.width * 0.6) / view.scale;
    ctx.strokeStyle = rgba(style.facetLine ?? style.line, facetAlpha);
    SENSOR.facets.forEach(([fx, fy], i) => {
      const shown = clamp(facets * SENSOR.facets.length - i);
      if (shown <= 0) return;
      ctx.globalAlpha = alpha * shown;
      ctx.stroke(hexagon(fx, fy, SENSOR.facetR * 0.7));
    });
    ctx.restore();
  }
  ctx.restore();

  drawSensorLeds(ctx, view, style, part(drawn, STEPS.leds));
}

/**
 * Adi's photograph of the head (sensor.webp), laid exactly over a drawing made
 * with the same view: JARVIS_PARTS.photo.plate says where the plate sits in
 * the photograph, in its pixels.
 */
export function drawSensorPhoto(ctx: CanvasRenderingContext2D, photo: HTMLImageElement, view: SensorView, alpha = 1): void {
  if (alpha <= 0.01) return;
  const at = SENSOR.photo.plate;
  // canvas pixels per photo pixel: the plate is SENSOR.plate.w units wide and at.w pixels wide
  const f = (view.scale * SENSOR.plate.w) / at.w;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(photo, view.x - at.x * f, view.y - at.y * f, (photo.naturalWidth || SENSOR.photo.width) * f, (photo.naturalHeight || SENSOR.photo.height) * f);
  ctx.restore();
}
