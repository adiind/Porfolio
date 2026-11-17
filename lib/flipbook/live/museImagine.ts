/** Muse book, picture page: IMAGINE. Helpers in museKit.ts. */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, springTo, type Spring } from './motion';
import { bob, crossed, lay, sheets, side, srcOf } from './museKit';
import { IMAGINE_SPRITES } from './sprites/imagine';
import {
  STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan, type Letter, type SheetSprite, type Stage,
} from './stage';
import type { LivePage, LiveScene } from './types';

/* =============================== 3. IMAGINE =============================== */
/* The maker sketches. The word appears first as a pencil outline, left to right, then fills with
   colour; when it is whole, Muse pops up beside it and jumps. */
const IMAGINE_SRC = srcOf('imagine');
function createImagine(images: BookImages, width: number, height: number): LivePage {
  const s = sheets(images, IMAGINE_SRC, 'Imagine');
  const stage = createStage(width, height);
  const { k, word, fg } = stage;
  const letters = lay(IMAGINE_SPRITES.letters.sprites, 1560, 930);
  const back = side(stage, s.letters, '#8a5a05');
  const pencil = side(stage, s.letters, '#6b4a10');
  const people = IMAGINE_SPRITES.people.sprites;
  const L = letters[0].px - letters[0].w * letters[0].scale / 2 - 20;
  const R = letters[letters.length - 1].px + letters[letters.length - 1].w * letters[letters.length - 1].scale / 2 + 20;
  // the whole story plays once in two seconds, then holds
  const sketch = (t: number) => lerp(L, R, smoothstep(0, 0.8, t));
  const fill = (t: number) => lerp(L, R, smoothstep(0.6, 1.5, t));
  const POP = 1.5;
  const pop: Spring = { x: 0, v: 0 };
  return loopPage(stage, {
    loop: 2,
    rest: 2,
    once: true,
    enter() { pop.x = 0; pop.v = 0; },
    step(t, clock, input) {
      stepLetters(letters, input);
      if (crossed(t, input.dt, 1.5)) hopInTurn(letters, 0.05, 0);
      const goal = t > POP ? 1 : 0;
      if (input.dt > 0) springTo(pop, goal, 10, 0.4, input.dt); else pop.x = goal;
      letters.forEach((letter) => restPose(letter, clock, 0.007));
    },
    draw(t, clock) {
      stage.backdrop(s.plate, 0.85);
      stage.tooth();
      const sx = sketch(t);
      const fx = fill(t);
      word.save();
      word.beginPath(); word.rect(0, 0, sx * k, height); word.clip();
      word.globalAlpha = 0.5;
      letters.forEach((letter) => drawLetter(word, pencil, letter, k, 1.5 * Math.sin(clock * 8 + letter.phase), 0));
      word.restore();
      word.save();
      word.beginPath(); word.rect(0, 0, fx * k, height); word.clip();
      letters.forEach((letter) => { drawLetter(word, back, letter, k, 6, 7); drawLetter(word, s.letters, letter, k); });
      word.restore();
      const shown = t > 1.4;
      drawSprite(fg, s.people, spriteNamed(people, shown ? 'maker-show' : 'maker-draw'), k, { x: 150, y: 1184, scale: 1.4 });
      if (pop.x > 0.02) {
        const joy = t > 1.7;
        drawSprite(fg, s.people, spriteNamed(people, joy ? 'muse-joy' : 'muse-look'), k, {
          x: 1780, y: 1186 - (joy ? bob(clock, 2.6, 12) : 0), scale: 1.7 * clamp(pop.x, 0, 1.2),
        });
      }
    },
  });
}
export const museImagine: LiveScene = { id: 'muse-imagine', sources: Object.values(IMAGINE_SRC), create: createImagine };
