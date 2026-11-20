/**
 * Quiet moments. Drawing done in the background (a book's inside pages, the things inside the Zomato bag, the
 * timeline's cards) holds the page for a moment each time. While a finger or the wheel is moving the page, that hold
 * is a visible stutter, so such work waits until the visitor has let go.
 *
 * "Wait until the browser is idle" (requestIdleCallback) is not enough: Safari does not have it, and where it exists
 * it does not count a scroll as being busy.
 */

let lastTouched = 0;
let fingerDown = false;
let listening = false;

function listen(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  const moved = () => { lastTouched = performance.now(); };
  const o = { passive: true, capture: true } as const;
  for (const name of ['scroll', 'wheel', 'touchmove', 'pointerdown', 'keydown'] as const) window.addEventListener(name, moved, o);
  window.addEventListener('touchstart', () => { fingerDown = true; moved(); }, o);
  for (const name of ['touchend', 'touchcancel'] as const) window.addEventListener(name, () => { fingerDown = false; moved(); }, o);
}

/** How long after the last scroll, touch or key the page counts as let go (a flick's glide keeps sending scrolls). */
export const QUIET_AFTER_MS = 220;

/** The visitor is moving the page right now (or did a moment ago). */
export function pageBusy(now: number = performance.now()): boolean {
  listen();
  return fingerDown || now - lastTouched < QUIET_AFTER_MS;
}

/** The page has been left alone for at least this long (milliseconds): no finger down, no scroll, wheel or key since. */
export function stillFor(ms: number, now: number = performance.now()): boolean {
  listen();
  return !fingerDown && now - lastTouched >= ms;
}

/**
 * Runs `fn` once the page has been left alone for `ms` (milliseconds), however long that takes: for work nobody sees
 * until they click (the click then does it there and then), which must never be forced through under a moving page.
 */
export function whenStill(fn: () => void, ms: number): void {
  listen();
  const look = () => {
    if (!stillFor(ms)) { window.setTimeout(look, 150); return; }
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => (stillFor(ms) ? fn() : look()), { timeout: 120 }); else window.setTimeout(fn, 16);
  };
  look();
}

/** For tests: as if the page had just been touched, or never. */
export function setTouchedForTest(at: number, down = false): void { listening = true; lastTouched = at; fingerDown = down; }

/**
 * Runs `fn` at the next quiet moment. `patience` (milliseconds, asked again at every look) is the longest it may be
 * kept waiting by a visitor who never lets go: after that it runs anyway, because what it draws is needed.
 */
export function whenQuiet(fn: () => void, patience: number | (() => number) = 5000): void {
  listen();
  const asked = performance.now();
  const look = () => {
    const now = performance.now();
    const limit = typeof patience === 'function' ? patience() : patience;
    if (pageBusy(now) && now - asked < limit) { window.setTimeout(look, 90); return; }
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => fn(), { timeout: 120 }); else window.setTimeout(fn, 16);
  };
  look();
}
