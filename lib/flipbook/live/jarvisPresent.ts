/**
 * "Present": someone is there, so it wakes.
 *
 * A hallway at night. The play runs once, in two seconds, and then the page holds. A man is already
 * stepping in from the doorway at the left; as he comes near the small box on the wall its four lights
 * come on, the room brightens and the letters of PRESENT light one after another like a roll call, each
 * hopping as it lights. He reaches the box, looks up, and waves; he keeps waving. Rings leave the box's
 * dome the whole time and a moth circles it: it is always watching.
 *
 * Times (seconds after the page lands): dark hall 0 to 0.25; he is in range at 0.45; the roll call runs
 * 0.45 to about 0.85 (0.06 apart); he stops under the box at 1.0, looks; waves from 1.25; settled by 1.9.
 *
 * The reader's pointer is a person too. While it is on the page nothing changes (the page is lit). When it
 * LEAVES the page the hall goes dark, the letters going out last first, 0.05 s apart; when it comes back
 * the roll call plays again (under 1 s). Touch, captures and reduced motion never enter, so they never see it dark.
 *
 * The man's part of the story is a pure function of story time (so stills, captures and reduced motion show
 * exactly the rest moment); only the pointer's part is kept as state.
 */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, springTo, type Rgb, type Spring } from './motion';
import { MAN_SHEET, drawBoxLights, drawMan, drawSensingRings, drawWallBox, walkPose, wallBox, type ManPose } from './jarvisProps';
import type { JarvisPictureCopy } from './jarvis/kit';
import { SENSOR } from './jarvisWire';
import { PRESENT_SPRITES } from './sprites/present';
import { STAGE_W, createStage, drawLetter, loopPage, makeLetters, restPose, stepLetters, tintSheet, wordSpan } from './stage';
import type { LiveInput, LivePage, LiveScene } from './types';

/** What data/flipbooks.ts shows for this page. */
export const COPY: JarvisPictureCopy = {
  kicker: 'Jarvis · the idea',
  title: 'It knows when someone is there.',
  body: 'Walk up and the lights answer. Walk away and it goes dark.',
  alt: 'The word Present as theatre-sign letters in a hallway at night, under a small black box on the wall. In about two seconds a man steps in from the doorway; as he nears the box its four lights come on, the hallway brightens and the letters light one after another, each hopping. He looks up and waves, and keeps waving. Rings pulse from the box and a moth circles it. If the reader moves the pointer off the page the hallway goes dark, and when the pointer comes back the letters light again.',
};

const DIR = '/images/flipbook/jarvis/present';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, people: MAN_SHEET };

/** The play runs once and is complete at this moment; the page then holds (the still is this moment too). */
const SETTLE = 2;
const WORD_W = 1900;
const FEET = 1000;
/** Where his feet are: on the rug, in front of the letters. */
const FLOOR = 1100;
/** How tall he stands, head to feet, in page units (the two strides are the measure). */
const MAN_H = 260;

const UMBER: Rgb = [34, 17, 6];
/** How dark the room gets with nobody there: dark, but the hallway still reads. */
const NIGHT = 0.74;

/* ---------- the man's walk: where he is at every moment of the story ---------- */

/** He is already stepping in at 0, a fast walk, and stops under the box at 1.0 s. */
const WALK_IN = { from: 0, to: 1, x0: -80, x1: 860 };
const LOOK_UNTIL = 1.25;
/** He is near enough to be seen from here (reached at about 0.45 s). */
const RANGE_IN = 380;
const LETTER_GAP = 0.06;
const LED_GAP = 0.06;
/** The reader leaving puts the letters out last first, this far apart. */
const OUT_GAP = 0.05;

/** A steady pace that eases to a stop over the last 15% of the way. */
const arrive = (u: number): number => {
  const a = 0.85;
  const v = 1 / (a + (1 - a) / 2);
  return u <= a ? v * u : v * a + v * (u - a) - (v * (u - a) ** 2) / (2 * (1 - a));
};

const manX = (t: number): number => lerp(WALK_IN.x0, WALK_IN.x1, arrive(clamp((t - WALK_IN.from) / (WALK_IN.to - WALK_IN.from))));

/** The moment x(t) first reaches `x` (x grows with t). */
const crossing = (x: number, a: number, b: number): number => {
  let lo = a;
  let hi = b;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (manX(mid) < x) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
};
/** When he comes into range (about 0.45 s). */
export const T_IN = crossing(RANGE_IN, WALK_IN.from, WALK_IN.to);

/** Distance walked so far: the stride cycle follows it, so his feet do not slide. */
const walked = (t: number): number => manX(t) - WALK_IN.x0;
/** One pose every this many units walked (a pose per 0.17 s at the old, slower pace: his stride is unchanged). */
const STEP = 54;

const poseAt = (t: number): ManPose => {
  if (t >= LOOK_UNTIL) return 'wave';
  if (t >= WALK_IN.to) return 'look';
  return walkPose(walked(t), STEP);
};

/* ---------- what the story asks for at story time t, with no reader ---------- */

const storyAwake = (t: number): boolean => t >= T_IN;
const storyLetter = (t: number, i: number): boolean => t >= T_IN + LETTER_GAP * i;
const storyLed = (t: number, i: number): boolean => t >= T_IN + LED_GAP * i;

/**
 * A moth seen from above: two rounded wings on each side of a small body, all pale cream, beating about
 * three times a second (each side's width going between 0.35 and 1), on a slow, wobbly loop round (cx, cy).
 */
function drawMoth(ctx: CanvasRenderingContext2D, k: number, cx: number, cy: number, clock: number, alpha: number): void {
  const a = clock * 0.85;
  const x = cx + Math.cos(a) * 150 + Math.sin(a * 2.3 + 1.1) * 34 + Math.sin(clock * 3.1) * 6;
  const y = cy + Math.sin(a) * 92 + Math.sin(a * 1.7 + 0.4) * 26 + Math.cos(clock * 2.6) * 6;
  const flap = 0.35 + 0.65 * Math.abs(Math.sin(clock * Math.PI * 3));
  const size = 1.7;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x * k, y * k);
  ctx.rotate(0.22 * Math.sin(clock * 1.3) + 0.12 * Math.cos(a));
  ctx.scale(size * k, size * k);
  ctx.fillStyle = rgba([250, 240, 218]);
  [-1, 1].forEach((side) => {
    ctx.save();
    ctx.scale(side * flap, 1);
    // the forewing, larger and swept forward, and the hindwing under it
    ctx.beginPath(); ctx.ellipse(8.5, -2.5, 8.5, 6, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6.5, 4.5, 5.5, 4.6, 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
  ctx.fillStyle = rgba([236, 220, 192]);
  ctx.beginPath(); ctx.ellipse(0, 1, 2.1, 6.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function createPresent(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  if (!plate || !sheet || !peopleSheet) throw new Error('The Present page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = PRESENT_SPRITES.letters.sprites;
  const span = wordSpan(sprites);
  const wordScale = WORD_W / span.width;
  const letters = makeLetters(sprites, { scale: wordScale, left: (STAGE_W - WORD_W) / 2, feet: FEET });
  const count = letters.length;
  const under = stage.keep(tintSheet(sheet, '#3a1d0a'));
  const unlit = stage.keep(tintSheet(sheet, rgba(UMBER)));
  const bright = stage.keep(tintSheet(sheet, '#fff6e2'));
  const shade = stage.keep(tintSheet(peopleSheet, rgba(UMBER)));

  /* the box on the wall (jarvisProps.ts), centred in the wall above the letters */
  const wordTop = FEET - span.height * wordScale;
  const box = wallBox(1000, wordTop / 2, 210);

  /* what is lit, on springs; and the reader, who also counts as someone there */
  const lit: Spring[] = letters.map(() => ({ x: 0, v: 0 }));
  const leds: Spring[] = SENSOR.leds.map(() => ({ x: 0, v: 0 }));
  const room: Spring = { x: 0, v: 0 };
  const watch: Spring = { x: 0, v: 0 };
  const pop: Spring = { x: 0, v: 0 };
  const was: boolean[] = letters.map(() => false);
  let lastPose: ManPose | null = null;
  /**
   * The reader's part. `mode` is 'story' until the pointer has been on the page and then leaves; the hall
   * is then 'dark' (letters going out last first), and when the pointer comes back it is 'back' (the roll
   * call plays again). `on` holds each letter's state while the reader is in charge.
   */
  const reader = { here: false, was: false, mode: 'story' as 'story' | 'dark' | 'back', stamp: 0, on: letters.map(() => true) };
  let snapNext = true;

  const snap = (t: number): void => {
    letters.forEach((_, i) => { const on = storyLetter(t, i); lit[i].x = on ? 1 : 0; lit[i].v = 0; was[i] = on; });
    leds.forEach((spring, i) => { spring.x = storyLed(t, i) ? 1 : 0; spring.v = 0; });
    room.x = storyAwake(t) ? 1 : 0; room.v = 0;
    watch.x = storyAwake(t) ? 1 : 0; watch.v = 0;
    pop.x = 0; pop.v = 0;
    lastPose = poseAt(t);
  };

  /** The pointer's edges: leaving the page darkens the hall, coming back plays the roll call again. */
  const followReader = (clock: number, input: LiveInput): void => {
    const p = input.pointer;
    const here = input.onTop && p !== null && p.u >= 0 && p.u <= 1 && p.v >= 0 && p.v <= 1;
    if (reader.was && !here) { reader.mode = 'dark'; reader.stamp = clock; }
    else if (!reader.was && here && reader.mode === 'dark') { reader.mode = 'back'; reader.stamp = clock; }
    reader.was = here;
    reader.here = here;
    if (reader.mode === 'dark') letters.forEach((_, i) => { if (clock - reader.stamp >= OUT_GAP * (count - 1 - i)) reader.on[i] = false; });
    else if (reader.mode === 'back') letters.forEach((_, i) => { if (clock - reader.stamp >= LETTER_GAP * i) reader.on[i] = true; });
  };
  const letterOn = (t: number, i: number): boolean => (reader.mode === 'story' ? storyLetter(t, i) : reader.on[i]);
  const ledOn = (t: number, i: number, clock: number): boolean => (reader.mode === 'story' ? storyLed(t, i) : reader.mode === 'back' && clock - reader.stamp >= LED_GAP * i);
  const awake = (t: number): boolean => (reader.mode === 'story' ? storyAwake(t) : reader.mode === 'back');

  return loopPage(stage, {
    loop: SETTLE,
    rest: SETTLE,
    once: true,
    enter() {
      reader.here = false; reader.was = false; reader.mode = 'story'; reader.stamp = 0; reader.on.fill(true);
      snapNext = true;
    },
    step(t, clock, input) {
      stepLetters(letters, input);
      if (input.reduced || snapNext) {
        // a still moment, or the page has just landed: everything exactly as the story has it now
        snap(t);
        snapNext = false;
      } else {
        followReader(clock, input);
        const dt = input.dt;
        letters.forEach((letter, i) => {
          const on = letterOn(t, i);
          // each letter hops once as it lights, like a name being called
          if (on && !was[i] && dt > 0) letter.hop.v += 430;
          was[i] = on;
          springTo(lit[i], on ? 1 : 0, 16, 1, dt);
        });
        leds.forEach((spring, i) => springTo(spring, ledOn(t, i, clock) ? 1 : 0, 18, 1, dt));
        springTo(room, awake(t) ? 1 : 0, 7, 1, dt);
        springTo(watch, awake(t) ? 1 : 0, 10, 1, dt);
        const pose = poseAt(t);
        // a small squash when he stops, looks up, or starts to wave
        const still = (value: ManPose | null): boolean => value === 'look' || value === 'wave';
        if (pose && lastPose && pose !== lastPose && (still(pose) || still(lastPose)) && dt > 0) pop.v += 2.2;
        lastPose = pose;
        springTo(pop, 0, 17, 0.38, dt);
      }
      letters.forEach((letter) => restPose(letter, clock, 0.006));
    },
    draw(t, clock) {
      const light = clamp(room.x);
      const seen = clamp(watch.x);

      /* printed sheet: the hallway, the box on the wall, the night over both, then the box's lights and rings */
      stage.backdrop(plate, 0.72);
      drawWallBox(base, k, box);
      // night: flat and even over the whole sheet, lifting as the room lights
      const night = NIGHT * (1 - light);
      if (night > 0.003) {
        base.fillStyle = rgba(UMBER, night);
        base.fillRect(0, 0, width, height);
      }
      // above the night: the rings (always going), and the four lights, which come on before the room does
      drawSensingRings(base, k, box, clock, seen);
      drawBoxLights(base, k, box, leds.map((spring) => clamp(spring.x)));
      stage.tooth();

      /* floating sheet: the sign. Thickness first, then each letter, dark or lit */
      letters.forEach((letter) => drawLetter(word, under, letter, k, 10, 12));
      letters.forEach((letter, i) => {
        const on = clamp(lit[i].x);
        drawLetter(word, sheet, letter, k);
        if (on < 0.995) {
          word.globalAlpha = (1 - on) * 0.82;
          drawLetter(word, unlit, letter, k);
        }
        if (on > 0.01) {
          // a lit letter is never quite steady
          word.globalAlpha = on * (0.07 + 0.02 * Math.sin(clock * (4.3 + i * 0.61) + letter.phase * 3));
          drawLetter(word, bright, letter, k);
        }
        word.globalAlpha = 1;
      });

      /* in front: the man, and a moth round the box while the room is lit */
      const pose = poseAt(t);
      // standing, he is never quite still: he rocks a little as he looks up, more as he waves
      const rock = pose === 'wave' ? Math.sin(clock * 6) * 0.03 : pose === 'look' ? Math.sin(clock * 2.4) * 0.012 : 0;
      const at = { x: manX(t), y: FLOOR, height: MAN_H, squash: pop.x, angle: rock };
      drawMan(fg, peopleSheet, k, pose, at);
      const dim = 0.5 * (1 - light);
      if (dim > 0.01) drawMan(fg, shade, k, pose, { ...at, alpha: dim });
      const moth = smoothstep(0.35, 0.9, light);
      if (moth > 0.01) drawMoth(fg, k, box.x + box.w / 2, box.y + box.h * 0.42, clock, moth);
    },
  });
}

export const jarvisPresent: LiveScene = { id: 'jarvis-present', sources: Object.values(SRC), create: createPresent };
