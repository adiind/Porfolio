/** Shapes drawn in code that more than one live page uses. All sizes are in canvas pixels. */

import { clamp, lerp, mixRgb, rgba, type Rgb } from './motion';

/** Eases past its goal and settles back: for things that pop into place. */
export const popIn = (x: number): number => {
  const t = clamp(x) - 1;
  return 1 + 2.4 * t * t * t + 1.4 * t * t;
};

export interface MandalaPalette { deep: Rgb; strong: Rgb; mid: Rgb; pale: Rgb; cream: Rgb }

/**
 * A rangoli-style mandala that grows ring by ring. `progress` runs from 0 (nothing)
 * to MANDALA_STEPS (complete); within each step the ring's petals pop in one after another.
 */
export const MANDALA_STEPS = 5;
export function drawMandala(ctx: CanvasRenderingContext2D, radius: number, progress: number, palette: MandalaPalette, line: number): void {
  const petal = (n: number, r0: number, r1: number, half: number, step: number, fill: Rgb, edge: Rgb): void => {
    const local = clamp(progress - step);
    if (local <= 0) return;
    ctx.fillStyle = rgba(fill);
    ctx.strokeStyle = rgba(edge);
    ctx.lineWidth = line;
    ctx.lineJoin = 'round';
    for (let i = 0; i < n; i += 1) {
      const s = popIn((local - (i / n) * 0.72) / 0.28);
      if (s <= 0.01) continue;
      const a = radius * r0;
      const b = radius * (r0 + (r1 - r0) * s);
      const w = radius * half * Math.min(1, s);
      ctx.save();
      ctx.rotate((i / n) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, -a);
      ctx.bezierCurveTo(w, -a - (b - a) * 0.3, w * 0.92, -a - (b - a) * 0.78, 0, -b);
      ctx.bezierCurveTo(-w * 0.92, -a - (b - a) * 0.78, -w, -a - (b - a) * 0.3, 0, -a);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  };
  // outermost first, so inner rings sit on top
  const rim = clamp(progress - 4);
  if (rim > 0) {
    const n = 24;
    for (let i = 0; i < n; i += 1) {
      const s = popIn((rim - (i / n) * 0.7) / 0.3);
      if (s <= 0.01) continue;
      const angle = (i / n) * Math.PI * 2;
      ctx.fillStyle = rgba(i % 2 === 0 ? palette.cream : palette.mid);
      ctx.beginPath();
      ctx.arc(Math.sin(angle) * radius * 0.93, -Math.cos(angle) * radius * 0.93, radius * 0.042 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  petal(16, 0.56, 0.86, 0.088, 3, palette.mid, palette.deep);
  petal(12, 0.33, 0.62, 0.1, 2, palette.cream, palette.strong);
  petal(8, 0.1, 0.38, 0.115, 1, palette.strong, palette.deep);
  const heart = popIn(clamp(progress) / 0.6);
  if (heart > 0.01) {
    ctx.fillStyle = rgba(palette.cream);
    ctx.strokeStyle = rgba(palette.deep);
    ctx.lineWidth = line;
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.115 * heart, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgba(palette.strong);
    ctx.beginPath(); ctx.arc(0, 0, radius * 0.045 * heart, 0, Math.PI * 2); ctx.fill();
  }
}

/**
 * A printed flower seen from the front, like Surya's: broad outer petals, smaller
 * inner petals between them, and a clear dome in the middle. `open` 0 is a shut bud, 1 fully open.
 */
export function drawBloom(
  ctx: CanvasRenderingContext2D, radius: number, open: number,
  outer: Rgb, inner: Rgb, edge: Rgb, line: number, dome = true,
): void {
  const o = clamp(open, -0.1, 1.2);
  const ring = (n: number, length: number, half: number, fill: Rgb, twist: number): void => {
    ctx.fillStyle = rgba(fill);
    ctx.strokeStyle = rgba(edge);
    ctx.lineWidth = line;
    ctx.lineJoin = 'round';
    for (let i = 0; i < n; i += 1) {
      ctx.save();
      ctx.rotate((i / n) * Math.PI * 2 + twist);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      // a heart-shaped petal: wide shoulders, a soft notch at the tip
      ctx.bezierCurveTo(half * 1.5, -length * 0.25, half * 1.35, -length * 1.02, 0, -length * 0.92);
      ctx.bezierCurveTo(-half * 1.35, -length * 1.02, -half * 1.5, -length * 0.25, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  };
  const shut = 1 - clamp(o);
  // four outer petals and four inner ones, like the printed flowers on the real piece
  ring(4, radius * lerp(0.5, 1, o), radius * lerp(0.3, 0.5, o), outer, shut * 0.9);
  ring(4, radius * lerp(0.36, 0.58, o), radius * lerp(0.22, 0.28, o), inner, Math.PI / 4 + shut * 1.4);
  if (dome) {
    const r = radius * 0.2;
    ctx.fillStyle = rgba(mixRgb(edge, [255, 255, 255], 0.2));
    ctx.beginPath(); ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba([238, 244, 248]);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba([255, 255, 255], 0.95);
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.34, r * 0.34, 0, Math.PI * 2); ctx.fill();
  }
}

/** A small clay oil lamp with a flame that flickers. (x, y) is the middle of its base. */
export function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, flicker: number, bowl: Rgb, flame: Rgb): void {
  const glow = ctx.createRadialGradient(x, y - size * 1.5, 0, x, y - size * 1.5, size * 4.2);
  glow.addColorStop(0, rgba(flame, 0.34 + 0.1 * flicker));
  glow.addColorStop(1, rgba(flame, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(x - size * 4.2, y - size * 5.7, size * 8.4, size * 8.4);
  ctx.fillStyle = rgba(bowl);
  ctx.beginPath();
  ctx.moveTo(x - size * 1.5, y - size * 0.7);
  ctx.quadraticCurveTo(x, y + size * 0.9, x + size * 1.9, y - size * 0.9);
  ctx.lineTo(x + size * 1.5, y - size * 0.7);
  ctx.closePath();
  ctx.fill();
  const h = size * (2 + 0.5 * flicker);
  ctx.fillStyle = rgba(flame);
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.75 - h);
  ctx.quadraticCurveTo(x + size * (0.8 + 0.2 * flicker), y - size * 1.3, x, y - size * 0.75);
  ctx.quadraticCurveTo(x - size * (0.8 - 0.2 * flicker), y - size * 1.3, x, y - size * 0.75 - h);
  ctx.fill();
}
