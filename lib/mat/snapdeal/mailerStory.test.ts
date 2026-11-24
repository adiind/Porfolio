import { describe, expect, it } from 'vitest';
import { END, stateAt } from './mailerStory';

describe('the Snapdeal bag opening', () => {
  it('is over in two and a half seconds, opening included', () => { expect(END).toBeLessThanOrEqual(2.5); });
  it('starts shut and whole', () => { expect(stateAt(0)).toEqual({ rip: 0, free: 0, gape: 0, out: 0, items: [0, 0, 0], hem: 0, sides: 0, phonesLid: 0, shoeLid: 0 }); });
  it('ends torn, open, with everything out and opened', () => { expect(stateAt(END)).toEqual({ rip: 1, free: 1, gape: 1, out: 1, items: [1, 1, 1], hem: 1, sides: 1, phonesLid: 1, shoeLid: 1 }); });
  it('never runs backwards', () => {
    let last = stateAt(0);
    for (let t = 0; t <= END + 1e-9; t += 0.01) {
      const now = stateAt(t);
      const flat = (s: typeof now) => [s.rip, s.free, s.gape, s.out, ...s.items, s.hem, s.sides, s.phonesLid, s.shoeLid];
      flat(now).forEach((value, i) => expect(value).toBeGreaterThanOrEqual(flat(last)[i] - 1e-9));
      last = now;
    }
  });
  it('overlaps its parts: the mouth opens while the tear is still running, and the invoice leaves while the strip is still settling', () => {
    expect(stateAt(0.8).rip).toBeLessThan(1); expect(stateAt(0.8).gape).toBeGreaterThan(0);
    expect(stateAt(1.2).free).toBeLessThan(1); expect(stateAt(1.2).out).toBeGreaterThan(0);
  });
  it('sends the things out one behind the other, never all at once', () => {
    const s = stateAt(1.4);
    expect(s.out).toBeGreaterThan(s.items[0]); expect(s.items[0]).toBeGreaterThan(s.items[1]); expect(s.items[1]).toBeGreaterThan(s.items[2]); expect(s.items[2]).toBeGreaterThan(0);
  });
  it('opens each thing only once it has landed', () => {
    const at = (k: number) => { for (let t = 0; t <= END; t += 0.005) if (k === 0 && stateAt(t).items[0] > 0.999) return t; return END; };
    expect(stateAt(at(0)).sides).toBe(0);
    for (let t = 0; t <= END; t += 0.01) { const s = stateAt(t); if (s.hem > 0) expect(s.items[0]).toBeGreaterThan(0.95); if (s.phonesLid > 0) expect(s.items[1]).toBeGreaterThan(0.9); if (s.shoeLid > 0) expect(s.items[2]).toBeGreaterThan(0.9); }
  });
  it('keeps the invoice inside until the strip is off', () => { expect(stateAt(0.92).out).toBe(0); expect(stateAt(0.92).rip).toBe(1); });
});
