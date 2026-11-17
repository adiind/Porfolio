/**
 * "Here": picture page of its spread (right page). STUB: the backdrop, the word standing in its letters
 * (hopping in when the page lands, then swaying) and one person standing. Nothing else happens yet.
 *
 * To build it, edit only this file (see lib/flipbook/live/jarvis/README.md): replace the story in
 * `create` and `draw`, and fill in `COPY` (data/flipbooks.ts reads it). Jarvis's box, its lights, rings and
 * the man are in jarvisProps.ts; jarvisPresent.ts is the finished example of this same pattern.
 *
 * Rule for every Jarvis page: the play that carries the idea runs ONCE and is complete within 2.0 s of
 * `enter()`; the page then holds its finished state with only small ambient motion. `loopPage` with
 * `once: true` does the holding: story time `t` never goes past `loop`, and `rest` is the still.
 * The `here` page's sprite sheet also lists a `parts` sheet (with a `roof`); add `parts.webp` to SRC to use it.
 *
 */

/**
 * "Here": everything happens in the room.
 *
 * The garden at dusk. The letters H E R E are the walls of a house. A roof drops onto them (0 to 0.5 s) and
 * the letters hop in turn as it lands. A man stands on the path in front; at 0.4 s he speaks, and three
 * small word tokens leave his mouth one after another (from 0.5 s), each flying up across the letters and
 * into the box mounted on the face of the R; as each arrives one more of its LEDs lights, the fourth lights
 * at 1.4 s and the letters hop once more. At 1.6 s he is content. Settled by 2.0 s. After that a cloud
 * keeps drifting over the roof, stars twinkle, the letters sway and he rocks a little.
 * Everything drawn here is a pure function of story time except the letters' hops and his small squash.
 */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, springTo, type Spring } from './motion';
import { drawBoxLights, drawWallBox, wallBox } from './jarvisProps';
import { HERE_SPRITES } from './sprites/here';
import { STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed, stepLetters, tintSheet, withLetter, wordSpan } from './stage';
import type { LivePage, LiveScene } from './types';
import { GREEN, type JarvisPictureCopy } from './jarvis/kit';

const DIR = '/images/flipbook/jarvis/here';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, people: `${DIR}/people.webp`, parts: `${DIR}/parts.webp` };

/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;
/** The four letters are this wide together; the roof is a little wider. */
const WORD_W = 1560;
const FEET = 990;
/** The man stands on the path in front: his feet, and how tall he is (page units). */
const PERSON = { x: 580, y: 1120, height: 260 };
/** Where his mouth is, as fractions of the speaking sprite's box (it faces right). */
const MOUTH = [0.72, 0.13] as const;
/** The box on the face of the R, in letter-sheet pixels (the sprite's source frame): its middle and height. */
const BOX = { x: 1205, y: 178, h: 176 };
const ROOF_DROP = { from: 0, to: 0.5, height: 760 };
const TOKEN = { w: 70, h: 34, start: 0.5, gap: 0.2, flight: 0.4 };
const LEDS_AT = [TOKEN.start + TOKEN.flight, TOKEN.start + TOKEN.gap + TOKEN.flight, TOKEN.start + 2 * TOKEN.gap + TOKEN.flight, 1.4];
const SPEAK_AT = 0.4;
const CONTENT_AT = 1.6;
const MINT: [number, number, number] = [214, 240, 222];
const CREAM: [number, number, number] = [255, 246, 226];

/** What data/flipbooks.ts shows for this page: the small line, the sentence, a line or two, and what moves. */
export const COPY: JarvisPictureCopy = {
  kicker: 'Jarvis · local',
  title: 'Everything happens here.',
  body: 'My words go to the box in the room and stop there. Nothing is sent to a cloud.',
  alt: 'The word Here as four letters that are the walls of a house, in a garden at dusk. In about two seconds a roof drops onto the letters and they hop in turn; a man on the path speaks and three small word tokens fly from his mouth across the letters into a small box on the face of the R, lighting its four LEDs one by one; the letters hop again and he looks pleased. Afterwards a mint cloud keeps drifting over the roof, stars twinkle, the letters sway and he rocks a little.',
};

const quad = (a: number, b: number, c: number, u: number): number => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;

function createHere(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  const partsSheet = images.get(SRC.parts);
  if (!plate || !sheet || !peopleSheet || !partsSheet) throw new Error('The Here page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = HERE_SPRITES.letters.sprites;
  const span = wordSpan(sprites);
  const scale = WORD_W / span.width;
  const letters = makeLetters(sprites, { scale, left: (STAGE_W - WORD_W) / 2, feet: FEET });
  const under = stage.keep(tintSheet(sheet, rgba(GREEN.ink, 0.8)));
  const roof = spriteNamed(HERE_SPRITES.parts.sprites, 'roof');
  const roofScale = (WORD_W * 1.1) / roof.rect[2];
  const letterTop = Math.min(...letters.map((letter) => letter.py - letter.h * scale));
  const box = wallBox(BOX.x, BOX.y, BOX.h);
  const R = letters[2];
  const pop: Spring = { x: 0, v: 0 };
  let lastPose = '';
  let second = false;

  const poseAt = (t: number): 'watch' | 'speak' | 'content' => (t >= CONTENT_AT ? 'content' : t >= SPEAK_AT ? 'speak' : 'watch');
  const manScale = PERSON.height / 472;

  return loopPage(stage, {
    loop: SETTLE,
    rest: SETTLE,
    once: true,
    enter() {
      hopInTurn(letters, 0.06, ROOF_DROP.to);
      second = false;
      lastPose = '';
      pop.x = 0; pop.v = 0;
    },
    step(t, clock, input) {
      stepLetters(letters, input);
      if (t >= LEDS_AT[3] && !second && input.dt > 0) {
        second = true;
        letters.forEach((letter) => { letter.hop.v += 330; });
      }
      const pose = poseAt(t);
      if (lastPose && pose !== lastPose && input.dt > 0) pop.v += 2.2;
      lastPose = pose;
      springTo(pop, 0, 17, 0.38, input.dt);
      letters.forEach((letter) => restPose(letter, clock, 0.006));
    },
    draw(t, clock) {
      /* printed sheet: the garden at dusk, a mint cloud drifting over the roof, a few stars */
      stage.backdrop(plate, 0.72);
      const drift = ((clock * 22 + 300) % 2700) - 400;
      base.fillStyle = rgba(MINT, 0.85);
      [[0, 0, 42], [58, -14, 52], [120, 0, 44], [-52, 10, 30], [170, 12, 28]].forEach(([dx, dy, r]) => {
        base.beginPath(); base.arc((drift + dx) * k, (92 + dy) * k, r * k, 0, Math.PI * 2); base.fill();
      });
      base.fillRect((drift - 52) * k, 92 * k, 224 * k, 36 * k);
      [[290, 70, 0], [1740, 120, 1.7], [1560, 52, 3.1]].forEach(([sx, sy, ph]) => {
        const glow = 0.45 + 0.45 * Math.sin(clock * 2.1 + ph);
        base.fillStyle = rgba(CREAM, glow);
        base.beginPath();
        for (let a = 0; a < 8; a += 1) {
          const rad = a % 2 ? 4 : 13;
          const ang = (a * Math.PI) / 4;
          base.lineTo((sx + Math.cos(ang) * rad) * k, (sy + Math.sin(ang) * rad) * k);
        }
        base.closePath(); base.fill();
      });
      stage.tooth();

      /* the letters: thickness, then faces */
      letters.forEach((letter) => drawLetter(word, under, letter, k, 10, 12));
      letters.forEach((letter) => drawLetter(word, sheet, letter, k));

      /* the box on the face of the R, on the letters' layer so it moves with them */
      withLetter(word, R, k, () => {
        drawWallBox(word, 1, box);
        drawBoxLights(word, 1, box, LEDS_AT.map((at) => smoothstep(at, at + 0.1, t)));
      });

      /* the roof drops onto the letters and rides their hop a little */
      const u = clamp((t - ROOF_DROP.from) / (ROOF_DROP.to - ROOF_DROP.from));
      const lift = (letters.reduce((sum, letter) => sum + letter.lift, 0) / letters.length) * 0.6;
      drawSprite(word, partsSheet, roof, k, { x: STAGE_W / 2, y: letterTop + 8 - lift - ROOF_DROP.height * (1 - u * u), scale: roofScale });

      /* in front: the man, and the word tokens */
      const pose = poseAt(t);
      const sprite = spriteNamed(HERE_SPRITES.people.sprites, pose);
      const rock = Math.sin(clock * 2.1) * (pose === 'speak' ? 0.018 : 0.01);
      drawSprite(fg, peopleSheet, sprite, k, { x: PERSON.x, y: PERSON.y, scale: manScale, angle: rock, squash: pop.x });
      const speak = spriteNamed(HERE_SPRITES.people.sprites, 'speak');
      const mouth = { x: PERSON.x + (MOUTH[0] - 0.5) * speak.rect[2] * manScale, y: PERSON.y - (1 - MOUTH[1]) * speak.rect[3] * manScale };
      const dest = onLetter(R, BOX.x, BOX.y);
      for (let i = 0; i < 3; i += 1) {
        const f = (t - (TOKEN.start + TOKEN.gap * i)) / TOKEN.flight;
        if (f <= 0 || f >= 1) continue;
        const e = f * f * (3 - 2 * f);
        const cx = lerp(mouth.x, dest.x, 0.5);
        const cy = Math.min(mouth.y, dest.y) - 260;
        const x = quad(mouth.x, cx, dest.x, e);
        const y = quad(mouth.y, cy, dest.y, e);
        const dx = 2 * (1 - e) * (cx - mouth.x) + 2 * e * (dest.x - cx);
        const dy = 2 * (1 - e) * (cy - mouth.y) + 2 * e * (dest.y - cy);
        const size = 1 - 0.55 * smoothstep(0.75, 1, f);
        fg.save();
        fg.globalAlpha *= 1 - smoothstep(0.9, 1, f);
        fg.translate(x * k, y * k);
        fg.rotate(Math.atan2(dy, dx) * 0.5);
        fg.scale(size, size * (0.85 + 0.15 * Math.sin(f * 14)));
        fg.shadowColor = 'rgba(10, 40, 20, 0.3)';
        fg.shadowBlur = 8 * k;
        fg.shadowOffsetY = 3 * k;
        fg.fillStyle = rgba(CREAM);
        fg.beginPath(); fg.roundRect(-TOKEN.w / 2 * k, -TOKEN.h / 2 * k, TOKEN.w * k, TOKEN.h * k, TOKEN.h / 2 * k); fg.fill();
        fg.restore();
      }
    },
  });
}

export const jarvisHere: LiveScene = { id: 'jarvis-here', sources: Object.values(SRC), create: createHere };
