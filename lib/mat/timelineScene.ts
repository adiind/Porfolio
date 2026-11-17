/**
 * The timeline on the mat ("Everything, in order."), as Adi picked it on 2026-11-16 (prototype G:
 * review/home-mat-tape/?c=7, "Rolled, then multiplied", round 2).
 *
 * Everything here is plain numbers, so it can be tested without WebGL: where every card lies (in "mat pixels", a
 * 1440 by 900 drawing of one window of the mat, the same units the home stage's posters are measured in), how the
 * intro plays in time, how a scroll step opens a stop, and how the page's scroll maps onto the mat while the
 * timeline holds still.
 *
 * The intro plays by itself once the timeline is in view: a roll of cream masking tape rolls down the year line in
 * 1.6 s, laying the tape and its printed years behind it; the newest card of each lane drops onto the top of its lane
 * as the roll starts, and every later card peels out from under the one above it and hops down to its year with the
 * Food Rescue card's small bounce (engine.ts, a set of cards dealt from a poster). Everything is down by 1.7 s.
 * Then each scroll step opens the next stop (newest first) in 0.55 s and closes the one before; a stop that opens
 * pushes the cards under it in its own lane down, never over anything. Work stays left of the tape, School right.
 */
import type { MatStop } from './timelineCards';

/* ---------- where things lie (mat pixels) ---------- */

/** The tape down the middle: its middle line, width, and its two torn ends. */
export const TAPE = { x: 720, w: 44, top: 138, bot: 858 } as const;
/** The part of the tape the years are printed along. */
export const RULE = { top: 170, bot: 850 } as const;
/** The roll: its full radius, its cardboard core, its width across (one tape width), how far its ends stand out. */
export const ROLL = { r0: 44, rc: 17, w: TAPE.w + 1, tele: 10 } as const;
/** Gap between a card's inner edge and the tape. */
export const GAP = 18;
/** The highest a card may lie, and the lowest an open card may reach. */
const FIRST_TOP = 184;
const LOWEST = 852;

export const T_ALL = Date.UTC(2016, 5, 1);
export const T_END = Date.UTC(2027, 6, 1);
/** How far down the year line a date lies. */
export const yOf = (ms: number): number => RULE.top + ((T_END - ms) / (T_END - T_ALL)) * (RULE.bot - RULE.top);

export interface PlacedCard {
  stop: MatStop;
  /** 0 Work (left of the tape), 1 School (right). */
  lane: 0 | 1;
  /** +1: the card lies left of the tape and its inner edge is its right edge; -1: right of the tape. */
  dir: 1 | -1;
  /** Its resting top edge, and the edge that faces the tape. */
  top: number;
  inner: number;
  /** Its order down its lane (0 = the newest, at the top). */
  rank: number;
}

/**
 * Lays the stops out: each lane newest first, each card as near the middle of its dates as the card above it allows,
 * always leaving room for it to open at the bottom of the view. Tinker Verse (already open, `fill`) takes the whole
 * lane between the card above it and the card below it.
 */
export function layoutCards(stops: MatStop[]): PlacedCard[] {
  const out: PlacedCard[] = [];
  ([0, 1] as const).forEach((lane) => {
    const list = stops.filter((s) => s.lane === lane);
    const dir = lane === 0 ? 1 : -1;
    const inner = lane === 0 ? TAPE.x - TAPE.w / 2 - GAP : TAPE.x + TAPE.w / 2 + GAP;
    let next = FIRST_TOP;
    let filling: { stop: MatStop; top: number } | null = null;
    const placed: PlacedCard[] = [];
    list.forEach((stop) => {
      if (stop.fill) { filling = { stop, top: next }; return; }
      const end = stop.end === 'Present' ? stop.today : Date.parse(stop.end);
      const ideal = yOf((Date.parse(stop.start) + end) / 2) - stop.restH / 2;
      let top = Math.max(next, ideal);
      top = Math.min(top, LOWEST - stop.openH);
      if (filling) {
        const f: { stop: MatStop; top: number } = filling;
        f.stop.restH = f.stop.openH = Math.max(120, top - 10 - f.top);
        placed.push({ stop: f.stop, lane, dir, top: f.top, inner, rank: 0 });
        filling = null;
      }
      next = top + stop.restH + 10;
      placed.push({ stop, lane, dir, top, inner, rank: 0 });
    });
    placed.forEach((card, rank) => { card.rank = rank; });
    out.push(...placed);
  });
  return out;
}

/** The cards that open on scroll, in the order the steps reach them: newest first (Tinker Verse is already open). */
export function openingOrder(cards: PlacedCard[]): PlacedCard[] {
  return cards.filter((c) => !c.stop.fill).sort((a, b) => Date.parse(b.stop.start) - Date.parse(a.stop.start));
}

/* ---------- the intro, in seconds ---------- */

export const INTRO = {
  /** the roll starts this long after the timeline comes into view */
  t0: 0.1,
  /** and takes this long down the whole year line (ease-in-out) */
  roll: 1.6,
  /** the first card of each lane drops in this long; the rest hop down in `hop` */
  drop: 0.7,
  hop: 0.78,
  /** a card is seen to arrive this far into its move, just after the roll has passed its year */
  seen: 0.45,
  /** a card never leaves sooner than this after the one before it in its lane */
  stagger: 0.06,
} as const;

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
export const outCubic = (v: number): number => 1 - (1 - clamp01(v)) ** 3;
export const inOutCubic = (v: number): number => { const x = clamp01(v); return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2; };
export const smooth = (v: number): number => { const c = clamp01(v); return c * c * (3 - 2 * c); };

/** Where the roll's middle is at time T: from the top of the tape down to its foot. */
export const rollTop = (): number => TAPE.top + ROLL.r0 + 6;
export function rollY(T: number): number {
  return rollTop() + (TAPE.bot - 4 - rollTop()) * inOutCubic((T - INTRO.t0) / INTRO.roll);
}
/** The roll's radius once it has laid this much tape (it gets thinner as it goes). */
export function rollRadius(y: number): number {
  const laid = clamp01((y - rollTop()) / (TAPE.bot - rollTop()));
  return Math.sqrt(ROLL.rc ** 2 + (1 - laid) * (ROLL.r0 ** 2 - ROLL.rc ** 2));
}
/** When the roll's middle passes a row of the mat. */
export function passTime(y: number): number {
  let lo: number = INTRO.t0; let hi: number = INTRO.t0 + INTRO.roll;
  for (let i = 0; i < 32; i += 1) { const m = (lo + hi) / 2; if (rollY(m) < y) lo = m; else hi = m; }
  return hi;
}

export interface Flight { start: number; dur: number; prev: PlacedCard | null }

/** When each card leaves and how long its move takes. */
export function planFlights(cards: PlacedCard[]): Map<PlacedCard, Flight> {
  const plan = new Map<PlacedCard, Flight>();
  ([0, 1] as const).forEach((lane) => {
    const list = cards.filter((c) => c.lane === lane).sort((a, b) => a.rank - b.rank);
    let prevStart = -1;
    list.forEach((card, i) => {
      const dur = i === 0 ? INTRO.drop : INTRO.hop;
      let start = i === 0 ? 0 : Math.max(0, passTime(card.top + card.stop.restH + ROLL.r0 * 0.3) + 0.08 - INTRO.seen * dur);
      if (i > 0) start = Math.max(start, prevStart + INTRO.stagger);
      prevStart = start;
      plan.set(card, { start, dur, prev: i > 0 ? list[i - 1] : null });
    });
  });
  return plan;
}

/** When everything is down and the roll has stopped. */
export function introEnd(plan: Map<PlacedCard, Flight>): number {
  let end = INTRO.t0 + INTRO.roll;
  plan.forEach((f) => { end = Math.max(end, f.start + f.dur); });
  return end;
}

/* ---------- opening a stop on scroll ---------- */

/** How long a stop takes to open or close; with reduced motion it is a quick fade. */
export const OPEN_S = 0.55;
export const OPEN_REDUCED_S = 0.15;

/** Moves every stop's open amount one frame towards the step the page is at (only `current` is open). */
export function stepOpen(open: number[], current: number, dt: number, reduced: boolean): boolean {
  const rate = dt / (reduced ? OPEN_REDUCED_S : OPEN_S);
  let moving = false;
  for (let j = 0; j < open.length; j += 1) {
    const want = j === current ? 1 : 0;
    const was = open[j];
    open[j] = want > was ? Math.min(1, was + rate) : Math.max(0, was - rate);
    if (open[j] !== want) moving = true;
  }
  return moving;
}

/** Each card's size at an open amount (the face grows with an ease, the same one the prototype used). */
export function cardSize(stop: MatStop, open: number): { w: number; h: number } {
  const e = smooth(open);
  return { w: stop.restW + (stop.openW - stop.restW) * e, h: stop.restH + (stop.openH - stop.restH) * e };
}

/**
 * Where each card's top edge is now: a stop that opens pushes the cards under it in its own lane down (it grows in
 * place, so nothing is ever covered), and they come back up as it closes.
 */
export function pushedTops(cards: PlacedCard[], sizes: Map<PlacedCard, { w: number; h: number }>): Map<PlacedCard, number> {
  const tops = new Map<PlacedCard, number>();
  ([0, 1] as const).forEach((lane) => {
    let bottom = -Infinity;
    cards.filter((c) => c.lane === lane).sort((a, b) => a.rank - b.rank).forEach((card) => {
      const top = Math.max(card.top, bottom + 10);
      tops.set(card, top);
      bottom = top + sizes.get(card)!.h;
    });
  });
  return tops;
}

/* ---------- a card's pose at time T ---------- */

/** engine.ts, the cards of a set coming out of the one that was picked: their hop, with its small bounce as they land. */
export const childArc = (k: number): number => Math.sin(Math.PI * Math.min(1, k * 1.25)) * 0.8 + (k > 0.8 ? Math.sin(Math.PI * (k - 0.8) * 5) * 0.14 : 0);

export interface CardPose {
  /** the card's middle, mat pixels */
  x: number; y: number;
  /** height off the mat, in table units per unit of `lift` (the engine's posters: lift * 0.035), and how far it dropped */
  lift: number; drop: number;
  /** shown, 0 to 1 */
  alpha: number;
  /** drawn under every card already down (still coming out from under the one before it) */
  under: boolean;
  /** still moving */
  flying: boolean;
}

/**
 * A card's pose at intro time T. `place` is where it lies now (its middle), `from` where the card above it in its lane
 * lies (its middle) and that card's height. With reduced motion everything simply lies at rest.
 */
export function cardPose(
  card: PlacedCard, flight: Flight, T: number, place: { x: number; y: number; h: number },
  from: { x: number; y: number; h: number } | null, reduced: boolean,
): CardPose {
  if (reduced) return { x: place.x, y: place.y, lift: 0, drop: 0, alpha: 1, under: false, flying: false };
  const k = clamp01((T - flight.start) / flight.dur);
  if (!flight.prev || !from) {
    // the first card of a lane: drops onto the mat (the posters' landing as the light comes up: from 0.3 above, ease-out)
    // with the little bounce as it lands
    const landed = outCubic(k);
    const bounce = k > 0.8 ? Math.sin(Math.PI * (k - 0.8) * 5) * 0.14 : 0;
    return { x: place.x, y: place.y, lift: bounce * 2.2, drop: 1 - landed, alpha: landed, under: false, flying: k > 0 && k < 1 };
  }
  // a later card: out from under the one above it (squared to its top edge), down to its own year
  const e = outCubic(k);
  const fx = from.x; const fy = from.y - from.h / 2 + place.h / 2;
  const x = fx + (place.x - fx) * e;
  const y = fy + (place.y - fy) * e;
  const myTop = y - place.h / 2;
  const prevBottom = from.y + from.h / 2;
  return { x, y, lift: childArc(k) * 2.2, drop: 0, alpha: Math.min(1, k * 4), under: k < 1 && myTop < prevBottom, flying: k > 0 && k < 1 };
}

/* ---------- the page's scroll, held still while the stops open ---------- */

export interface Hold {
  /** where on the page (CSS pixels) the timeline's window starts: the view holds still from here */
  start: number;
  /** the window's height; one scroll step is 0.45 of it */
  view: number;
  /** stops that open on scroll */
  steps: number;
}
export const stepPx = (hold: Hold): number => Math.round(hold.view * 0.45);
/** How long the page holds still: every step, and a little more so the last one can be read. */
export const holdLength = (hold: Hold): number => (hold.steps + 0.6) * stepPx(hold);
/** The scroll the mat sees: the page's own, minus the part spent holding still. */
export function matScroll(scrollY: number, hold: Hold | null): number {
  if (!hold) return scrollY;
  if (scrollY <= hold.start) return scrollY;
  return hold.start + Math.max(0, scrollY - hold.start - holdLength(hold));
}
/**
 * Which stop is open at this scroll: -1 none. Nothing is open before the first step, and nothing once the page has
 * carried on past the last one towards Work (the last stop closes again as it leaves).
 */
export function stepAt(scrollY: number, hold: Hold): number {
  const into = (scrollY - hold.start) / stepPx(hold);
  if (into < 0.3 || scrollY > hold.start + holdLength(hold)) return -1;
  return Math.min(hold.steps - 1, Math.floor(into - 0.3));
}
/** Where the page goes to show one stop open (keyboard focus, a link back to it). */
export function scrollForStep(step: number, hold: Hold): number {
  return hold.start + (step < 0 ? 0 : (step + 0.8) * stepPx(hold));
}
/** The intro plays once this much of the timeline's window is in view. */
export const INTRO_IN_VIEW = 0.6;
export function introDue(scrollY: number, hold: Hold): boolean {
  return scrollY >= hold.start - (1 - INTRO_IN_VIEW) * hold.view;
}
