/** Small motion helpers shared by live pages. */

export const clamp = (x: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, x));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** A value on a damped spring. `zeta` below 1 overshoots and settles; 1 arrives without bounce. */
export interface Spring { x: number; v: number }

export const springTo = (s: Spring, target: number, omega: number, zeta: number, dt: number): void => {
  let remaining = Math.min(dt, 0.1);
  while (remaining > 1e-5) {
    const h = Math.min(remaining, 1 / 120);
    s.v += (omega * omega * (target - s.x) - 2 * zeta * omega * s.v) * h;
    s.x += s.v * h;
    remaining -= h;
  }
};

export type Rgb = [number, number, number];

export const hexRgb = (hex: string): Rgb => {
  const value = parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const rgba = (c: Rgb, alpha = 1): string => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha.toFixed(3)})`;

/** Repeatable pseudo-random number in 0..1 for an integer seed. */
export const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
