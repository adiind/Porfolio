/**
 * Page-turn geometry for the project flip books.
 *
 * A leaf is hinged at the spine (u = 0) and turns from flat on the right
 * (t = 0) to flat on the left, face down (t = 1). Its cross-section is a
 * circular arc: the outer edge runs ahead of the spine side, so the sheet
 * bends without stretching. The same formulas are repeated in GLSL in
 * shaders.ts; this copy drives the cast shadow and the tests.
 *
 * Units: page width = 1. x points right, z points up toward the reader.
 */

export interface CurlOpts {
  /** How much earlier the bottom corner starts than the top corner. */
  skew: number;
  /** 0 = soft paper, 1 = rigid board (a cover). */
  stiffness: number;
  /** How far the outer edge runs ahead of the turn. */
  leadGain: number;
  /** Turn progress at which the spine side starts to lift. */
  lagStart: number;
}

export const DEFAULT_CURL: CurlOpts = { skew: 0.18, stiffness: 0, leadGain: 1.5, lagStart: 0.34 };

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (x: number): number => x * x * (3 - 2 * x);

/** Tangent angle (radians) of the sheet at the spine (a0) and at the outer edge (aW). */
export function leafAngles(t: number, v: number, o: CurlOpts = DEFAULT_CURL): { a0: number; aW: number } {
  const tt = clamp01(t);
  const row = clamp01(tt + o.skew * (0.5 - v) * Math.sin(Math.PI * tt));
  const edge = ease(clamp01(row * o.leadGain));
  const follow = ease(clamp01((row - o.lagStart) / (1 - o.lagStart)));
  const spine = follow + (edge - follow) * o.stiffness;
  return { a0: Math.PI * spine, aW: Math.PI * edge };
}

export interface LeafPoint {
  x: number;
  z: number;
  /** Unit normal of the printed (front) face. */
  nx: number;
  nz: number;
  /** Tangent angle at this point. */
  a: number;
}

/** A point on the leaf. u: 0 at the spine, 1 at the outer edge. v: 0 bottom, 1 top. */
export function leafPoint(u: number, v: number, t: number, o: CurlOpts = DEFAULT_CURL): LeafPoint {
  const { a0, aW } = leafAngles(t, v, o);
  const k = aW - a0;
  const a = a0 + k * u;
  let x: number;
  let z: number;
  if (Math.abs(k) < 1e-4) {
    x = u * Math.cos(a0);
    z = u * Math.sin(a0);
  } else {
    x = (Math.sin(a) - Math.sin(a0)) / k;
    z = (Math.cos(a0) - Math.cos(a)) / k;
  }
  return { x, z, nx: -Math.sin(a), nz: Math.cos(a), a };
}

/**
 * Where an airborne leaf's shadow falls on the page plane, for a light that
 * leans `slant` page-widths sideways per unit of height. Returns the left and
 * right limits at the bottom (v = 0) and top (v = 1) rows, plus the peak height.
 */
export function leafShadowSpan(t: number, slant: number, o: CurlOpts = DEFAULT_CURL): {
  min0: number; max0: number; min1: number; max1: number; height: number;
} {
  const span = (v: number) => {
    let min = Infinity;
    let max = -Infinity;
    let height = 0;
    for (let i = 0; i <= 16; i += 1) {
      const p = leafPoint(i / 16, v, t, o);
      const sx = p.x + slant * p.z;
      if (sx < min) min = sx;
      if (sx > max) max = sx;
      if (p.z > height) height = p.z;
    }
    return { min, max, height };
  };
  const bottom = span(0);
  const top = span(1);
  return { min0: bottom.min, max0: bottom.max, min1: top.min, max1: top.max, height: Math.max(bottom.height, top.height) };
}
