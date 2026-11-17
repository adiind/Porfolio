/**
 * "Bloom": the flowers are 3D printed.
 *
 * The word is printed in front of the reader, layer by layer from the table
 * up, the nozzle running back and forth along its rail. When the last layer
 * is down the two O's open into flowers, the way Surya's printed flowers
 * open, and the two people watching celebrate. Then it starts again.
 */

import type { BookImages } from '../pageArt';
import { clamp, rgba, smoothstep, springTo, type Rgb, type Spring } from './motion';
import { drawBloom } from './shapes';
import { BLOOM_SPRITES } from './sprites/bloom';
import {
  STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan,
} from './stage';
import type { LivePage, LiveScene } from './types';

const DIR = '/images/flipbook/surya/bloom';
const SRC = { plate: `${DIR}/plate.webp`, letters: `${DIR}/letters.webp`, people: `${DIR}/people.webp` };

const LOOP = 11.8;
const WORD_W = 1930;
const FEET = 986;
/** How much of the word's height has to be printed for it to be whole. */
const FULL = 548;
const PRINT_FROM = 0.4;
const PRINT_TO = 5.4;
const OPEN_FROM = 5.7;
const OPEN_TO = 9.6;
const WIPE_FROM = 10.2;
const WIPE_TO = 11;

const MAROON: Rgb = [112, 22, 16];
const SCARLET: Rgb = [222, 60, 44];
const CREAM: Rgb = [255, 238, 216];
const CORAL: Rgb = [246, 138, 118];

const printed = (t: number): number => FULL * clamp((t - PRINT_FROM) / (PRINT_TO - PRINT_FROM)) * (1 - smoothstep(WIPE_FROM, WIPE_TO, t));

function createBloomPage(images: BookImages, width: number, height: number): LivePage {
  const plate = images.get(SRC.plate);
  const sheet = images.get(SRC.letters);
  const peopleSheet = images.get(SRC.people);
  if (!plate || !sheet || !peopleSheet) throw new Error('The Bloom page is missing a picture.');

  const stage = createStage(width, height);
  const { k, base, word, fg } = stage;
  const sprites = BLOOM_SPRITES.letters.sprites;
  const letters = makeLetters(sprites, { scale: WORD_W / wordSpan(sprites).width, left: (STAGE_W - WORD_W) / 2, feet: FEET });
  const side = stage.keep(tintSheet(sheet, '#c9783f'));
  const people = BLOOM_SPRITES.people.sprites;
  const rings = [2, 3].map((index) => {
    const [hx, hy, hw, hh] = sprites[index].holes[0];
    return { letter: letters[index], cx: hx + hw / 2, cy: hy + hh / 2, rx: hw / 2 };
  });
  const open: Spring = { x: 0, v: 0 };

  return loopPage(stage, {
    loop: LOOP,
    rest: 8,
    enter() { open.x = 0; open.v = 0; },
    step(t, clock, input) {
      stepLetters(letters, input);
      const goal = t >= OPEN_FROM && t < OPEN_TO ? 1 : 0;
      if (input.dt > 0) {
        if (goal === 1 && t - input.dt < OPEN_FROM) hopInTurn(letters, 0.05, 0);
        springTo(open, goal, goal ? 7 : 11, goal ? 0.34 : 1, input.dt);
      } else {
        open.x = goal; open.v = 0;
      }
      letters.forEach((letter) => restPose(letter, clock, 0.006));
    },
    draw(t, clock) {
      const h = printed(t);
      const printing = t > PRINT_FROM && t < PRINT_TO;
      const bloom = open.x * (1 + 0.035 * Math.sin(clock * 2.4) * clamp(open.x));

      stage.backdrop(plate, 0.8);
      stage.tooth();

      /* floating sheet: petals behind the two O's, the word as far as it is printed, the hearts of the flowers */
      if (open.x > 0.02) {
        rings.forEach((ring, i) => {
          const centre = onLetter(ring.letter, ring.cx, ring.cy);
          word.save();
          word.globalAlpha = clamp(open.x * 3);
          word.translate(centre.x * k, centre.y * k);
          word.rotate(ring.letter.angle + (i ? 0.3 : -0.2));
          drawBloom(word, 292 * (0.5 + 0.5 * clamp(bloom, 0, 1.15)) * k, bloom, i ? SCARLET : CORAL, i ? CORAL : SCARLET, MAROON, 5 * k, false);
          word.restore();
        });
      }
      word.save();
      word.beginPath();
      word.rect(0, (FEET - h) * k, width, (h + 60) * k);
      word.clip();
      letters.forEach((letter) => drawLetter(word, side, letter, k, 7, 8));
      letters.forEach((letter) => drawLetter(word, sheet, letter, k));
      if (printing) {
        // the layer just laid down is still hot
        word.globalCompositeOperation = 'source-atop';
        const hot = word.createLinearGradient(0, (FEET - h) * k, 0, (FEET - h + 26) * k);
        hot.addColorStop(0, rgba([255, 120, 70], 0.95));
        hot.addColorStop(1, rgba([255, 120, 70], 0));
        word.fillStyle = hot;
        word.fillRect(0, (FEET - h) * k, width, 26 * k);
        word.globalCompositeOperation = 'source-over';
      }
      word.restore();
      if (open.x > 0.02) {
        rings.forEach((ring, i) => {
          const centre = onLetter(ring.letter, ring.cx, ring.cy);
          word.save();
          word.globalAlpha = clamp(open.x * 3);
          word.translate(centre.x * k, centre.y * k);
          word.rotate(ring.letter.angle + (i ? -0.25 : 0.2) + (1 - clamp(open.x)) * 0.8);
          drawBloom(word, ring.rx * ring.letter.scale * 1.42 * k, bloom, i ? CREAM : SCARLET, i ? SCARLET : CREAM, MAROON, 4 * k, true);
          word.restore();
        });
      }

      /* in front: the printer and the two who watch */
      const tip = FEET - h;
      const rail = tip - 74;
      const carriage = printing ? 1000 + 830 * Math.sin(t * 6.4) : 1000;
      fg.fillStyle = rgba(MAROON);
      [44, 1930].forEach((x) => fg.fillRect(x * k, 330 * k, 26 * k, 720 * k));
      fg.fillStyle = rgba([150, 34, 24]);
      fg.fillRect(40 * k, rail * k, 1920 * k, 18 * k);
      fg.fillStyle = rgba(SCARLET);
      fg.fillRect((carriage - 52) * k, (rail - 22) * k, 104 * k, 62 * k);
      fg.fillStyle = rgba(MAROON);
      fg.beginPath();
      fg.moveTo((carriage - 20) * k, (rail + 40) * k);
      fg.lineTo((carriage + 20) * k, (rail + 40) * k);
      fg.lineTo((carriage + 5) * k, tip * k);
      fg.lineTo((carriage - 5) * k, tip * k);
      fg.closePath();
      fg.fill();
      if (printing) {
        const glow = fg.createRadialGradient(carriage * k, tip * k, 0, carriage * k, tip * k, 46 * k);
        glow.addColorStop(0, rgba([255, 214, 150], 0.9));
        glow.addColorStop(1, rgba([255, 214, 150], 0));
        fg.fillStyle = glow;
        fg.fillRect((carriage - 46) * k, (tip - 46) * k, 92 * k, 92 * k);
      }
      const joy = clamp(open.x) > 0.5;
      const jump = joy ? Math.abs(Math.sin(clock * 5.4)) : 0;
      drawSprite(fg, peopleSheet, spriteNamed(people, joy ? 'maker-cheer' : 'maker-watch'), k, { x: 236, y: 1172 - jump * 20, scale: 0.8 });
      drawSprite(fg, peopleSheet, spriteNamed(people, joy ? 'girl-jump' : 'girl-hold'), k, { x: 1764, y: 1172 - jump * 46, scale: 0.8 });
    },
  });
}

export const suryaBloom: LiveScene = { id: 'surya-bloom', sources: Object.values(SRC), create: createBloomPage };
