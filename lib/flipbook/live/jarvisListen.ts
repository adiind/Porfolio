/**
 * "Listen": picture page of its spread (right page): it knows my voice.
 *
 * The rose room. The man stands at the left, facing the word LISTEN; the box hangs on the wall above the letters
 * with its four lights on. The play runs once, in two seconds, then holds. 0 s he stands (idle); 0.2 s he
 * calls (speak); 0.3 to 1.0 s six thin wavy lines, the owner's six real recordings of "Jarvis Lights On"
 * (sprites/jarvisVoice.ts) as wave shapes, fly from his mouth to the word, spreading out; 0.7 to 1.5 s six
 * raspberry lines run across the inside of the letters, first out of step, then converging into ONE bold line;
 * at 1.5 s the letters hop in turn left to right and the box's lights blink; 1.6 s he cheers (glad). Settled by 2.0 s.
 * Afterwards: the bold line keeps rippling, the letters sway, he rocks a little. Every state of the story is a
 * function of story time; the ripple and the rock use the free-running clock. No pointer.
 *
 * Wording set by the owner on 2026-11-15.
 */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep } from './motion';
import { drawBoxLights, drawWallBox, wallBox } from './jarvisProps';
import { JARVIS_VOICE } from './sprites/jarvisVoice';
import { LISTEN_SPRITES } from './sprites/listen';
import { STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeCanvas, makeLetters, restPose, spriteNamed, stepLetters, tintSheet, wordSpan, context } from './stage';
import type { LivePage, LiveScene } from './types';
import { ROSE, type JarvisPictureCopy } from './jarvis/kit';

const DIR = '/images/flipbook/jarvis/listen';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, people: `${DIR}/people.webp` };

/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;
/** The word fits in this box, centred, standing on FEET (page units). */
const MAX_W = 1900;
const MAX_H = 640;
const FEET = 1010;
/** Where the man stands (his feet), and how tall he is (head to feet), in page units. */
const PERSON = { x: 300, y: 1135, height: 260 };
/** Where the chest is across each pose's sprite box, and where the mouth is (fractions of the box). */
const POSES = {
  idle: { ax: 0.40, mouth: null },
  speak: { ax: 0.22, mouth: [0.80, 0.147] },
  glad: { ax: 0.32, mouth: null },
} as const;
type Pose = keyof typeof POSES;
const T_SPEAK = 0.2;
const T_GLAD = 1.6;
const T_HOP = 1.5;
const poseAt = (t: number): Pose => (t >= T_GLAD ? 'glad' : t >= T_SPEAK ? 'speak' : 'idle');
/** A small squash that rings down after each change of pose. */
const squashAt = (t: number): number => [T_SPEAK, T_GLAD].reduce((sum, ts) => (t > ts ? sum + Math.exp(-(t - ts) * 9) * Math.sin((t - ts) * 26) * 0.55 : sum), 0);

/* ---------- the data: six real takes, frame 0 left out, each 0..1 on its own ---------- */

const smooth = (take: readonly number[], half = 3): number[] => take.map((_, i) => {
  const a = Math.max(0, i - half);
  const b = Math.min(take.length - 1, i + half);
  let sum = 0;
  for (let j = a; j <= b; j += 1) sum += take[j];
  return sum / (b - a + 1);
});
/** Each take with a moving average of 7 frames, so the lines read as clean curves. */
const TAKES: number[][] = JARVIS_VOICE.takesUnit.map((take) => smooth(take.slice(1)));
const at = (take: readonly number[], f: number): number => {
  const p = clamp(f) * (take.length - 1);
  const i = Math.min(take.length - 2, Math.floor(p));
  return lerp(take[i], take[i + 1], p - i);
};
const MEAN = (f: number): number => TAKES.reduce((sum, take) => sum + at(take, f), 0) / TAKES.length;

const RASPBERRY: [number, number, number] = [196, 30, 84];
const CREAM: [number, number, number] = [255, 246, 224];

/** What data/flipbooks.ts shows for this page: the small line, the sentence, a line or two, and what moves. */
export const COPY: JarvisPictureCopy = {
  kicker: 'Jarvis · voice',
  title: 'It knows my voice.',
  body: 'A model trained on my own recordings, for ten exact commands.',
  alt: 'The word Listen as big letters in a rose-coloured room, a small box on the wall above them, and a man at the left. In about two seconds he calls out and six thin wavy lines, his six recordings, fly from his mouth to the word; inside the letters six raspberry lines run across the word, out of step at first, and join into one bold line. The letters hop in turn, the box blinks, and he cheers. Afterwards the bold line keeps rippling inside the letters, the letters sway and he rocks a little.',
};

function createListen(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  if (!plate || !sheet || !peopleSheet) throw new Error('The Listen page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = LISTEN_SPRITES.letters.sprites;
  const span = wordSpan(sprites);
  const scale = Math.min(MAX_W / span.width, MAX_H / span.height);
  const wordW = span.width * scale;
  const left = (STAGE_W - wordW) / 2;
  const letters = makeLetters(sprites, { scale, left, feet: FEET });
  const under = stage.keep(tintSheet(sheet, rgba(ROSE.ink, 0.8)));
  const band = { top: FEET - span.height * scale, cy: FEET - (span.height * scale) / 2, amp: span.height * scale * 0.3 };
  /* the letters are drawn on a scratch sheet so the lines inside can be cut to their shapes (source-atop) */
  const scratch = stage.keep(makeCanvas(word.canvas.width, word.canvas.height));
  const inside = context(scratch);

  /* the box on the wall, centred above the letters */
  const box = wallBox(1000, band.top / 2, 210);

  const sc = PERSON.height / LISTEN_SPRITES.people.sprites[0].rect[3];
  const mouthOf = (): { x: number; y: number } => {
    const s = spriteNamed(LISTEN_SPRITES.people.sprites, 'speak');
    const [mx, my] = POSES.speak.mouth;
    return { x: PERSON.x + (mx - POSES.speak.ax) * s.rect[2] * sc, y: PERSON.y - (1 - my) * s.rect[3] * sc };
  };
  const mouth = mouthOf();

  /** The six raspberry lines inside the word, at story time t (and the clock, for the ripple). */
  const drawInside = (t: number, clock: number): void => {
    const run = smoothstep(0.7, 1.1, t);
    if (run <= 0.001) return;
    const c = smoothstep(0.75, 1.5, t);
    const ripple = smoothstep(1.4, 2.2, clock);
    const x1 = left + wordW * run;
    const amp = (span.height * scale) * 0.12;
    const yOf = (f: number, v: number, off: number): number => band.cy + (0.5 - v) * 2 * amp + off * 30 * (1 - c) + 6 * ripple * Math.sin(f * 9 - clock * 1.8);
    inside.save();
    inside.globalCompositeOperation = 'source-atop';
    inside.lineCap = 'round';
    inside.lineJoin = 'round';
    const path = (v: (f: number) => number, off: number): void => {
      inside.beginPath();
      for (let x = left; x <= x1 + 0.1; x += 8) {
        const f = (x - left) / wordW;
        const y = yOf(f, v(f), off);
        if (x === left) inside.moveTo(x * k, y * k); else inside.lineTo(x * k, y * k);
      }
      inside.stroke();
    };
    // six thin lines, out of step, drawing together into the shared shape
    inside.strokeStyle = rgba(RASPBERRY, 0.9 * (1 - c));
    inside.lineWidth = 4 * k;
    if (c < 0.999) {
      TAKES.forEach((take, n) => {
        const off = n - 2.5;
        path((f) => lerp(at(take, f + off * 0.05 * (1 - c)), MEAN(f), c), off);
      });
    }
    // then one bold line of constant width, the average
    inside.strokeStyle = rgba(RASPBERRY, smoothstep(0.7, 1, c));
    inside.lineWidth = 16 * k;
    path(MEAN, 0);
    inside.restore();
  };

  /** Six thin wavy lines (the six takes as waves) flying from his mouth to the word, spreading out. */
  const drawWaves = (t: number): void => {
    fg.save();
    fg.lineCap = 'round';
    fg.lineJoin = 'round';
    TAKES.forEach((take, n) => {
      const p = clamp((t - 0.3 - 0.02 * n) / 0.62);
      if (p <= 0 || p >= 1) return;
      const e = p * p * (3 - 2 * p);
      const target = { x: left + wordW * (0.14 + 0.15 * n), y: band.cy + (n - 2.5) * 70 };
      const dx = target.x - mouth.x;
      const dy = target.y - mouth.y;
      const len = Math.hypot(dx, dy);
      const nx = -dy / len;
      const ny = dx / len;
      const trail = 0.3;
      const head = e * (1 + trail);
      const pts: Array<[number, number]> = [];
      for (let s = 0; s <= 40; s += 1) {
        const a = head - (1 - s / 40) * trail;
        if (a < 0 || a > 1) continue;
        const wave = (at(take, s / 40) - 0.5) * 2 * (4 + 16 * a);
        pts.push([mouth.x + dx * a + nx * wave, mouth.y + dy * a + ny * wave]);
      }
      if (pts.length < 2) return;
      const fade = smoothstep(0, 0.12, p);
      [[6, rgba(ROSE.ink, 0.18 * fade)], [4, rgba(CREAM, 1 * fade)]].forEach(([w, color]) => {
        fg.strokeStyle = color as string;
        fg.lineWidth = (w as number) * k;
        fg.beginPath();
        pts.forEach(([x, y], s) => { if (s === 0) fg.moveTo(x * k, y * k); else fg.lineTo(x * k, y * k); });
        fg.stroke();
      });
    });
    fg.restore();
  };

  return loopPage(stage, {
    loop: SETTLE,
    rest: SETTLE,
    once: true,
    enter() { hopInTurn(letters, 0.07, T_HOP); },
    step(_t, clock, input) {
      stepLetters(letters, input);
      letters.forEach((letter) => restPose(letter, clock, 0.007));
    },
    draw(t, clock) {
      /* printed sheet: the room, the box on the wall, its four lights (they blink as the letters hop) */
      stage.backdrop(plate, 0.72);
      drawWallBox(base, k, box);
      stage.tooth();
      const lit = [0, 1, 2, 3].map((i) => {
        const since = t - T_HOP - 0.06 * i;
        const dip = since > 0 && since < 0.22 ? Math.sin((since / 0.22) * Math.PI) : 0;
        return clamp((0.9 + 0.1 * Math.sin(clock * 3 + i * 1.7)) * (1 - 0.9 * dip));
      });
      drawBoxLights(base, k, box, lit);

      /* floating sheet: the word, thickness first, then each letter with the lines inside it */
      letters.forEach((letter) => drawLetter(word, under, letter, k, 10, 12));
      inside.clearRect(0, 0, scratch.width, scratch.height);
      letters.forEach((letter) => drawLetter(inside, sheet, letter, k));
      drawInside(t, clock);
      word.drawImage(scratch, 0, 0);

      /* in front: the man, and the six waves leaving his mouth */
      const pose = poseAt(t);
      const sprite = spriteNamed(LISTEN_SPRITES.people.sprites, pose);
      const rock = Math.sin(clock * (pose === 'glad' ? 3.2 : 2.2)) * (pose === 'glad' ? 0.02 : 0.012);
      drawSprite(fg, peopleSheet, sprite, k, { x: PERSON.x, y: PERSON.y, scale: sc, anchor: [POSES[pose].ax, 1], squash: squashAt(t), angle: rock });
      drawWaves(t);
    },
  });
}

export const jarvisListen: LiveScene = { id: 'jarvis-listen', sources: Object.values(SRC), create: createListen };
