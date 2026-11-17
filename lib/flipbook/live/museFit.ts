/** Muse book, picture page: FIT. Helpers in museKit.ts. */

import type { BookImages } from '../pageArt';
import { clamp, lerp, rgba, smoothstep, springTo, type Spring } from './motion';
import { bob, crossed, lay, sheets, side, srcOf } from './museKit';
import { FIT_SPRITES } from './sprites/fit';
import {
  STAGE_W, createStage, drawLetter, drawSprite, hopInTurn, loopPage, makeLetters, onLetter, restPose, spriteNamed,
  stepLetters, tintSheet, wordSpan, type Letter, type SheetSprite, type Stage,
} from './stage';
import type { LivePage, LiveScene } from './types';

/* =============================== 4. FIT =============================== */
/* A caliper measures the empty dot spot above the i. Two people lift the board in; it drops into place
   as the dot of the i. Click: it fits, the letters hop, they cheer. */
const FIT_SRC = srcOf('fit', true);
function createFit(images: BookImages, width: number, height: number): LivePage {
  const s = sheets(images, FIT_SRC, 'Fit');
  const stage = createStage(width, height);
  const { k, word, fg } = stage;
  const letters = lay(FIT_SPRITES.letters.sprites, 1440, 1060);
  const back = side(stage, s.letters, '#1d3563');
  const people = FIT_SPRITES.people.sprites;
  const parts = FIT_SPRITES.parts.sprites;
  const board = spriteNamed(parts, 'board');
  const caliper = spriteNamed(parts, 'caliper');
  const i = letters[1];
  const iSrc = FIT_SPRITES.letters.sprites[1].source as unknown as [number, number, number, number];
  const stemW = iSrc[2] * i.scale;
  const bScale = (stemW * 1.2) / board.rect[2];
  const bw = board.rect[2] * bScale;
  const bh = board.rect[3] * bScale;
  const gap = stemW * 0.16;
  const SEAT = 1.4;
  const dotSpot = () => {
    const top = onLetter(i, iSrc[0] + iSrc[2] / 2, iSrc[1]);
    return { x: top.x, y: top.y - gap };
  };
  return loopPage(stage, {
    loop: 2,
    rest: 2,
    once: true,
    step(t, clock, input) {
      stepLetters(letters, input);
      if (crossed(t, input.dt, SEAT)) hopInTurn(letters, 0.06, 0);
      letters.forEach((letter) => restPose(letter, clock, 0.005));
    },
    draw(t, clock) {
      stage.backdrop(s.plate, 0.85);
      stage.tooth();
      letters.forEach((letter) => { drawLetter(word, back, letter, k, 7, 8); drawLetter(word, s.letters, letter, k); });
      const spot = dotSpot();
      // the board falls from above the page straight onto the i, gathering speed, then settles as its dot
      const p = clamp((t - 0.35) / (SEAT - 0.35));
      const since = Math.max(0, t - SEAT);
      const settle = 12 * Math.exp(-since * 9) * Math.sin(since * 24);
      const breathe = t > SEAT + 0.4 ? 1 + 0.01 * Math.sin(clock * 2.2) : 1;
      const by = spot.y - (1 - p * p) * 900 + settle;
      if (p > 0) drawSprite(fg, s.parts, board, k, { x: spot.x, y: by, scale: bScale * breathe, angle: (1 - p) * 0.06 });
      // the caliper measures the empty dot spot first, then gets out of the way
      const measure = smoothstep(0, 0.8, t);
      const cx = lerp(spot.x - 360, spot.x + 40, measure);
      drawSprite(fg, s.parts, caliper, k, { x: cx, y: spot.y - bh * 0.5 - 20, scale: stemW * 1.6 / caliper.rect[2] * 1.4, alpha: 1 - smoothstep(0.7, 0.95, t) });
      // the two hold the f and the t steady while it lands, then cheer
      const done = t > SEAT;
      const fL = letters[0].px - (letters[0].w * letters[0].scale) / 2;
      const tR = letters[2].px + (letters[2].w * letters[2].scale) / 2;
      const cheer = done ? bob(clock, 2.6, 8) : 0;
      drawSprite(fg, s.people, spriteNamed(people, done ? 'maker-cheer' : 'maker-push'), k, { x: fL - 70, y: 1184 - cheer, scale: 1.4 });
      drawSprite(fg, s.people, spriteNamed(people, done ? 'girl-clap' : 'girl-push'), k, { x: tR + 70, y: 1184 - (done ? bob(clock, 2.6, 6, 1) : 0), scale: 1.4, flip: !done });
    },
  });
}
export const museFit: LiveScene = { id: 'muse-fit', sources: Object.values(FIT_SRC), create: createFit };
