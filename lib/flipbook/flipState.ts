/**
 * Which pages of a flip book are turned, and how far each one is through its turn.
 *
 * `current` is the page showing on the right, which equals the number of
 * leaves already turned to the left. Each leaf carries a turn progress `t`
 * (0 = resting on the right, 1 = resting on the left) driven by a damped
 * spring, so a turn can be interrupted or reversed at any moment.
 *
 * One rule always holds: t[0] >= t[1] >= ... A leaf can never pass through the
 * leaf stacked next to it.
 */

export interface FlipState {
  count: number;
  current: number;
  t: Float32Array;
  vel: Float32Array;
  drag: { leaf: number; t: number } | null;
  /** Reduced motion: pages change instantly. */
  reduced: boolean;
}

const OMEGA = 9.2;
const ZETA = 0.86;
const RIFFLE_BOOST = 1.7;
/** A leaf waits until its neighbour has moved this far before it follows. */
const STAGGER = 0.18;
const FLICK = 1.2;
const MAX_STEP = 1 / 90;

export function createFlipState(count: number): FlipState {
  return { count, current: 0, t: new Float32Array(count), vel: new Float32Array(count), drag: null, reduced: false };
}

const targetOf = (s: FlipState, leaf: number): number => (leaf < s.current ? 1 : 0);

export function setCurrent(s: FlipState, next: number): void {
  s.drag = null;
  s.current = Math.min(s.count - 1, Math.max(0, Math.round(next)));
}

export function isSettled(s: FlipState): boolean {
  if (s.drag) return false;
  for (let i = 0; i < s.count; i += 1) {
    if (s.t[i] !== targetOf(s, i)) return false;
  }
  return true;
}

/** Keep the stack ordered: a returning leaf waits for the one above it, a turning leaf for the one ahead. */
function keepOrdered(s: FlipState): void {
  for (let i = s.count - 1; i >= 1; i -= 1) {
    if (s.t[i] > s.t[i - 1] && targetOf(s, i - 1) === 0 && s.drag?.leaf !== i - 1) {
      s.t[i - 1] = s.t[i];
      s.vel[i - 1] = 0;
    }
  }
  for (let i = 1; i < s.count; i += 1) {
    if (s.t[i] > s.t[i - 1]) {
      s.t[i] = s.t[i - 1];
      s.vel[i] = 0;
    }
  }
}

function substep(s: FlipState, dt: number): void {
  let pending = 0;
  for (let i = 0; i < s.count; i += 1) if (Math.abs(targetOf(s, i) - s.t[i]) > 1e-3) pending += 1;
  const omega = pending >= 3 ? OMEGA * RIFFLE_BOOST : OMEGA;

  for (let n = 0; n < s.count; n += 1) {
    // Leaves turning forward are advanced first to last, leaves returning last to first.
    const forward = n < s.current;
    const i = forward ? n : s.count - 1 - (n - s.current);
    if (s.drag?.leaf === i) {
      s.t[i] = s.drag.t;
      s.vel[i] = 0;
      continue;
    }
    const target = targetOf(s, i);
    const held = target === 1
      ? i > 0 && s.t[i - 1] < STAGGER
      : i < s.count - 1 && s.t[i + 1] > 1 - STAGGER;
    if (held && Math.abs(target - s.t[i]) > 1e-3) {
      s.vel[i] *= Math.max(0, 1 - 12 * dt);
      continue;
    }
    const acc = omega * omega * (target - s.t[i]) - 2 * ZETA * omega * s.vel[i];
    s.vel[i] += acc * dt;
    let next = s.t[i] + s.vel[i] * dt;
    if (next <= 0) { next = 0; if (s.vel[i] < 0) s.vel[i] = 0; }
    if (next >= 1) { next = 1; if (s.vel[i] > 0) s.vel[i] = 0; }
    s.t[i] = next;
  }
  keepOrdered(s);
}

/** Advance the book by `dt` seconds. Returns true while anything is still moving. */
export function stepFlip(s: FlipState, dt: number): boolean {
  if (s.reduced) {
    for (let i = 0; i < s.count; i += 1) {
      s.t[i] = s.drag?.leaf === i ? s.drag.t : targetOf(s, i);
      s.vel[i] = 0;
    }
    return s.drag !== null;
  }
  let remaining = Math.min(Math.max(dt, 0), 0.5);
  while (remaining > 1e-6) {
    const h = Math.min(MAX_STEP, remaining);
    substep(s, h);
    remaining -= h;
  }
  // a leaf that has all but arrived is set down exactly; the stack is then put
  // back in order, because one leaf can arrive a moment before its neighbour
  for (let i = 0; i < s.count; i += 1) {
    if (s.drag?.leaf === i) continue;
    const target = targetOf(s, i);
    if (Math.abs(target - s.t[i]) < 5e-4 && Math.abs(s.vel[i]) < 5e-3) {
      s.t[i] = target;
      s.vel[i] = 0;
    }
  }
  keepOrdered(s);
  return !isSettled(s);
}

/** Take hold of a page. dir 1 grabs the page on the right, dir -1 the last page turned. */
export function beginDrag(s: FlipState, dir: 1 | -1): boolean {
  const leaf = dir === 1 ? s.current : s.current - 1;
  if (leaf < 0 || leaf >= s.count - 1) return false;
  s.drag = { leaf, t: s.t[leaf] };
  s.vel[leaf] = 0;
  return true;
}

export function updateDrag(s: FlipState, t: number): void {
  if (!s.drag) return;
  s.drag.t = Math.min(1, Math.max(0, t));
}

/** Let go. `velocity` is in turns per second, positive toward the left. */
export function endDrag(s: FlipState, velocity: number): void {
  if (!s.drag) return;
  const { leaf, t } = s.drag;
  s.t[leaf] = t;
  const commit = velocity > FLICK || (t > 0.5 && velocity > -FLICK);
  s.current = commit ? leaf + 1 : leaf;
  s.vel[leaf] = Math.min(4, Math.max(-4, velocity));
  s.drag = null;
  keepOrdered(s);
}
