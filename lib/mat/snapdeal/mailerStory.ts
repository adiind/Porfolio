/**
 * The clock of the Snapdeal bag's opening: what each part is doing at a moment, as numbers from 0 to 1. Pure maths, so
 * it can be tested without a screen. The tear and the unpacking take under two seconds; then, as things land, each one
 * opens (Adi, 2026-11-20: "everything feels like it's gonna open up, but nothing opens up"), 2.5 s in all. The parts
 * overlap so nothing waits for the thing before it to stop.
 */
export const END = 2.25;
/** Closing plays the same clock backwards, this many times faster. */
export const CLOSE_SPEED = 4;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const between = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** Starts gently, ends gently. */
export const flow = (k: number) => { k = clamp01(k); return k * k * (3 - 2 * k); };
/** Starts quickly, settles gently: something let go that comes to rest. */
export const glide = (k: number) => 1 - (1 - clamp01(k)) ** 3;
/** Starts slowly and gathers speed, as a tear does once it has begun, then eases off at the end of the seam. */
export const rip = (k: number) => { k = clamp01(k); return flow(k ** 1.35); };

export interface StoryState {
  /** how far the tear has run down the side: 0 not begun, 1 the strip is off */
  rip: number;
  /** the torn strip, rolled up: 0 still at the foot of the tear, 1 at rest beside the bag */
  free: number;
  /** the mouth: 0 shut, 1 open */
  gape: number;
  /** the invoice: 0 inside the bag, 1 lying on the mat */
  out: number;
  /** the T-shirt, the earphones box and the shoebox, the same way, each a beat behind the one before */
  items: [number, number, number];
  /** once down, each opens: the shirt's hem unfolds then its sides; the earbuds box's lid comes off; then the shoebox's */
  hem: number; sides: number; phonesLid: number; shoeLid: number;
}

export function stateAt(t: number): StoryState {
  return {
    rip: rip(between(t, 0.1, 0.9)),
    free: flow(between(t, 0.84, 1.36)),
    gape: flow(between(t, 0.66, 1.15)),
    out: glide(between(t, 0.94, 1.52)),
    items: [glide(between(t, 1.02, 1.64)), glide(between(t, 1.12, 1.77)), glide(between(t, 1.22, 1.9))],
    hem: flow(between(t, 1.5, 1.92)), sides: flow(between(t, 1.74, 2.22)),
    phonesLid: flow(between(t, 1.68, 2.2)), shoeLid: flow(between(t, 1.88, END)),
  };
}
