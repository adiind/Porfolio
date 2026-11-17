/**
 * "Diy": you can make your own.
 *
 * The red workshop. Three cardboard letters lie flat on the bench line, each with a person kneeling or
 * standing in front of it and a little to its left. The play runs once, in two seconds. 0 to 0.4 s three
 * sheets of paper fly from the box on the wall down to the three people. Then, one after another, each
 * letter is built: D stands up at 0.5 s (a small hop, a little overshoot) and takes its colour, and the
 * man cheers; I at 0.9 s and the woman; Y at 1.3 s and the older man. At 1.6 s all three letters hop
 * together. Settled by 2.0 s. After that: the people bob gently out of step, the letters sway, the box's
 * rings pulse faintly.
 *
 * Every state is a pure function of story time (the springs are written out as formulas), so stills,
 * captures and reduced motion show exactly the same frames.
 */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, type Rgb } from './motion';
import { drawBoxLights, drawSensingRings, drawWallBox, wallBox } from './jarvisProps';
import { DIY_SPRITES } from './sprites/diy';
import { STAGE_W, context, createStage, drawLetter, drawSprite, loopPage, makeCanvas, makeLetters, restPose, spriteNamed, stepLetters, tintSheet, wordSpan } from './stage';
import type { LivePage, LiveScene } from './types';
import { RED, type JarvisPictureCopy } from './jarvis/kit';

const DIR = '/images/flipbook/jarvis/diy';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, people: `${DIR}/people.webp` };

/** The play is complete at this moment, and this is the still. */
const SETTLE = 2;
/** The word is at most this wide, centred, standing on FEET (page units). */
const MAX_W = 1500;
const MAX_H = 620;
const FEET = 1010;
/** The people's feet, and how tall each stands (head to feet, page units). */
/** How far above its standing feet a flat letter lies: on the bench top. */
const LIE = 140;
const PERSON_FEET = 1120;
const PERSON_H = 230;

/** What data/flipbooks.ts shows for this page: the small line, the sentence, a line or two, and what moves. */
export const COPY: JarvisPictureCopy = {
  kicker: 'Jarvis · open',
  title: 'You can make your own.',
  body: 'The code and the case files are open. Three people, three letters, each in their own colour.',
  alt: 'The word Diy as three cardboard letters in a red workshop, under the small black box on the wall. At first the letters lie flat and three people stand or kneel in front of them. In about two seconds three sheets of paper fly from the box to the people, then each letter stands up in turn with a small hop and takes its own colour, D pale coral, I tomato red, Y deep brick, and its person cheers. All three letters hop together. Afterwards the people bob gently, the letters sway and faint rings pulse from the box.',
};

/** The three letters: when each stands, its colour, and the person who builds it (head to feet in the cheering pose). */
const TINT = 0.6;
const PARTS: ReadonlyArray<{ at: number; colour: Rgb; work: string; cheer: string; body: number }> = [
  { at: 0.5, colour: [255, 170, 150], work: 'man-work', cheer: 'man-cheer', body: 306 },
  { at: 0.9, colour: [235, 80, 60], work: 'woman-work', cheer: 'woman-cheer', body: 282 },
  { at: 1.3, colour: [170, 24, 36], work: 'elder-work', cheer: 'elder-cheer', body: 297 },
];
const TOGETHER = 1.6;
const PAPER_FLIGHT = 0.4;

/** A damped spring from 0 to 1 that overshoots by about a tenth, `u` seconds after it is let go. */
const rise = (u: number): number => {
  if (u <= 0) return 0;
  const zeta = 0.6;
  const wn = 15;
  const wd = wn * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * wn * u) * (Math.cos(wd * u) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * u));
};
/** A hop of `height` units lasting `span` seconds. */
const hop = (u: number, span: number, height: number): number => {
  if (u <= 0 || u >= span) return 0;
  const q = u / span;
  return height * 4 * q * (1 - q);
};
/** A small wobble that dies away after a change: stretch first, then squash. */
const wobble = (u: number): number => (u <= 0 ? 0 : 0.4 * Math.exp(-7 * u) * Math.sin(24 * u));

const easeOut = (x: number): number => 1 - (1 - x) ** 3;

/** One sheet of pale paper, about 60 by 80, with a fold and two faint lines of print. */
function drawPaper(ctx: CanvasRenderingContext2D, k: number, x: number, y: number, angle: number, alpha: number, scale: number): void {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x * k, y * k);
  ctx.rotate(angle);
  ctx.scale(scale * k, scale * k);
  ctx.shadowColor = 'rgba(70, 20, 10, 0.35)';
  ctx.shadowBlur = 6 * k;
  ctx.shadowOffsetY = 3 * k;
  ctx.fillStyle = rgba([252, 244, 224]);
  ctx.fillRect(-30, -40, 60, 80);
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = rgba([196, 160, 130], 0.9);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-30, -40, 60, 80);
  ctx.strokeStyle = rgba([170, 120, 100], 0.55);
  [-22, -10, 2, 14, 26].forEach((row, i) => {
    ctx.beginPath(); ctx.moveTo(-20, row); ctx.lineTo(i % 2 ? 12 : 20, row); ctx.stroke();
  });
  ctx.restore();
}

function createDiy(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  if (!plate || !sheet || !peopleSheet) throw new Error('The Diy page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = DIY_SPRITES.letters.sprites;
  const span = wordSpan(sprites);
  const scale = Math.min(MAX_W / span.width, MAX_H / span.height);
  const letters = makeLetters(sprites, { scale, left: (STAGE_W - span.width * scale) / 2, feet: FEET });
  const under = stage.keep(tintSheet(sheet, rgba(RED.ink, 0.8)));
  /* each letter's own colour: the sheet with a flat tint over its shapes only (source-atop), cardboard seams still showing */
  const coloured = PARTS.map(({ colour }) => {
    const out = stage.keep(makeCanvas(sheet.naturalWidth, sheet.naturalHeight));
    const c = context(out);
    c.drawImage(sheet, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = rgba(colour, colour[0] < 200 ? 0.8 : TINT);
    c.fillRect(0, 0, out.width, out.height);
    return out;
  });

  /* the box on the wall, centred above the middle letter */
  const box = wallBox(letters[1].px, 250, 210);

  /* the people: one scale each, from their cheering pose, used for both of their poses */
  const people = PARTS.map((part, i) => {
    const cheer = spriteNamed(DIY_SPRITES.people.sprites, part.cheer);
    const work = spriteNamed(DIY_SPRITES.people.sprites, part.work);
    return { work, cheer, scale: PERSON_H / part.body, x: letters[i].px - 78, phase: 1.3 + i * 2.1 };
  });
  const hand = (i: number): { x: number; y: number } => ({ x: people[i].x + 6, y: PERSON_FEET - PERSON_H * 0.62 });

  return loopPage(stage, {
    loop: SETTLE,
    rest: SETTLE,
    once: true,
    step(t, clock, input) {
      stepLetters(letters, input);
      letters.forEach((letter, i) => {
        const u = t - PARTS[i].at;
        const built = rise(u);
        const flat = 0.12 + 0.88 * built;
        // sways a hair, more as it stands
        restPose(letter, clock, 0.006 * clamp(built));
        letter.lift += hop(u, 0.3, 34) + hop(t - TOGETHER, 0.38, 46);
        letter.scaleY *= flat;
        letter.scaleX *= flat > 1 ? 1 - (flat - 1) * 0.5 : 1;
        // lying flat it rests on the bench top, and drops to the floor line as it stands
        letter.lift += LIE * (1 - clamp(flat));
      });
    },
    draw(t, clock) {
      /* printed sheet: the workshop, the box on the wall with its lights blinking while the sheets leave, faint rings */
      stage.backdrop(plate, 0.72);
      drawWallBox(base, k, box);
      const sending = smoothstep(0, 0.08, t) * (1 - smoothstep(PAPER_FLIGHT, PAPER_FLIGHT + 0.25, t));
      drawSensingRings(base, k, box, clock, 0);
      drawBoxLights(base, k, box, [sending, sending, sending, sending].map((v, i) => v * (0.75 + 0.25 * Math.sin(t * 40 + i))));
      stage.tooth();

      /* floating sheet: the letters, lying flat or standing, each with its own colour once built */
      letters.forEach((letter) => drawLetter(word, under, letter, k, 10, 12));
      letters.forEach((letter, i) => {
        drawLetter(word, sheet, letter, k);
        const built = clamp(rise(t - PARTS[i].at) * 1.4);
        if (built > 0.01) {
          word.globalAlpha = built;
          drawLetter(word, coloured[i], letter, k);
          word.globalAlpha = 1;
        }
      });

      /* in front: the people, and the three sheets of paper on their way */
      people.forEach((person, i) => {
        const u = t - PARTS[i].at;
        const cheering = u >= 0;
        const sprite = cheering ? person.cheer : person.work;
        const squash = wobble(u) + 0.035 * Math.sin(clock * 2.1 + person.phase);
        const sway = 0.012 * Math.sin(clock * 1.5 + person.phase * 1.7);
        drawSprite(fg, peopleSheet, sprite, k, { x: person.x, y: PERSON_FEET, scale: person.scale, squash, angle: sway });
      });
      people.forEach((_, i) => {
        const fly = clamp((t - 0.02 * i) / PAPER_FLIGHT);
        const away = smoothstep(PAPER_FLIGHT, PAPER_FLIGHT + 0.12, t);
        if (fly <= 0 || away >= 1) return;
        const e = easeOut(fly);
        const to = hand(i);
        const x = lerp(box.x + box.w / 2, to.x, e);
        // out of the box, then down: a small arc
        const y = lerp(box.y + box.h * 0.7, to.y, e * e * 0.6 + e * 0.4) - Math.sin(fly * Math.PI) * 40;
        drawPaper(fg, k, x, y, (i - 1) * 0.5 + fly * (3.2 + i), 1 - away, lerp(0.35, 1, e));
      });
    },
  });
}

export const jarvisDiy: LiveScene = { id: 'jarvis-diy', sources: Object.values(SRC), create: createDiy };
