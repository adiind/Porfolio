import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('background drawing waits for a quiet moment', () => {
  // No browser here: the page is an EventTarget that receives the same events a browser window sends, and its timers
  // are the test's own. The module keeps what it has seen, so each test loads a fresh copy.
  let page: EventTarget;
  let quiet: typeof import('./quiet');
  const fire = (name: string) => page.dispatchEvent(new Event(name));

  beforeEach(async () => {
    vi.useFakeTimers();
    page = Object.assign(new EventTarget(), { setTimeout: (fn: () => void, ms?: number) => setTimeout(fn, ms) });
    vi.stubGlobal('window', page);
    vi.resetModules();
    quiet = await import('./quiet');
    quiet.pageBusy();
    vi.advanceTimersByTime(quiet.QUIET_AFTER_MS + 10);
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('counts the page as busy while a finger is down and just after a scroll', () => {
    expect(quiet.pageBusy()).toBe(false);
    fire('scroll');
    expect(quiet.pageBusy()).toBe(true);
    vi.advanceTimersByTime(quiet.QUIET_AFTER_MS + 10);
    expect(quiet.pageBusy()).toBe(false);
    fire('touchstart');
    vi.advanceTimersByTime(5000);
    expect(quiet.pageBusy()).toBe(true);
    fire('touchend');
    expect(quiet.pageBusy()).toBe(true);
    vi.advanceTimersByTime(quiet.QUIET_AFTER_MS + 10);
    expect(quiet.pageBusy()).toBe(false);
  });

  it('does not run while the page is being moved, and runs once it is let go', () => {
    const fn = vi.fn();
    fire('touchstart');
    quiet.whenQuiet(fn, 5000);
    vi.advanceTimersByTime(1500);
    expect(fn).not.toHaveBeenCalled();
    fire('touchend');
    vi.advanceTimersByTime(quiet.QUIET_AFTER_MS + 200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs anyway once its patience is used up, so needed drawing is never starved', () => {
    const fn = vi.fn();
    fire('touchstart');
    quiet.whenQuiet(fn, 600);
    vi.advanceTimersByTime(500);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs at once when nothing is happening', () => {
    const fn = vi.fn();
    quiet.whenQuiet(fn);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
