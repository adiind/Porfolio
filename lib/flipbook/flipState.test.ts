import { describe, expect, it } from 'vitest';
import {
  beginDrag, createFlipState, endDrag, isSettled, setCurrent, stepFlip, updateDrag, type FlipState,
} from './flipState';

const DT = 1 / 60;

const settle = (s: FlipState, onStep?: (s: FlipState) => void): number => {
  let steps = 0;
  while (stepFlip(s, DT)) {
    onStep?.(s);
    steps += 1;
    if (steps > 2000) throw new Error('flip never settled');
  }
  return steps;
};

const expectOrdered = (s: FlipState) => {
  for (let i = 1; i < s.count; i += 1) expect(s.t[i]).toBeLessThanOrEqual(s.t[i - 1] + 1e-6);
};

describe('flip state', () => {
  it('starts closed and settled', () => {
    const s = createFlipState(8);
    expect(s.current).toBe(0);
    expect(Array.from(s.t)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(isSettled(s)).toBe(true);
    expect(stepFlip(s, DT)).toBe(false);
  });

  it('turns every leaf before the current page and no others', () => {
    const s = createFlipState(8);
    setCurrent(s, 5);
    settle(s);
    expect(Array.from(s.t)).toEqual([1, 1, 1, 1, 1, 0, 0, 0]);
    expect(isSettled(s)).toBe(true);
  });

  it('never lets a leaf pass through its neighbour', () => {
    const s = createFlipState(8);
    setCurrent(s, 6);
    let steps = 0;
    settle(s, (state) => {
      expectOrdered(state);
      steps += 1;
      if (steps === 18) setCurrent(state, 1);
    });
    expect(Array.from(s.t)).toEqual([1, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('staggers a riffle so each leaf waits for the one before it', () => {
    const s = createFlipState(8);
    setCurrent(s, 4);
    // the frame (at 60 a second) on which each of the four turning leaves first moves
    const started = [-1, -1, -1, -1];
    let frame = 0;
    settle(s, (state) => {
      frame += 1;
      started.forEach((at, i) => { if (at < 0 && state.t[i] > 0) started[i] = frame; });
    });
    started.forEach((at) => expect(at).toBeGreaterThan(0));
    for (let i = 1; i < started.length; i += 1) expect(started[i]).toBeGreaterThan(started[i - 1]);
  });

  it('keeps the page number inside the book', () => {
    const s = createFlipState(8);
    setCurrent(s, 99);
    expect(s.current).toBe(7);
    setCurrent(s, -3);
    expect(s.current).toBe(0);
  });

  it('commits a drag released past halfway', () => {
    const s = createFlipState(8);
    expect(beginDrag(s, 1)).toBe(true);
    updateDrag(s, 0.7);
    stepFlip(s, DT);
    expect(s.t[0]).toBeCloseTo(0.7, 5);
    endDrag(s, 0);
    expect(s.current).toBe(1);
    settle(s);
    expect(s.t[0]).toBe(1);
  });

  it('puts the page back when a drag is released early', () => {
    const s = createFlipState(8);
    beginDrag(s, 1);
    updateDrag(s, 0.3);
    endDrag(s, 0);
    expect(s.current).toBe(0);
    settle(s);
    expect(s.t[0]).toBe(0);
  });

  it('commits a quick flick even when released early', () => {
    const s = createFlipState(8);
    beginDrag(s, 1);
    updateDrag(s, 0.2);
    endDrag(s, 2);
    expect(s.current).toBe(1);
  });

  it('drags the previous page back', () => {
    const s = createFlipState(8);
    setCurrent(s, 3);
    settle(s);
    expect(beginDrag(s, -1)).toBe(true);
    updateDrag(s, 0.2);
    endDrag(s, 0);
    expect(s.current).toBe(2);
    settle(s);
    expect(Array.from(s.t)).toEqual([1, 1, 0, 0, 0, 0, 0, 0]);
  });

  it('refuses to turn past the last page or before the cover', () => {
    const s = createFlipState(4);
    expect(beginDrag(s, -1)).toBe(false);
    setCurrent(s, 3);
    settle(s);
    expect(beginDrag(s, 1)).toBe(false);
  });

  it('snaps without animation when motion is reduced', () => {
    const s = createFlipState(8);
    s.reduced = true;
    setCurrent(s, 5);
    expect(stepFlip(s, DT)).toBe(false);
    expect(Array.from(s.t)).toEqual([1, 1, 1, 1, 1, 0, 0, 0]);
  });

  it('survives a long frame without overshooting', () => {
    const s = createFlipState(4);
    setCurrent(s, 2);
    stepFlip(s, 0.5);
    for (let i = 0; i < s.count; i += 1) {
      expect(s.t[i]).toBeGreaterThanOrEqual(0);
      expect(s.t[i]).toBeLessThanOrEqual(1);
    }
    expectOrdered(s);
  });
});
