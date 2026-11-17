import { describe, expect, it } from 'vitest';
import { DEFAULT_CURL, leafAngles, leafPoint } from './curl';

const US = Array.from({ length: 21 }, (_, i) => i / 20);
const VS = [0, 0.25, 0.5, 0.75, 1];
const TS = Array.from({ length: 41 }, (_, i) => i / 40);

describe('leaf curl', () => {
  it('lies flat on the right before the turn', () => {
    for (const v of VS) for (const u of US) {
      const p = leafPoint(u, v, 0);
      expect(p.x).toBeCloseTo(u, 6);
      expect(p.z).toBeCloseTo(0, 6);
      expect(p.nz).toBeCloseTo(1, 6);
    }
  });

  it('lies flat on the left, face down, after the turn', () => {
    for (const v of VS) for (const u of US) {
      const p = leafPoint(u, v, 1);
      expect(p.x).toBeCloseTo(-u, 5);
      expect(p.z).toBeCloseTo(0, 5);
      expect(p.nz).toBeCloseTo(-1, 5);
    }
  });

  it('never dips below the page plane', () => {
    for (const t of TS) for (const v of VS) for (const u of US) {
      expect(leafPoint(u, v, t).z).toBeGreaterThanOrEqual(-1e-6);
    }
  });

  it('does not stretch the paper', () => {
    for (const t of [0.2, 0.5, 0.8]) for (const v of VS) {
      let length = 0;
      const steps = 400;
      let prev = leafPoint(0, v, t);
      for (let i = 1; i <= steps; i += 1) {
        const next = leafPoint(i / steps, v, t);
        length += Math.hypot(next.x - prev.x, next.z - prev.z);
        prev = next;
      }
      expect(Math.abs(length - 1)).toBeLessThan(0.005);
    }
  });

  it('only ever turns forward as progress grows', () => {
    for (const v of VS) for (const u of US) {
      let last = -Infinity;
      for (const t of TS) {
        const { a } = leafPoint(u, v, t);
        expect(a).toBeGreaterThanOrEqual(last - 1e-9);
        last = a;
      }
    }
  });

  it('lets the outer edge lead the spine', () => {
    for (const t of TS) for (const v of VS) {
      const { a0, aW } = leafAngles(t, v);
      expect(aW).toBeGreaterThanOrEqual(a0 - 1e-9);
    }
  });

  it('lifts the bottom corner first', () => {
    const bottom = leafPoint(1, 0, 0.12).z;
    const top = leafPoint(1, 1, 0.12).z;
    expect(bottom).toBeGreaterThan(top);
  });

  it('turns as a rigid board at full stiffness', () => {
    for (const t of TS) {
      const { a0, aW } = leafAngles(t, 0.5, { ...DEFAULT_CURL, stiffness: 1 });
      expect(aW).toBeCloseTo(a0, 9);
    }
  });
});
