/**
 * Props shared by Jarvis's pages, so every page draws the same box and the same man.
 *
 * The box: a flat illustration of the device on a wall, in the page's colours, not a photo. A near-black
 * case about 1 : 1.75, its sensor head at the top drawn from JARVIS_PARTS (pale dome with facet marks, four
 * LEDs at the measured places), and an eight-petal flower cut into its face with a lighter colour behind.
 * Draw it in three steps so a page can put its own night between them:
 *   drawWallBox (case, head with its LEDs off, flower) -> [the page's darkness] -> drawBoxLights, drawSensingRings.
 *
 * The man: the PRESENT people sheet (five poses). Each pose is drawn to one body size and stood on its feet,
 * so nothing jumps when poses swap (measured on people.webp, half size: head to feet is 303 px in both
 * strides, 316 in `look`, and to the top of the head 313 in `wave`, whose raised hand makes the sprite
 * taller; `pass` is 310 because its standing leg is straight: its head and shirt are the strides' size, so
 * it keeps scale 1 and that rise is his step's bob). `ax` is the middle of his chest across the sprite, `ay`
 * the soles of his shoes, as fractions of its box.
 */

import { lerp, mixRgb, rgba, type Rgb } from './motion';
import { SENSOR, drawSensorHead, drawSensorLeds, sensorPoint, sensorView, type SensorStyle } from './jarvisWire';
import { PRESENT_SPRITES } from './sprites/present';
import { drawSprite, spriteNamed } from './stage';

/* ---------- the man ---------- */

export const MAN_SHEET = '/images/flipbook/jarvis/present/people.webp';
export type ManPose = 'stride-a' | 'pass' | 'stride-b' | 'look' | 'wave';
export const MAN_POSES: Record<ManPose, { scale: number; ax: number; ay: number }> = {
  'stride-a': { scale: 1, ax: 0.453, ay: 0.9935 },
  pass: { scale: 1, ax: 0.277, ay: 0.9968 },
  'stride-b': { scale: 1, ax: 0.447, ay: 0.9968 },
  look: { scale: 303 / 316, ax: 0.528, ay: 0.9938 },
  wave: { scale: 303 / 313, ax: 0.403, ay: 0.997 },
};
/** Head to feet in a stride, in sheet pixels: the measure every pose is fitted to. */
const MAN_BODY = 303;
export const WALK_CYCLE: readonly ManPose[] = ['stride-a', 'pass', 'stride-b', 'pass'];
/** One pose per `step` units walked (so the feet do not slide whatever his pace). */
export const walkPose = (distance: number, step: number): ManPose => WALK_CYCLE[Math.floor(Math.max(0, distance) / step) % WALK_CYCLE.length];

export interface ManPlace {
  /** Where his chest is across, and where his feet stand, in page units. */
  x: number;
  y: number;
  /** Head to feet, in page units. */
  height: number;
  /** Facing left (the sheet faces right). */
  flip?: boolean;
  alpha?: number;
  squash?: number;
  angle?: number;
}

/** The man in one pose, from the people sheet or a tinted copy of it. */
export function drawMan(ctx: CanvasRenderingContext2D, sheet: CanvasImageSource, k: number, pose: ManPose, at: ManPlace): void {
  const fit = MAN_POSES[pose];
  drawSprite(ctx, sheet, spriteNamed(PRESENT_SPRITES.people.sprites, pose), k, {
    x: at.x, y: at.y, scale: (at.height / MAN_BODY) * fit.scale, anchor: [fit.ax, fit.ay],
    flip: at.flip, alpha: at.alpha, squash: at.squash, angle: at.angle,
  });
}

/* ---------- the box on the wall ---------- */

export interface WallBox {
  /** Top left corner and size, in page units. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The dome's centre and radius, and the middle of the flower, in page units. */
  dome: { x: number; y: number; r: number };
  flower: { x: number; y: number };
}

/** A box `h` units tall (about 1 : 1.75) with its middle at (cx, cy). */
export function wallBox(cx: number, cy: number, h = 210): WallBox {
  const w = h / 1.75;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const unit = w / SENSOR.plate.w;
  const headH = SENSOR.plate.h * unit;
  return {
    x, y, w, h,
    dome: { x: x + SENSOR.dome.x * unit, y: y + SENSOR.dome.y * unit, r: SENSOR.dome.r * unit },
    flower: { x: x + w / 2, y: y + headH + (h - headH) * 0.5 },
  };
}

const WARM_WHITE: Rgb = [255, 244, 222];
const AMBER: Rgb = [224, 132, 20];
const HEAD_STYLE: SensorStyle = {
  line: [74, 58, 46], width: 1.6, fill: [40, 32, 26], seatFill: [212, 203, 189], domeFill: [241, 234, 221],
  facetLine: [176, 165, 150], facetAlpha: 0.85, ledOff: [74, 62, 50], ledOn: WARM_WHITE,
};
const headOf = (box: WallBox, k: number): ReturnType<typeof sensorView> => sensorView(box.x * k, box.y * k, box.w * k);

/** The case, its sensor head with the LEDs off, and the flower cut into its face. */
export function drawWallBox(ctx: CanvasRenderingContext2D, k: number, box: WallBox): void {
  const outline = (): void => { ctx.beginPath(); ctx.roundRect(box.x * k, box.y * k, box.w * k, box.h * k, 12 * k); };
  ctx.save();
  ctx.shadowColor = 'rgba(40, 18, 4, 0.35)';
  ctx.shadowBlur = 16 * k;
  ctx.shadowOffsetX = 5 * k;
  ctx.shadowOffsetY = 9 * k;
  ctx.fillStyle = rgba([28, 22, 18]);
  outline(); ctx.fill();
  ctx.restore();
  ctx.save();
  outline(); ctx.clip();
  drawSensorHead(ctx, headOf(box, k), { ...HEAD_STYLE, width: HEAD_STYLE.width * k, lit: [0, 0, 0, 0] });
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = rgba([66, 52, 42]);
  ctx.lineWidth = 1.6 * k;
  outline(); ctx.stroke();
  // the flower cut into its face, a lighter colour behind it
  const petal = box.w / 120;
  ctx.translate(box.flower.x * k, box.flower.y * k);
  ctx.fillStyle = rgba([168, 128, 78]);
  for (let i = 0; i < 8; i += 1) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    ctx.beginPath(); ctx.ellipse(0, -23 * petal * k, 4.6 * petal * k, 15 * petal * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/** The four LEDs lit by `lit` (0..1 each, in the order of SENSOR.leds), with a soft halo: draw them above any darkness. */
export function drawBoxLights(ctx: CanvasRenderingContext2D, k: number, box: WallBox, lit: readonly number[]): void {
  const head = headOf(box, k);
  lit.forEach((on, i) => {
    if (on < 0.02) return;
    const led = SENSOR.leds[i];
    const at = sensorPoint(head, led.x, led.y);
    const reach = 26 * (box.w / 120) * k;
    const halo = ctx.createRadialGradient(at.x, at.y, 0, at.x, at.y, reach);
    halo.addColorStop(0, rgba(WARM_WHITE, 0.7 * on));
    halo.addColorStop(0.35, rgba([255, 214, 150], 0.28 * on));
    halo.addColorStop(1, rgba([255, 214, 150], 0));
    ctx.fillStyle = halo;
    ctx.fillRect(at.x - reach, at.y - reach, reach * 2, reach * 2);
  });
  drawSensorLeds(ctx, head, { ...HEAD_STYLE, width: HEAD_STYLE.width * k, lit });
}

/**
 * Rings leaving the dome, one every 1.5 s, expanding downward and fading: it is always watching. `seen`
 * (0..1) is whether someone is there: very faint amber with nobody, pale and warm while someone is (an
 * amber ring would vanish on a lit amber wall).
 */
export function drawSensingRings(ctx: CanvasRenderingContext2D, k: number, box: WallBox, clock: number, seen: number, reach = 620): void {
  ctx.save();
  ctx.lineCap = 'round';
  for (let n = 0; n < 2; n += 1) {
    const u = (clock / 3 + n / 2) % 1;
    const radius = lerp(box.dome.r, reach, 1 - (1 - u) ** 1.6);
    const fade = (1 - u) ** lerp(1.5, 1.1, seen);
    ctx.strokeStyle = rgba(mixRgb(AMBER, [255, 236, 190], seen), fade * lerp(0.14, 0.85, seen));
    ctx.lineWidth = lerp(5, 2.6, u) * lerp(1, 1.25, seen) * k;
    ctx.beginPath(); ctx.arc(box.dome.x * k, box.dome.y * k, radius * k, Math.PI * 0.14, Math.PI * 0.86); ctx.stroke();
  }
  ctx.restore();
}
