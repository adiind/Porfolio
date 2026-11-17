import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import data from './timelineData.json';
import { TINKER_THUMBS, matStops } from './timelineCards';
import {
  GAP, OPEN_REDUCED_S, OPEN_S, TAPE, cardPose, cardSize, holdLength, introDue, introEnd, layoutCards, matScroll, openingOrder,
  PEN_MAX_SPEED, PEN_PARK, PEN_START, penRows, penStep, penStop, penTarget, planFlights, pushedTops, rollRadius, rollY,
  scrollForStep, stepAt, stepOpen, stepOpenTo, wantOpen, type Hold, type PlacedCard,
} from './timelineScene';

const cards = () => layoutCards(matStops());

describe('the timeline data', () => {
  it('is TimelineSection.tsx\'s TL and LOOK, unchanged', () => {
    const source = readFileSync(new URL('../../components/mat/TimelineSection.tsx', import.meta.url), 'utf8');
    const grab = (marker: string): string => {
      const from = source.indexOf('{', source.indexOf('=', source.indexOf(marker)));
      let depth = 0; let i = from;
      for (; i < source.length; i += 1) { if (source[i] === '{') depth += 1; if (source[i] === '}') { depth -= 1; if (!depth) break; } }
      return source.slice(from, i + 1);
    };
    expect(JSON.parse(grab('const TL: TLData'))).toEqual(data.tl);
    // LOOK is written as an object literal with single quotes
    const look = new Function(`return (${grab('const LOOK')});`)() as unknown;
    expect(look).toEqual(data.look);
  });

  it('has the seven stops and Tinker Verse, newest first, without Bambu Lab, Portfolio V2 or the Jarvis competition', () => {
    const stops = matStops();
    expect(stops.map((s) => s.item.short)).toEqual(['Self', 'Northwestern', 'Zomato', 'Tinker Verse', 'Udaan', 'Schmooze', 'Snapdeal', 'BITS Pilani']);
    expect(stops.find((s) => s.id === 'zomato')!.item.works!.map((w) => w.r)).toContain('Lead Product Analyst');
    expect(stops.filter((s) => s.story).map((s) => s.story)).toEqual(['self', 'zomato', 'udaan', 'schmooze', 'snapdeal']);
  });

  it('gives Tinker Verse six prints of his own builds, each going to its page', () => {
    expect(TINKER_THUMBS.map((t) => [t.cap, t.href])).toEqual([
      ['Surya', '/book/surya'], ['Jarvis', 'https://github.com/adiind/diy-jarvis'], ['Helios', '/work/helios'], ['Muse', '/book/muse'], ['Zero', '/work/zero-my-ai'], ['Laser cut', '/book/surya'],
    ]);
    TINKER_THUMBS.forEach((t) => expect(() => readFileSync(new URL(`../../public${t.src}`, import.meta.url))).not.toThrow());
  });
});

describe('where the cards lie', () => {
  it('keeps Work left of the tape and School right of it, never under it', () => {
    const tapeL = TAPE.x - TAPE.w / 2; const tapeR = TAPE.x + TAPE.w / 2;
    cards().forEach((c) => {
      const outer = c.inner - c.dir * c.stop.openW;
      if (c.lane === 0) { expect(c.inner).toBe(tapeL - GAP); expect(outer).toBeGreaterThanOrEqual(0); }
      else { expect(c.inner).toBe(tapeR + GAP); expect(outer).toBeLessThanOrEqual(1440); }
    });
    expect(cards().filter((c) => c.lane === 0).map((c) => c.stop.item.short)).toEqual(['Self', 'Zomato', 'Udaan', 'Schmooze', 'Snapdeal']);
    expect(cards().filter((c) => c.lane === 1).map((c) => c.stop.item.short)).toEqual(['Northwestern', 'Tinker Verse', 'BITS Pilani']);
  });

  it('lets Tinker Verse fill the School lane between Northwestern and BITS Pilani', () => {
    const school = cards().filter((c) => c.lane === 1);
    const [nw, tv, bits] = school;
    expect(tv.top).toBe(nw.top + nw.stop.restH + 10);
    expect(tv.top + tv.stop.restH).toBe(bits.top - 10);
    expect(tv.stop.restH).toBe(tv.stop.openH);
    expect(tv.stop.restH).toBeGreaterThan(200);
  });

  it('pushes the cards under an open stop down, in its lane only, so nothing is covered and all stays in view', () => {
    const all = cards();
    openingOrder(all).forEach((opened) => {
      const sizes = new Map(all.map((c) => [c, cardSize(c.stop, c === opened ? 1 : 0)] as const));
      const tops = pushedTops(all, sizes);
      ([0, 1] as const).forEach((lane) => {
        const list = all.filter((c) => c.lane === lane).sort((a, b) => a.rank - b.rank);
        for (let i = 1; i < list.length; i += 1) expect(tops.get(list[i])!).toBeGreaterThanOrEqual(tops.get(list[i - 1])! + sizes.get(list[i - 1])!.h + 10);
        list.forEach((c) => {
          expect(tops.get(c)! + sizes.get(c)!.h).toBeLessThanOrEqual(900);
          if (c.lane !== opened.lane) expect(tops.get(c)).toBe(c.top);
        });
      });
      // Tinker Verse never changes size
      const tv = all.find((c) => c.stop.fill)!;
      expect(sizes.get(tv)!.h).toBe(tv.stop.restH);
    });
  });
});

describe('the intro', () => {
  it('lays the whole tape and puts every card down within 2 s', () => {
    const plan = planFlights(cards());
    const end = introEnd(plan);
    expect(end).toBeGreaterThan(1.5);
    expect(end).toBeLessThanOrEqual(2);
    expect(rollY(end)).toBeCloseTo(TAPE.bot - 4, 3);
    expect(rollRadius(rollY(0))).toBeGreaterThan(rollRadius(rollY(end)));
  });

  it('lands each card just after the roll has passed its year, the first of each lane dropping as it starts', () => {
    const all = cards(); const plan = planFlights(all);
    all.forEach((c) => {
      const f = plan.get(c)!;
      if (c.rank === 0) { expect(f.start).toBe(0); expect(f.prev).toBeNull(); return; }
      expect(f.prev!.lane).toBe(c.lane);
      expect(f.dur).toBeGreaterThanOrEqual(0.75);
      expect(f.dur).toBeLessThanOrEqual(0.8);
      expect(f.start).toBeGreaterThanOrEqual(plan.get(f.prev!)!.start);
    });
    // a cascade, not one at a time: moves overlap
    const starts = [...plan.values()].map((f) => f.start).sort((a, b) => a - b);
    expect(starts[starts.length - 1] - starts[0]).toBeLessThan(1.2);
  });

  it('never moves a card across the tape, and keeps a card coming out under the one it comes from', () => {
    const all = cards(); const plan = planFlights(all);
    const sizes = new Map(all.map((c) => [c, cardSize(c.stop, 0)] as const));
    const tops = pushedTops(all, sizes);
    const mid = (c: PlacedCard) => ({ x: c.inner - c.dir * sizes.get(c)!.w / 2, y: tops.get(c)! + sizes.get(c)!.h / 2, h: sizes.get(c)!.h });
    for (let T = 0; T <= 2; T += 1 / 60) {
      all.forEach((c) => {
        const f = plan.get(c)!;
        const pose = cardPose(c, f, T, mid(c), f.prev ? mid(f.prev) : null, false);
        const w = sizes.get(c)!.w;
        if (c.lane === 0) expect(pose.x + w / 2).toBeLessThanOrEqual(TAPE.x - TAPE.w / 2);
        else expect(pose.x - w / 2).toBeGreaterThanOrEqual(TAPE.x + TAPE.w / 2);
        if (f.prev && pose.alpha > 0 && pose.y - c.stop.restH / 2 < mid(f.prev).y + mid(f.prev).h / 2 - 0.5) expect(pose.under).toBe(true);
      });
    }
  });

  it('with reduced motion, simply lies at rest', () => {
    const all = cards(); const plan = planFlights(all);
    all.forEach((c) => {
      const pose = cardPose(c, plan.get(c)!, 0, { x: 1, y: 2, h: 3 }, { x: 4, y: 5, h: 6 }, true);
      expect(pose).toMatchObject({ x: 1, y: 2, lift: 0, drop: 0, alpha: 1, flying: false });
    });
  });
});

describe('scrolling', () => {
  const hold: Hold = { start: 900, view: 900, steps: 7 };

  it('holds the mat still while each stop opens, then carries on', () => {
    expect(matScroll(500, hold)).toBe(500);
    expect(matScroll(900, hold)).toBe(900);
    expect(matScroll(900 + holdLength(hold) / 2, hold)).toBe(900);
    expect(matScroll(900 + holdLength(hold) + 120, hold)).toBe(1020);
    expect(matScroll(1234, null)).toBe(1234);
  });

  it('opens nothing before the first step, then the stops newest first, one per step', () => {
    expect(stepAt(800, hold)).toBe(-1);
    expect(stepAt(900, hold)).toBe(-1);
    for (let i = 0; i < 7; i += 1) expect(stepAt(scrollForStep(i, hold), hold)).toBe(i);
    expect(stepAt(900 + holdLength(hold) - 1, hold)).toBe(6);
    // past the last step, on towards Work, the last stop closes again
    expect(stepAt(900 + holdLength(hold) + 1, hold)).toBe(-1);
    expect(openingOrder(cards()).map((c) => c.stop.item.short)).toEqual(['Self', 'Northwestern', 'Zomato', 'Udaan', 'Schmooze', 'Snapdeal', 'BITS Pilani']);
  });

  it('plays the intro once 60% of the timeline is in view', () => {
    expect(introDue(900 - 0.41 * 900, hold)).toBe(false);
    expect(introDue(900 - 0.4 * 900, hold)).toBe(true);
  });

  it('opens a stop in 0.55 s and closes the one before in the same time (a 0.15 s fade with reduced motion)', () => {
    const run = (reduced: boolean) => {
      const open = [1, 0, 0]; let t = 0;
      while (stepOpen(open, 1, 1 / 120, reduced)) t += 1 / 120;
      return { t: t + 1 / 120, open };
    };
    const full = run(false); expect(full.t).toBeCloseTo(OPEN_S, 1); expect(full.open).toEqual([0, 1, 0]);
    expect(run(true).t).toBeCloseTo(OPEN_REDUCED_S, 1);
  });
});

describe('the pen', () => {
  const hold: Hold = { start: 900, view: 900, steps: 7 };
  const steps = () => openingOrder(cards());

  it('stops at each stop\'s year, always further down, never past its parking place', () => {
    const rows = penRows(steps());
    expect(rows).toHaveLength(7);
    expect(rows[0]).toBeGreaterThan(PEN_START);
    rows.forEach((r, i) => { if (i) expect(r).toBeGreaterThanOrEqual(rows[i - 1] + 14); expect(r).toBeLessThanOrEqual(PEN_PARK); });
  });

  it('waits at the top before the first step and reaches each stop\'s row while that step is in view', () => {
    const rows = penRows(steps());
    expect(penTarget(hold.start - 200, hold, rows)).toBe(PEN_START);
    for (let i = 0; i < 7; i += 1) expect(penTarget(scrollForStep(i, hold), hold, rows)).toBeCloseTo(rows[i], 3);
    expect(penTarget(hold.start + holdLength(hold) + 500, hold, rows)).toBe(rows[6]);
    // a one-way scroll never asks it to roll back
    let last = -Infinity;
    for (let y = hold.start - 100; y < hold.start + holdLength(hold) + 100; y += 7) {
      const t = penTarget(y, hold, rows); expect(t).toBeGreaterThanOrEqual(last - 1e-9); last = t;
    }
  });

  it('rolls without overshooting, under its top speed, and settles within 2 s of the longest jump', () => {
    const pen = { y: PEN_START, v: 0 }; const target = PEN_PARK; let t = 0; let peak = 0;
    while (penStep(pen, target, 1 / 60, false)) {
      t += 1 / 60; peak = Math.max(peak, Math.abs(pen.v));
      expect(pen.y).toBeLessThanOrEqual(target);
      if (t > 5) break;
    }
    expect(pen.y).toBe(target);
    expect(peak).toBeLessThanOrEqual(PEN_MAX_SPEED);
    expect(t).toBeLessThan(2);
    // reduced motion: it is simply there
    const still = { y: PEN_START, v: 0 }; penStep(still, 400, 1 / 60, true); expect(still.y).toBe(400);
  });

  it('opens the stop whose row it has reached', () => {
    const rows = [200, 300, 400];
    expect(penStop(PEN_START, rows)).toBe(-1);
    expect(penStop(199.6, rows)).toBe(0);
    expect(penStop(350, rows)).toBe(1);
    expect(penStop(900, rows)).toBe(2);
  });

  it('keeps one open stop per lane: a pointed-at stop in the pen\'s lane folds the pen\'s stop', () => {
    const lane = (i: number): 0 | 1 => (i % 2 ? 1 : 0);
    expect(wantOpen(4, 0, -1, lane)).toEqual([1, 0, 0, 0]);
    expect(wantOpen(4, 0, 1, lane)).toEqual([1, 1, 0, 0]);
    expect(wantOpen(4, 0, 2, lane)).toEqual([0, 0, 1, 0]);
    expect(wantOpen(4, -1, 3, lane)).toEqual([0, 0, 0, 1]);
  });

  it('opens and folds toward what is wanted in OPEN_S', () => {
    const open = [1, 0, 0]; let t = 0;
    while (stepOpenTo(open, [0, 1, 1], 1 / 120, false)) t += 1 / 120;
    expect(open).toEqual([0, 1, 1]);
    expect(t + 1 / 120).toBeCloseTo(OPEN_S, 1);
  });
});

describe('a stop that is open', () => {
  it('holds still: its open amount does not shrink and grow again while nothing changes', () => {
    // (a slow frame, as on a tablet: the slower the frame, the further it used to step back)
    for (const dt of [1 / 120, 1 / 60, 1 / 30, 0.05]) {
      const open = [0, 1, 0];
      expect(stepOpenTo(open, [0, 1, 0], dt, false)).toBe(false);
      expect(open).toEqual([0, 1, 0]);
      const old = [0, 1, 0];
      expect(stepOpen(old, 1, dt, false)).toBe(false);
      expect(old).toEqual([0, 1, 0]);
    }
  });

  it('still opens and closes all the way, without overshooting', () => {
    const open = [1, 0];
    let frames = 0;
    while (stepOpenTo(open, [0, 1], 1 / 30, false) && frames < 200) { frames += 1; expect(open[0]).toBeGreaterThanOrEqual(0); expect(open[1]).toBeLessThanOrEqual(1); }
    expect(open).toEqual([0, 1]);
  });
});
