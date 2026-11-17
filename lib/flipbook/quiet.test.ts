import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QUIET_AFTER_MS, pageBusy, setTouchedForTest, whenQuiet } from './quiet';

describe('background drawing waits for a quiet moment', () => {
  // (no browser here: the timers are the test's own, and `window` is the test's global)
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('window', globalThis); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('counts the page as busy while a finger is down and just after a scroll', () => {
    setTouchedForTest(performance.now());
    expect(pageBusy()).toBe(true);
    vi.advanceTimersByTime(QUIET_AFTER_MS + 10);
    expect(pageBusy()).toBe(false);
    setTouchedForTest(performance.now() - 5000, true);
    expect(pageBusy()).toBe(true);
  });

  it('does not run while the page is being moved, and runs once it is let go', () => {
    const fn = vi.fn();
    setTouchedForTest(performance.now(), true);          // a finger is on the page
    whenQuiet(fn, 5000);
    vi.advanceTimersByTime(1500);
    expect(fn).not.toHaveBeenCalled();
    setTouchedForTest(performance.now());                // lifted
    vi.advanceTimersByTime(QUIET_AFTER_MS + 200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs anyway once its patience is used up, so needed drawing is never starved', () => {
    const fn = vi.fn();
    setTouchedForTest(performance.now(), true);
    whenQuiet(fn, 600);
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs at once when nothing is happening', () => {
    const fn = vi.fn();
    setTouchedForTest(performance.now() - 10000);
    whenQuiet(fn);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
