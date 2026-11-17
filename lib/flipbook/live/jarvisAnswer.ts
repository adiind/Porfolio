/**
 * "Answer": picture page of its spread (right page).
 *
 * The bare blue room at night, dim. The box is on the wall above the word, a tall light bar stands near each
 * side edge, and a man looks up. The play runs once, in two seconds, then the page holds: the box's four LEDs
 * blink twice (0.3 to 0.8 s) while he waits (pose from 0.4 s); then the two bars light dot by dot from the
 * bottom up (0.8 to 1.5 s) and in the same moments the letters fill with light from their feet to their tops,
 * like level meters in dark lanterns, the room's dimness lifting; at 1.5 s the letters hop in turn and at 1.6 s
 * he cheers. Settled by 2.0 s. Afterwards: the bar dots shimmer, the letters sway and their light flickers a
 * hair, he rocks a little. Every state is a function of story time except the springs (hops, his squash).
 *
 * Wording set by the owner on 2026-11-15.
 */

import type { BookImages } from '../pageArt';
import { clamp, rgba, smoothstep, springTo, type Rgb, type Spring } from './motion';
import { wallBox, drawBoxLights, drawWallBox } from './jarvisProps';
import type { JarvisPictureCopy } from './jarvis/kit';
import { SENSOR } from './jarvisWire';
import { ANSWER_SPRITES } from './sprites/answer';
import {
  SPRITE_PAD, STAGE_W, context, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeCanvas, makeLetters, restPose, spriteNamed, stepLetters, tintSheet, wordSpan,
} from './stage';
import type { LivePage, LiveScene } from './types';
import { BLUE } from './jarvis/kit';

const DIR = '/images/flipbook/jarvis/answer';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, people: `${DIR}/people.webp` };

/** What data/flipbooks.ts shows for this page. */
export const COPY: JarvisPictureCopy = {
  kicker: 'Jarvis · feedback',
  title: 'It answers in light.',
  body: 'No screen and no voice. Light gestures instead.',
  alt: 'The word Answer as dark lantern letters in a dim blue room, under a small black box on the wall, with a tall light bar near each side and a man looking up. In about two seconds the box\'s four lights blink twice, then the two bars light dot by dot from the bottom up while the letters fill with light from their feet to their tops and the room brightens; the letters hop in turn and the man cheers. Afterwards the bars shimmer, the letters sway and flicker a hair and he rocks a little.',
};

/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;
const MAX_W = 1900;
const MAX_H = 640;
const FEET = 1010;
/** The man: where his feet stand, and head to feet in page units. */
const MAN = { x: 640, y: 1100, height: 260 };
/**
 * Head to feet in sheet pixels for each pose (measured on the half-size sheet), and where the middle of
 * his body stands across the sprite, so a raised arm does not shrink him and his feet do not move.
 */
const POSES = {
  ask: { body: 423, ax: 0.38 },
  wait: { body: 413, ax: 0.57 },
  cheer: { body: 418, ax: 0.51 },
} as const;
type Pose = keyof typeof POSES;
const poseAt = (t: number): Pose => (t >= 1.6 ? 'cheer' : t >= 0.4 ? 'wait' : 'ask');

/* the light bars: near each side edge, from just above the floor line to near the top */
const BARS = [90, 1910];
const BAR = { top: 60, bottom: 744, w: 42, dots: 22, first: 716, last: 90, r: 8.5 };
const BAR_FROM = 0.8;
const BAR_SPREAD = 0.55;
const BAR_RAMP = 0.15;

const NAVY: Rgb = [8, 16, 58];
const DOT_DARK: Rgb = [22, 38, 96];
const ICE: Rgb = [228, 245, 255];
const CREAM: Rgb = [255, 238, 196];

/** The box's four LEDs blink twice, 0.3 to 0.8 s. */
const BLINKS: ReadonlyArray<readonly [number, number]> = [[0.3, 0.43], [0.56, 0.69]];
const ledBlink = (t: number): number => clamp(BLINKS.reduce((sum, [a, b]) => sum + smoothstep(a, a + 0.03, t) - smoothstep(b, b + 0.03, t), 0));
/** A letter's fill (0 empty to 1 full), rising with the bars. */
const letterFill = (t: number, i: number): number => smoothstep(0.8 + 0.05 * i, 1.25 + 0.05 * i, t);
const dotOn = (t: number, j: number): number => smoothstep(BAR_FROM + (BAR_SPREAD * j) / (BAR.dots - 1), BAR_FROM + (BAR_SPREAD * j) / (BAR.dots - 1) + BAR_RAMP, t);
const dotY = (j: number): number => BAR.first + ((BAR.last - BAR.first) * j) / (BAR.dots - 1);
const shimmer = (clock: number, bar: number, j: number): number => 0.88 + 0.12 * Math.sin(clock * (0.9 + 0.13 * ((j + bar * 3) % 7)) + j * 1.3 + bar * 2.1);

function createAnswer(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  if (!plate || !sheet || !peopleSheet) throw new Error('The Answer page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = ANSWER_SPRITES.letters.sprites;
  const span = wordSpan(sprites);
  const scale = Math.min(MAX_W / span.width, MAX_H / span.height);
  const letters = makeLetters(sprites, { scale, left: (STAGE_W - span.width * scale) / 2, feet: FEET });
  const under = stage.keep(tintSheet(sheet, rgba(BLUE.ink, 0.8)));
  const shade = stage.keep(tintSheet(peopleSheet, rgba(NAVY)));
  const people = ANSWER_SPRITES.people.sprites;

  /* the box on the wall, centred above the letters */
  const wordTop = FEET - span.height * scale;
  const box = wallBox(1000, wordTop / 2, 210);

  /* one scratch canvas, big enough for any letter, where a letter is lit before it is drawn */
  const scratch = stage.keep(makeCanvas(Math.max(...letters.map((l) => l.rect[2])), Math.max(...letters.map((l) => l.rect[3]))));
  const sc = context(scratch);

  const pop: Spring = { x: 0, v: 0 };
  let lastPose: Pose | null = null;
  let snapNext = true;

  /** One letter as a lantern: the letter, then (only on its own shape) navy over the unfilled part and cream over the part below the fill line. */
  const drawLantern = (i: number, fill: number, flick: number): void => {
    const letter = letters[i];
    const [rx, ry, rw, rh] = letter.rect;
    sc.globalCompositeOperation = 'source-over';
    sc.clearRect(0, 0, scratch.width, scratch.height);
    sc.drawImage(sheet, rx, ry, rw, rh, 0, 0, rw, rh);
    sc.globalCompositeOperation = 'source-atop';
    const bottom = rh - SPRITE_PAD;
    const line = bottom - fill * (bottom - SPRITE_PAD);
    if (line > 0) { sc.fillStyle = rgba([6, 12, 52], 0.8); sc.fillRect(0, 0, rw, line); }
    if (fill > 0.001) {
      sc.fillStyle = rgba(CREAM, clamp(0.9 + flick));
      sc.fillRect(0, line, rw, rh - line);
      // lantern bands: faint ribs across the lit part
      sc.fillStyle = rgba(NAVY, 0.05);
      for (let y = bottom - 56; y > line; y -= 70) sc.fillRect(0, y, rw, 6);
      if (fill < 0.995) { sc.fillStyle = rgba([255, 255, 255], 0.85); sc.fillRect(0, line - 5, rw, 10); }
    }
    sc.globalCompositeOperation = 'source-over';
    word.save();
    word.translate((letter.px + letter.shiftX) * k, (letter.py - letter.lift) * k);
    word.rotate(letter.angle);
    word.scale(letter.scaleX * letter.scale * k, letter.scaleY * letter.scale * k);
    word.drawImage(scratch, 0, 0, rw, rh, -rw / 2, -rh + SPRITE_PAD, rw, rh);
    word.restore();
  };

  return loopPage(stage, {
    loop: SETTLE,
    rest: SETTLE,
    once: true,
    enter() {
      hopInTurn(letters, 0.05, 1.5);
      snapNext = true;
    },
    step(t, clock, input) {
      stepLetters(letters, input);
      const pose = poseAt(t);
      if (input.reduced || snapNext) {
        pop.x = 0; pop.v = 0;
        snapNext = false;
      } else {
        if (lastPose && pose !== lastPose && input.dt > 0) pop.v += 2.2;
        springTo(pop, 0, 17, 0.38, input.dt);
      }
      lastPose = pose;
      letters.forEach((letter) => restPose(letter, clock, 0.006));
    },
    draw(t, clock) {
      const lit = smoothstep(BAR_FROM, BAR_FROM + BAR_SPREAD + BAR_RAMP, t);

      /* printed sheet: the room, the box, the bars, the night over them, then the lit dots and the box's LEDs */
      stage.backdrop(plate, 0.72);
      drawWallBox(base, k, box);
      BARS.forEach((x) => {
        base.fillStyle = rgba(NAVY, 0.96);
        base.strokeStyle = rgba([60, 90, 170], 0.7);
        base.lineWidth = 2 * k;
        base.beginPath(); base.roundRect((x - BAR.w / 2) * k, BAR.top * k, BAR.w * k, (BAR.bottom - BAR.top) * k, 12 * k); base.fill(); base.stroke();
        for (let j = 0; j < BAR.dots; j += 1) {
          base.fillStyle = rgba(DOT_DARK);
          base.beginPath(); base.arc(x * k, dotY(j) * k, BAR.r * k, 0, Math.PI * 2); base.fill();
        }
      });
      const night = 0.5 * (1 - lit);
      if (night > 0.003) {
        base.fillStyle = rgba(NAVY, night);
        base.fillRect(0, 0, width, height);
      }
      BARS.forEach((x, b) => {
        for (let j = 0; j < BAR.dots; j += 1) {
          const on = dotOn(t, j);
          if (on < 0.01) continue;
          const glow = on * shimmer(clock, b, j);
          const y = dotY(j);
          const halo = base.createRadialGradient(x * k, y * k, 0, x * k, y * k, 30 * k);
          halo.addColorStop(0, rgba(ICE, 0.42 * glow));
          halo.addColorStop(1, rgba(ICE, 0));
          base.fillStyle = halo;
          base.fillRect((x - 30) * k, (y - 30) * k, 60 * k, 60 * k);
          base.fillStyle = rgba(ICE, glow);
          base.beginPath(); base.arc(x * k, y * k, BAR.r * k, 0, Math.PI * 2); base.fill();
          base.strokeStyle = rgba(ICE, 0.38 * glow);
          base.lineWidth = 2 * k;
          base.beginPath(); base.arc(x * k, y * k, (BAR.r + 5.5) * k, 0, Math.PI * 2); base.stroke();
        }
      });
      const blink = ledBlink(t);
      drawBoxLights(base, k, box, SENSOR.leds.map(() => blink));
      stage.tooth();

      /* floating sheet: the letters as lanterns */
      letters.forEach((letter) => drawLetter(word, under, letter, k, 10, 12));
      letters.forEach((letter, i) => {
        const fill = letterFill(t, i);
        // a lit letter is never quite steady
        const flick = fill * 0.04 * Math.sin(clock * (4.3 + i * 0.61) + letter.phase * 3);
        drawLantern(i, fill, flick);
      });

      /* in front: the man, dimmed with the room */
      const pose = poseAt(t);
      const fit = POSES[pose];
      const rock = pose === 'cheer' ? Math.sin(clock * 3.2) * 0.02 : pose === 'wait' ? Math.sin(clock * 2.1) * 0.01 : Math.sin(clock * 1.7) * 0.006;
      const at = { x: MAN.x, y: MAN.y, scale: MAN.height / fit.body, anchor: [fit.ax, 1] as const, squash: pop.x, angle: rock };
      drawSprite(fg, peopleSheet, spriteNamed(people, pose), k, at);
      if (night > 0.01) drawSprite(fg, shade, spriteNamed(people, pose), k, { ...at, alpha: night * 0.9 });
    },
  });
}

export const jarvisAnswer: LiveScene = { id: 'jarvis-answer', sources: Object.values(SRC), create: createAnswer };
