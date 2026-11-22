/**
 * The clock of the presentations stack opening: clip off, decks dealt out. Under 2 seconds; the parts overlap so nothing
 * waits for the thing before it to stop.
 */
export const END = 1.85;
/** Closing plays the same clock backwards, this many times faster. */
export const CLOSE_SPEED = 4;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const between = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** Starts gently, ends gently. */
export const flow = (k: number) => { k = clamp01(k); return k * k * (3 - 2 * k); };
/** Starts quickly, settles gently: something let go that comes to rest. */
export const glide = (k: number) => 1 - (1 - clamp01(k)) ** 3;
