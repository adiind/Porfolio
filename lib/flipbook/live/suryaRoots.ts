/**
 * "Roots": the mandala comes from home.
 *
 * In the courtyard of a family home in India, a woman draws a rangoli on the
 * floor while a child watches. As her pattern grows ring by ring, the same
 * mandala fills the two O's of the word, and the letters hop each time a
 * ring is finished. Then the powder is swept away and she begins again.
 */

import type { BookImages } from '../pageArt';
import { clamp, hash, rgba, smoothstep, type Rgb } from './motion';
import { MANDALA_STEPS, drawLamp, drawMandala, type MandalaPalette } from './shapes';
import { ROOTS_SPRITES } from './sprites/roots';
import {
  STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan,
} from './stage';
import type { LivePage, LiveScene } from './types';

const DIR = '/images/flipbook/surya/roots';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, people: `${DIR}/people.webp` };

const PALETTE: MandalaPalette = {
  deep: [112, 18, 44], strong: [204, 40, 76], mid: [238, 108, 130], pale: [252, 200, 204], cream: [255, 240, 222],
};
const FLAME: Rgb = [255, 214, 150];

/** Story: draw for DRAW seconds, admire until HOLD_END, sweep away by SWEEP_END. */
const LOOP = 11.4;
const DRAW = 6.4;
const HOLD_END = 9.8;
const SWEEP_END = 10.5;

const FLOOR = { x: 1000, y: 1052, r: 392, squash: 0.265 };
const WORD_W = 1960;

function createRoots(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  if (!plate || !sheet || !peopleSheet) throw new Error('The Roots page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = ROOTS_SPRITES.letters.sprites;
  const letters = makeLetters(sprites, { scale: WORD_W / wordSpan(sprites).width, left: (STAGE_W - WORD_W) / 2, feet: 905 });
  const side = stage.keep(tintSheet(sheet, '#b9415e'));
  const people = ROOTS_SPRITES.people.sprites;
  // the two O's: the middle of each opening, on the letter sheet
  const rings = [1, 2].map((index) => {
    const [hx, hy, hw, hh] = sprites[index].holes[0];
    return { letter: letters[index], cx: hx + hw / 2, cy: hy + hh / 2, rx: hw / 2, ry: hh / 2 };
  });

  let finished = 0;

  const growth = (t: number): number => {
    if (t < DRAW) return (t / DRAW) * MANDALA_STEPS;
    if (t < HOLD_END) return MANDALA_STEPS;
    return MANDALA_STEPS * (1 - smoothstep(HOLD_END, SWEEP_END, t));
  };

  return loopPage(stage, {
    loop: LOOP,
    rest: 8.4,
    enter() { finished = 0; hopInTurn(letters); },
    step(t, clock, input) {
      stepLetters(letters, input);
      // every finished ring makes the word hop
      const done = t < DRAW + 0.2 ? Math.floor(growth(t) + 0.02) : t < HOLD_END ? MANDALA_STEPS : 0;
      if (done > finished && input.dt > 0) hopInTurn(letters, 0.055, 0);
      finished = done;
      letters.forEach((letter) => restPose(letter, clock, 0.011));
    },
    draw(t, clock) {
      const progress = growth(t);
      const drawing = t < DRAW;
      const admiring = t >= DRAW && t < HOLD_END;

      /* the printed sheet: courtyard, the rangoli on the floor, lamps */
      stage.backdrop(plate, 0.6);
      base.save();
      base.translate(FLOOR.x * k, FLOOR.y * k);
      base.scale(1, FLOOR.squash);
      // a chalk guide, always there
      base.strokeStyle = rgba(PALETTE.cream, 0.4);
      base.lineWidth = 5 * k;
      base.setLineDash([16 * k, 18 * k]);
      base.beginPath(); base.arc(0, 0, FLOOR.r * k, 0, Math.PI * 2); base.stroke();
      base.setLineDash([]);
      drawMandala(base, FLOOR.r * k, progress, PALETTE, 6 * k);
      base.restore();
      [[190, 1010], [1810, 1010], [690, 1168], [1310, 1168]].forEach(([x, y], i) => {
        const flicker = Math.sin(clock * (7 + i) + i * 2.1) * 0.5 + Math.sin(clock * 13.3 + i) * 0.5;
        drawLamp(base, x * k, y * k, 15 * k, flicker, PALETTE.deep, FLAME);
      });
      stage.tooth();

      /* the word: each O holds the same mandala, a beat behind the floor */
      rings.forEach((ring, i) => {
        const centre = onLetter(ring.letter, ring.cx, ring.cy);
        const r = ring.rx * ring.letter.scale * 1.05;
        const spin = admiring ? (t - DRAW) * 0.22 * (i === 0 ? 1 : -1) : 0;
        word.save();
        word.translate(centre.x * k, centre.y * k);
        word.rotate(ring.letter.angle);
        word.scale(1, ring.ry / ring.rx);
        word.fillStyle = rgba(PALETTE.deep, 0.92);
        word.beginPath(); word.arc(0, 0, r * k, 0, Math.PI * 2); word.fill();
        word.rotate(spin);
        drawMandala(word, r * 0.94 * k, clamp(progress - 0.35 * (i + 1), 0, MANDALA_STEPS), PALETTE, 3.4 * k);
        word.restore();
      });
      letters.forEach((letter) => drawLetter(word, side, letter, k, 6, 7));
      letters.forEach((letter) => drawLetter(word, sheet, letter, k));

      /* in front: the two people at the rangoli */
      const beat = Math.floor(t * 2.3) % 2;
      const clap = admiring ? Math.floor(clock * 5) % 2 : 0;
      drawSprite(fg, peopleSheet, spriteNamed(people, clap ? 'child-b' : 'child-a'), k, { x: 470, y: 1170, scale: 1.2, squash: clap ? 0.03 : 0 });
      const reach = drawing && beat === 1;
      drawSprite(fg, peopleSheet, spriteNamed(people, reach ? 'woman-b' : 'woman-a'), k, { x: reach ? 1512 : 1538, y: 1172, scale: 1.25 });
      if (drawing) {
        // powder falling from her fingers
        for (let i = 0; i < 6; i += 1) {
          const u = (clock * 1.8 + i / 6) % 1;
          fg.fillStyle = rgba(i % 2 ? PALETTE.cream : PALETTE.strong, 1 - u);
          fg.beginPath();
          fg.arc((1396 + Math.sin(i * 2.4 + hash(i) * 6) * 8 - (reach ? 34 : 0)) * k, (1078 + u * 46) * k, 4.5 * k, 0, Math.PI * 2);
          fg.fill();
        }
      }
    },
  });
}

export const suryaRoots: LiveScene = { id: 'surya-roots', sources: Object.values(SRC), create: createRoots };
