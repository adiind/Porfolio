/**
 * "Control": one phrase runs the room.
 *
 * The violet room in the evening. The play runs once, in two seconds. At 0 s the room is dim (a deep
 * aubergine laid over the sheet), the four pendant lamps are off, both dials (the two round letters O) point
 * up and the man points along the wall. 0.3 s the box's four lights come on; 0.4 to 1.3 s a bright dot runs
 * along the wire from the box to the right edge. As it passes each lamp that lamp comes on (the room
 * brightening a step each time, a pale cone of light falling on the letters), and as it passes over each O
 * that dial turns a quarter turn clockwise, with a little overshoot, so the pointers end pointing right.
 * 1.4 s the letters hop in turn; 1.6 s he changes to the pleased pose with a small squash. Settled by 2.0 s.
 * After that: the lamps swing a hair on their cords and their cones follow, the dials tremble, the letters
 * sway and he rocks.
 *
 * Every state is a pure function of story time `t`, so the still (2.0 s) and the live page agree.
 */

import type { BookImages } from '../pageArt';
import { clamp, lerp, mixRgb, rgba, smoothstep, type Rgb } from './motion';
import { drawBoxLights, drawWallBox, wallBox } from './jarvisProps';
import { SENSOR } from './jarvisWire';
import { CONTROL_SPRITES } from './sprites/control';
import { SPRITE_PAD, STAGE_W, createStage, drawSprite, hopInTurn, loopPage, makeLetters, restPose, stepLetters, tintSheet, wordSpan, type Letter } from './stage';
import type { LivePage, LiveScene } from './types';
import { PLUM, type JarvisPictureCopy } from './jarvis/kit';

const DIR = '/images/flipbook/jarvis/control';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, people: `${DIR}/people.webp` };

/** What data/flipbooks.ts shows for this page. */
export const COPY: JarvisPictureCopy = {
  kicker: 'Jarvis · the house',
  title: 'One phrase runs the room.',
  body: 'The box passes a short message on, and the lights follow.',
  alt: 'The word Control as letters in a violet room in the evening, the two round letters O being dials with a pointer straight up. A small black box hangs on the wall at the left, a thin wire runs from it along the picture rail, and four pendant lamps hang from the wire above the letters. A man at the left points along the wall. In about two seconds a bright dot runs along the wire from the box to the right edge; as it passes each lamp that lamp comes on and the room brightens, and as it passes each O that dial turns a quarter turn so its pointer points right. The letters hop, and the man looks pleased. Afterwards the lamps swing a hair on their cords, the dials tremble and he rocks.',
};

/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;
const MAX_W = 1900;
const MAX_H = 640;
const FEET = 1010;
const MAN = { x: 330, y: 1100, height: 260 };
/** The man's body height in each pose's sheet pixels (a raised arm must not shrink him), and where his body sits across its box. */
const BODY: Record<'point' | 'pleased', { h: number; ax: number }> = {
  point: { h: 452, ax: 0.2 },
  pleased: { h: 461, ax: 0.55 },
};

/* ---------- the wire and the lamps ---------- */
const BOX = { x: 300, y: 330, h: 200 };
const RAIL = 118;
const LAMP_XS = [560, 960, 1360, 1760];
const CORD = 120;
const SHADE = { top: 62, bottom: 22, h: 56 };
const CONE_LEN = 640;
const CONE_HALF = 190;
const T_DOT = { from: 0.4, to: 1.3 };

const AUBERGINE: Rgb = [38, 10, 46];
const SHADE_OFF: Rgb = [92, 46, 130];
const SHADE_ON: Rgb = [255, 244, 214];
const DIM = 0.5;

const easeOutBack = (u: number): number => {
  const x = clamp(u) - 1;
  return 1 + 2.6 * x ** 3 + 1.6 * x ** 2;
};

function createControl(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  if (!plate || !sheet || !peopleSheet) throw new Error('The Control page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = CONTROL_SPRITES.letters.sprites;
  const span = wordSpan(sprites);
  const scale = Math.min(MAX_W / span.width, MAX_H / span.height);
  const letters = makeLetters(sprites, { scale, left: (STAGE_W - span.width * scale) / 2, feet: FEET });
  const under = stage.keep(tintSheet(sheet, rgba(PLUM.ink, 0.8)));
  const unlit = stage.keep(tintSheet(sheet, rgba(AUBERGINE)));
  const shade = stage.keep(tintSheet(peopleSheet, rgba(AUBERGINE)));
  const people = CONTROL_SPRITES.people.sprites;
  const spriteOf = (name: string) => people.find((sprite) => sprite.name === name)!;

  const box = wallBox(BOX.x, BOX.y, BOX.h);
  /* the wire: from the top of the box, up to the rail, then along it to the right edge */
  const rise = box.y - RAIL;
  const run = STAGE_W - box.x - box.w / 2;
  const length = rise + run;
  /** The moment the dot is over scene x (it is on the rail from x = the box's middle). */
  const passes = (x: number): number => lerp(T_DOT.from, T_DOT.to, (rise + (x - (box.x + box.w / 2))) / length);
  const lampAt = LAMP_XS.map(passes);
  /* the two dials: the O letters, indices 1 and 5 */
  const dials = [1, 5].map((index) => ({ letter: letters[index], at: passes(letters[index].px) }));
  const dialTurn = (at: number, t: number): number => (Math.PI / 2) * easeOutBack((t - at) / 0.42) * (t >= at ? 1 : 0);

  const lampOn = (t: number): number[] => lampAt.map((at) => smoothstep(at, at + 0.14, t));
  const dialOf = new Map<Letter, number>(dials.map((d, i) => [d.letter, i]));

  /** Draw a letter the way stage.drawLetter does, with a quarter-turn dial about its own centre. */
  const drawTurned = (ctx: CanvasRenderingContext2D, img: CanvasImageSource, letter: Letter, turn: number, dx = 0, dy = 0): void => {
    const [rx, ry, rw, rh] = letter.rect;
    ctx.save();
    ctx.translate((letter.px + letter.shiftX + dx) * k, (letter.py - letter.lift + dy) * k);
    ctx.rotate(letter.angle);
    ctx.scale(letter.scaleX * letter.scale * k, letter.scaleY * letter.scale * k);
    ctx.translate(0, -(rh - SPRITE_PAD) / 2);
    ctx.rotate(turn);
    ctx.drawImage(img, rx, ry, rw, rh, -rw / 2, -rh / 2, rw, rh);
    ctx.restore();
  };

  /** Put the origin on a lamp's cord and swing it a hair. */
  const swingOf = (i: number, clock: number): number => 0.014 * Math.sin(clock * 1.25 + i * 1.7) + 0.006 * Math.sin(clock * 0.7 + i);
  const atLamp = (ctx: CanvasRenderingContext2D, i: number, clock: number, draw: () => void): void => {
    ctx.save();
    ctx.translate(LAMP_XS[i] * k, RAIL * k);
    ctx.rotate(swingOf(i, clock));
    draw();
    ctx.restore();
  };

  return loopPage(stage, {
    loop: SETTLE,
    rest: SETTLE,
    once: true,
    enter() { hopInTurn(letters, 0.06, 1.4); },
    step(t, clock, input) {
      stepLetters(letters, input);
      letters.forEach((letter) => restPose(letter, clock, 0.006));
      void t;
    },
    draw(t, clock) {
      const on = lampOn(t);
      const lit = on.reduce((a, b) => a + b, 0) / on.length;
      const ledsOn = smoothstep(0.3, 0.42, t);

      /* printed sheet: the room, the box, the wire and lamps, the evening over them */
      stage.backdrop(plate, 0.72);
      drawWallBox(base, k, box);
      const dim = DIM * (1 - lit);
      if (dim > 0.003) {
        base.fillStyle = rgba(AUBERGINE, dim);
        base.fillRect(0, 0, width, height);
      }
      drawBoxLights(base, k, box, SENSOR.leds.map(() => ledsOn));

      // the wire
      const path = new Path2D();
      path.moveTo(box.x * k + (box.w / 2) * k, box.y * k);
      path.lineTo((box.x + box.w / 2) * k, RAIL * k);
      path.lineTo(STAGE_W * k, RAIL * k);
      base.strokeStyle = rgba(PLUM.ink, 0.85);
      base.lineWidth = 3.4 * k;
      base.lineCap = 'round';
      base.stroke(path);

      // the pendant lamps: cord, flat shade, a bulb that shows once it is on
      LAMP_XS.forEach((_, i) => {
        atLamp(base, i, clock, () => {
          base.strokeStyle = rgba(PLUM.ink, 0.85);
          base.lineWidth = 3 * k;
          base.beginPath(); base.moveTo(0, 0); base.lineTo(0, CORD * k); base.stroke();
          base.fillStyle = rgba(mixRgb(SHADE_OFF, SHADE_ON, on[i]));
          base.strokeStyle = rgba(PLUM.ink, 0.9);
          base.lineWidth = 2.6 * k;
          base.beginPath();
          base.moveTo(-SHADE.top / 2 * k, (CORD + 0) * k);
          base.lineTo(SHADE.top / 2 * k, CORD * k);
          base.lineTo((SHADE.top / 2 + SHADE.bottom) * k, (CORD + SHADE.h) * k);
          base.lineTo(-(SHADE.top / 2 + SHADE.bottom) * k, (CORD + SHADE.h) * k);
          base.closePath(); base.fill(); base.stroke();
          if (on[i] > 0.01) {
            base.fillStyle = rgba([255, 250, 232], on[i]);
            base.beginPath(); base.ellipse(0, (CORD + SHADE.h + 3) * k, 26 * k, 8 * k, 0, 0, Math.PI * 2); base.fill();
          }
        });
      });
      stage.tooth();

      /* floating sheet: the letters, the dials turned, the evening over them while they are dim */
      letters.forEach((letter) => {
        const d = dialOf.get(letter);
        const turn = d === undefined ? 0 : dialTurn(dials[d].at, t) + 0.012 * Math.sin(clock * 7.3 + letter.phase);
        drawTurned(word, under, letter, turn, 10, 12);
      });
      letters.forEach((letter) => {
        const d = dialOf.get(letter);
        const turn = d === undefined ? 0 : dialTurn(dials[d].at, t) + 0.012 * Math.sin(clock * 7.3 + letter.phase);
        drawTurned(word, sheet, letter, turn);
        if (dim > 0.01) {
          word.globalAlpha = dim * 1.1;
          drawTurned(word, unlit, letter, turn);
          word.globalAlpha = 1;
        }
      });

      /* in front: the cones of light on the letters, the dot, the man */
      LAMP_XS.forEach((_, i) => {
        if (on[i] < 0.01) return;
        atLamp(fg, i, clock, () => {
          fg.fillStyle = rgba([255, 244, 214], 0.2 * on[i]);
          fg.beginPath();
          fg.moveTo(-(SHADE.top / 2 + SHADE.bottom) * k, (CORD + SHADE.h) * k);
          fg.lineTo((SHADE.top / 2 + SHADE.bottom) * k, (CORD + SHADE.h) * k);
          fg.lineTo(CONE_HALF * k, (CORD + CONE_LEN) * k);
          fg.lineTo(-CONE_HALF * k, (CORD + CONE_LEN) * k);
          fg.closePath(); fg.fill();
        });
      });

      const run01 = clamp((t - T_DOT.from) / (T_DOT.to - T_DOT.from));
      const dotAlpha = smoothstep(T_DOT.from - 0.02, T_DOT.from + 0.04, t) * (1 - smoothstep(T_DOT.to, T_DOT.to + 0.12, t));
      if (dotAlpha > 0.01) {
        const d = run01 * length;
        const x = (box.x + box.w / 2) + Math.max(0, d - rise);
        const y = d < rise ? box.y - d : RAIL;
        const halo = fg.createRadialGradient(x * k, y * k, 0, x * k, y * k, 46 * k);
        halo.addColorStop(0, rgba([255, 250, 232], 0.9 * dotAlpha));
        halo.addColorStop(1, rgba([255, 235, 190], 0));
        fg.fillStyle = halo;
        fg.fillRect((x - 46) * k, (y - 46) * k, 92 * k, 92 * k);
        fg.fillStyle = rgba([255, 255, 246], dotAlpha);
        fg.beginPath(); fg.arc(x * k, y * k, 9 * k, 0, Math.PI * 2); fg.fill();
      }

      // the man: points while the message runs, then looks pleased; a small squash at the change
      const pleased = t >= 1.6;
      const name = pleased ? 'pleased' : 'point';
      const sprite = spriteOf(name);
      const body = BODY[name];
      const since = Math.max(0, t - 1.6);
      const squash = pleased ? 0.55 * Math.exp(-since * 9) * Math.cos(since * 26) : 0;
      const rock = 0.012 * Math.sin(clock * 2.4);
      const at = { x: MAN.x, y: MAN.y, scale: MAN.height / body.h, anchor: [body.ax, 1] as const, squash, angle: rock };
      drawSprite(fg, peopleSheet, sprite, k, at);
      const shadeAmount = dim * 1.0;
      if (shadeAmount > 0.01) drawSprite(fg, shade, sprite, k, { ...at, alpha: shadeAmount * 0.9 });
    },
  });
}

export const jarvisControl: LiveScene = { id: 'jarvis-control', sources: Object.values(SRC), create: createControl };
