/** Muse book, picture page: TANGIBLE. Helpers in museKit.ts. */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, springTo, type Spring } from './motion';
import { bob, crossed, lay, sheets, side, srcOf } from './museKit';
import { TANGIBLE_SPRITES } from './sprites/tangible';
import {
  STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan, type Letter, type SheetSprite, type Stage,
} from './stage';
import type { LivePage, LiveScene } from './types';

/* =============================== 1. TANGIBLE =============================== */
/* Ghost letters, like things on a screen, turn solid one by one as a small Muse walks past them
   toward the maker. He looks up from his phone, and they wave. */
const TANGIBLE_SRC = srcOf('tangible');
function createTangible(images: BookImages, width: number, height: number): LivePage {
  const s = sheets(images, TANGIBLE_SRC, 'Tangible');
  const stage = createStage(width, height);
  const { k, word, fg } = stage;
  const letters = lay(TANGIBLE_SPRITES.letters.sprites, 1840, 960);
  const back = side(stage, s.letters, '#5b2f7a');
  const ghost = side(stage, s.letters, '#cdb8f2');
  const people = TANGIBLE_SPRITES.people.sprites;
  const PLAY = 2;
  const ARRIVE = 1.4;
  const last = letters.length - 1;
  /* Muse starts inside the page on the right and trots left to the maker */
  const walkX = (t: number) => lerp(1950, 470, smoothstep(0, ARRIVE, t));
  /* a fast right-to-left wave as Muse passes; everything solid by 1.5 s */
  const solidOf = (letter: Letter, t: number) => Math.max(
    smoothstep(letter.px + 90, letter.px - 60, walkX(t)),
    smoothstep(1.3 + (1 - letter.index / last) * 0.1, 1.45 + (1 - letter.index / last) * 0.05, t));
  const was = letters.map(() => 0);
  return loopPage(stage, {
    loop: PLAY,
    rest: PLAY,
    once: true,
    enter() { was.fill(0); },
    step(t, clock, input) {
      stepLetters(letters, input);
      letters.forEach((letter, i) => {
        const solid = solidOf(letter, t);
        if (input.dt > 0 && solid > 0.6 && was[i] <= 0.6) letter.hop.v += 380;
        was[i] = solid;
        restPose(letter, clock, 0.006 + (1 - solid) * 0.01);
        letter.lift += (1 - solid) * (14 + 10 * Math.sin(clock * 1.6 + letter.phase));
      });
    },
    draw(t, clock) {
      stage.backdrop(s.plate, 0.85);
      stage.tooth();
      letters.forEach((letter) => {
        const solid = solidOf(letter, t);
        word.save();
        word.globalAlpha = 0.28 + 0.1 * Math.sin(clock * 3 + letter.phase);
        drawLetter(word, ghost, letter, k);
        word.restore();
        if (solid > 0.01) {
          word.save();
          word.globalAlpha = solid;
          drawLetter(word, back, letter, k, 7, 8);
          drawLetter(word, s.letters, letter, k);
          word.restore();
        }
      });
      // the maker on the left, his phone, then looking up, then waving
      const mx = 170;
      const pose = t < 0.8 ? 'maker-phone' : t < 1.5 ? 'maker-look' : 'maker-wave';
      if (pose === 'maker-phone') {
        const glow = fg.createRadialGradient((mx + 40) * k, 880 * k, 0, (mx + 40) * k, 880 * k, 90 * k);
        glow.addColorStop(0, rgba([235, 220, 255], 0.55 + 0.2 * Math.sin(clock * 7)));
        glow.addColorStop(1, rgba([235, 220, 255], 0));
        fg.fillStyle = glow;
        fg.fillRect((mx - 60) * k, 790 * k, 200 * k, 180 * k);
      }
      drawSprite(fg, s.people, spriteNamed(people, pose), k, { x: mx, y: 1180, scale: 1.5, squash: pose === 'maker-wave' ? 0.015 * Math.sin(clock * 3) : pose === 'maker-look' && t < 0.95 ? 0.05 : 0 });
      // Muse walks in from the right
      const x = walkX(t);
      const walking = t < ARRIVE;
      const mPose = walking ? (Math.sin(t * 11) > 0 ? 'muse-walk-a' : 'muse-walk-b') : 'muse-wave';
      drawSprite(fg, s.people, spriteNamed(people, mPose), k, { x, y: 1186 - (walking ? bob(t, 11, 9) : bob(clock, 2.4, 5)), scale: 1.75 });
    },
  });
}
export const museTangible: LiveScene = { id: 'muse-tangible', sources: Object.values(TANGIBLE_SRC), create: createTangible };
